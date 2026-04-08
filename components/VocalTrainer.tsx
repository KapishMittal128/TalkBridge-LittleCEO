import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  AudioModule,
  RecordingPresets,
  type AudioRecorder,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CheckCircle2, Mic, Play, RefreshCcw, Sparkles, Volume2, X } from 'lucide-react-native';
import {
  checkBackendHealth,
  fetchTrainingSamples,
  getTrainingSamplePlaybackSource,
  uploadTrainingSample,
  type TrainingResponse,
  type TrainingSampleInfo,
} from '@/lib/recognition';
import { configureAudioSession, requestMicrophonePermission } from '@/lib/permissions';
import { getCategoryMeta } from '@/constants/categories';
import { Colors, Layout, Motion, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useDataStore, type SoundCard } from '@/store/data-store';
import { useAudioStore } from '@/store/audio-store';
import { VoiceWavePlaceholder } from './ui/VoiceWavePlaceholder';
import { PermissionBlockedState } from './ui/PermissionBlockedState';
import { useAuth } from '@/contexts/AuthContext';

interface VocalTrainerProps {
  isVisible: boolean;
  onClose: () => void;
  soundCard: SoundCard;
  backendAvailable?: boolean | null;
}

type RecorderConstructor = new (options: typeof RecordingPresets.HIGH_QUALITY) => AudioRecorder;

function createTrainerRecorder(): AudioRecorder {
  const recorderModule = AudioModule as unknown as {
    AudioRecorder?: RecorderConstructor;
    AudioRecorderWeb?: RecorderConstructor;
  };

  const RecorderClass = recorderModule.AudioRecorder ?? recorderModule.AudioRecorderWeb;

  if (!RecorderClass) {
    throw new Error('Audio recording is not available on this device.');
  }

  return new RecorderClass(RecordingPresets.HIGH_QUALITY);
}

function getTrainerErrorMessage(error: unknown) {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : null;

  if (code === 'SILENCE_DETECTED') {
    return 'No voice detected. Try making the sound a little louder.';
  }

  if (code === 'TOO_SHORT') {
    return 'That sample was too short. Hold the button for the full sound.';
  }

  if (code === 'CONSISTENCY_MISMATCH') {
    return 'That sample was too different from the saved sound. Try matching your earlier examples.';
  }

  if (code === 'AUDIO_QUALITY_LOW') {
    return 'That sample sounded noisy or clipped. Try again in a quieter space.';
  }

  return 'This sample could not be saved. Please try again.';
}

function formatSampleDuration(seconds?: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) {
    return 'Length unavailable';
  }

  if (seconds < 1) {
    return `${Math.max(0.1, seconds).toFixed(1)}s`;
  }

  return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`;
}

function getTrainingStatus(sampleCount: number): SoundCard['training_status'] {
  if (sampleCount >= 3) {
    return 'ready';
  }
  if (sampleCount > 0) {
    return 'needs_more_samples';
  }
  return 'draft';
}

function getNextSampleIndex(samples: TrainingSampleInfo[]) {
  if (samples.length === 0) {
    return 1;
  }

  const sorted = [...samples]
    .map((sample) => sample.sample_index)
    .filter((sampleIndex) => Number.isFinite(sampleIndex))
    .sort((left, right) => left - right);

  let expected = 1;
  for (const sampleIndex of sorted) {
    if (sampleIndex > expected) {
      break;
    }
    if (sampleIndex === expected) {
      expected += 1;
    }
  }

  return expected;
}

function SampleRow({
  sample,
  selected,
  playing,
  disabled,
  onSelect,
  onPlay,
}: {
  sample: TrainingSampleInfo;
  selected: boolean;
  playing: boolean;
  disabled: boolean;
  onSelect: () => void;
  onPlay: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      style={({ pressed }) => [
        styles.sampleRow,
        selected && styles.sampleRowSelected,
        disabled && styles.sampleRowDisabled,
        pressed && styles.sampleRowPressed,
      ]}
    >
      <View style={[styles.sampleIndexBubble, selected && styles.sampleIndexBubbleSelected]}>
        {playing ? (
          <Volume2 size={14} color={Colors.primary} />
        ) : (
          <Text style={[styles.sampleIndexText, selected && styles.sampleIndexTextSelected]}>
            {sample.sample_index}
          </Text>
        )}
      </View>

      <View style={styles.sampleCopy}>
        <Text style={styles.sampleTitle}>Sample {sample.sample_index}</Text>
        <Text style={styles.sampleMeta}>
          {formatSampleDuration(sample.duration_seconds)} - Tap to replace
        </Text>
      </View>

      <Pressable
        onPress={(event) => {
          event.stopPropagation();
          onPlay();
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.samplePlayButton,
          selected && styles.samplePlayButtonSelected,
          disabled && styles.samplePlayButtonDisabled,
          pressed && styles.samplePlayButtonPressed,
        ]}
        hitSlop={8}
      >
        <Play size={13} color={selected ? Colors.surface : Colors.primary} fill={selected ? Colors.surface : Colors.primary} />
      </Pressable>
    </Pressable>
  );
}

function CoreCalibrationRow({
  slot,
  sample,
  selected,
  playing,
  disabled,
  onSelect,
  onPlay,
}: {
  slot: number;
  sample: TrainingSampleInfo | null;
  selected: boolean;
  playing: boolean;
  disabled: boolean;
  onSelect: () => void;
  onPlay: () => void;
}) {
  return (
    <View style={[styles.coreRow, selected && styles.coreRowSelected, disabled && styles.controlDisabled]}>
      <View style={styles.coreRowLeft}>
        <View style={[styles.sampleIndexBubble, selected && styles.sampleIndexBubbleSelected]}>
          {playing ? (
            <Volume2 size={14} color={Colors.primary} />
          ) : (
            <Text style={[styles.sampleIndexText, selected && styles.sampleIndexTextSelected]}>{slot}</Text>
          )}
        </View>
        <View style={styles.sampleCopy}>
          <Text style={styles.sampleTitle}>Core sample {slot}</Text>
          <Text style={styles.sampleMeta}>
            {sample ? formatSampleDuration(sample.duration_seconds) : 'Not recorded yet'}
          </Text>
        </View>
      </View>

      <View style={styles.coreRowActions}>
        {sample ? (
          <Pressable onPress={onPlay} disabled={disabled} style={[styles.coreMiniButton, disabled && styles.controlDisabled]} hitSlop={8}>
            <Play size={12} color={Colors.primary} fill={Colors.primary} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onSelect}
          disabled={disabled}
          style={[styles.coreActionButton, selected && styles.coreActionButtonSelected, disabled && styles.controlDisabled]}
        >
          <Text style={[styles.coreActionButtonText, selected && styles.coreActionButtonTextSelected]}>
            {sample ? 'Replace' : 'Record'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function VocalTrainer({ isVisible, onClose, soundCard, backendAvailable = null }: VocalTrainerProps) {
  const { profile } = useAuth();
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playbackObjectUrlRef = useRef<string | null>(null);
  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);

  const [samples, setSamples] = useState<TrainingSampleInfo[]>([]);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(1);
  const [activeSampleIndex, setActiveSampleIndex] = useState<number | null>(null);
  const [savedSampleCount, setSavedSampleCount] = useState(soundCard.sample_count);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [backendOk, setBackendOk] = useState<boolean | null>(backendAvailable);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [trainerError, setTrainerError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playingSampleIndex, setPlayingSampleIndex] = useState<number | null>(null);
  const [enrollmentQuality, setEnrollmentQuality] = useState<'poor' | 'fair' | 'good' | null>(
    soundCard.enrollment_quality ?? null,
  );
  const [distinctivenessStatus, setDistinctivenessStatus] = useState<'good' | 'close' | 'poor' | null>(
    soundCard.distinctiveness_status ?? null,
  );
  const [trainerHint, setTrainerHint] = useState<string | null>(soundCard.recommended_action ?? null);

  const updateCardTrainingStatus = useDataStore((state) => state.updateCardTrainingStatus);
  const categories = useDataStore((state) => state.categories);
  const category = categories.find((item) => item.id === soundCard.category_id);
  const meta = getCategoryMeta(category?.slug);
  const hapticFeedbackEnabled = profile?.haptic_feedback_enabled !== false;

  const pulse = useSharedValue(1);
  const liveStatusPulse = useSharedValue(1);
  const workingSampleIndex = activeSampleIndex ?? selectedSampleIndex;
  const hasSelectedSample = samples.some((sample) => sample.sample_index === selectedSampleIndex);
  const workingSampleExists = samples.some((sample) => sample.sample_index === workingSampleIndex);
  const nextNewSampleIndex = getNextSampleIndex(samples);
  const readyForRecognition = savedSampleCount >= 3;
  const progressToReady = Math.min(savedSampleCount, 3);
  const coreSampleIndexes = [1, 2, 3];
  const coreSamples = coreSampleIndexes.map(
    (sampleIndex) => samples.find((sample) => sample.sample_index === sampleIndex) ?? null,
  );
  const additionalSamples = samples.filter((sample) => sample.sample_index > 3);
  const controlsLocked = isRecording || isUploading || isLoadingSamples;
  const closeDisabled = isRecording || isUploading;
  const sampleControlsDisabled = controlsLocked || backendOk === false;
  const recordDisabled = isUploading || isLoadingSamples || (backendOk === false && !isRecording);

  useEffect(() => {
    if (isRecording) {
      pulse.value = withRepeat(withTiming(1.08, { duration: 700 }), -1, true);
    } else {
      pulse.value = withSpring(1, Motion.spring.settle);
    }
  }, [isRecording, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  useEffect(() => {
    if (isRecording || isUploading || isLoadingSamples) {
      liveStatusPulse.value = withRepeat(withTiming(1.12, { duration: 820 }), -1, true);
    } else {
      liveStatusPulse.value = withSpring(1, Motion.spring.settle);
    }
  }, [isLoadingSamples, isRecording, isUploading, liveStatusPulse]);

  const liveStatusDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: liveStatusPulse.value }],
  }));

  const stopAndUnload = useCallback(async () => {
    const recorder = recorderRef.current;
    setIsRecording(false);

    if (!recorder) return null;

    try {
      await recorder.stop();
      return recorder.uri;
    } catch {
      return null;
    } finally {
      recorderRef.current = null;
    }
  }, []);

  const clearPlaybackObjectUrl = useCallback(() => {
    if (playbackObjectUrlRef.current && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(playbackObjectUrlRef.current);
    }
    playbackObjectUrlRef.current = null;
  }, []);

  const hydrateSamples = useCallback(
    async (keepSelection?: number) => {
      setIsLoadingSamples(true);

      try {
        const remoteSamples = await fetchTrainingSamples(soundCard.id);
        setSamples(remoteSamples);
        setSavedSampleCount(remoteSamples.length);
        setSelectedSampleIndex(keepSelection ?? getNextSampleIndex(remoteSamples));
      } catch (error) {
        setTrainerError(error instanceof Error ? error.message : 'Saved samples could not be loaded.');
      } finally {
        setIsLoadingSamples(false);
      }
    },
    [soundCard.id],
  );

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    setSamples([]);
    setSelectedSampleIndex(Math.max(1, soundCard.sample_count + 1));
    setActiveSampleIndex(null);
    setSavedSampleCount(soundCard.sample_count);
    setBackendOk(backendAvailable);
    setIsLoadingSamples(false);
    setIsUploading(false);
    setIsRecording(false);
    setPermissionBlocked(false);
    setTrainerError(null);
    setPlaybackError(null);
    setPlayingSampleIndex(null);
    setEnrollmentQuality(soundCard.enrollment_quality ?? null);
    setDistinctivenessStatus(soundCard.distinctiveness_status ?? null);
    setTrainerHint(soundCard.recommended_action ?? null);
    useAudioStore.getState().reset();

    void checkBackendHealth().then(setBackendOk).catch(() => setBackendOk(false));
    void hydrateSamples();

    return () => {
      void stopAndUnload();
      player.pause();
      clearPlaybackObjectUrl();
      setPlayingSampleIndex(null);
    };
  }, [
    clearPlaybackObjectUrl,
    hydrateSamples,
    isVisible,
    player,
    soundCard.enrollment_quality,
    soundCard.id,
    soundCard.recommended_action,
    soundCard.sample_count,
    soundCard.distinctiveness_status,
    stopAndUnload,
    backendAvailable,
  ]);

  useEffect(() => {
    if (playingSampleIndex !== null && !playerStatus.playing && playerStatus.didJustFinish) {
      setPlayingSampleIndex(null);
    }
  }, [playerStatus.didJustFinish, playerStatus.playing, playingSampleIndex]);

  const readinessText =
    distinctivenessStatus === 'good'
      ? 'Distinct and ready'
      : distinctivenessStatus === 'close'
        ? 'Usable but close to another sound'
        : distinctivenessStatus === 'poor'
          ? 'Needs a more distinct vocal shape'
          : readyForRecognition
            ? 'Ready'
            : null;

  const coachingText =
    backendOk === false
      ? 'Reconnect to the recognition backend before calibrating or replaying samples for this card.'
      : readyForRecognition
        ? 'TalkBridge now matches this sound from its acoustic fingerprint. Add extra examples or replace any sample if the sound changes over time.'
        : savedSampleCount === 0
          ? 'Make the exact sound you want this card to recognize. Non-verbal or unconventional sounds work because matching is based on the audio itself.'
          : 'Keep the sound shape consistent. More saved examples will make the acoustic matcher more robust.';

  const liveTrainingStatus = (() => {
    if (backendOk === false) {
      return {
        label: 'Recognition service offline. Connect to the backend to play or record calibration samples.',
        tone: 'warning' as const,
      };
    }

    if (permissionBlocked) {
      return {
        label: 'Microphone access is needed before calibration can start.',
        tone: 'warning' as const,
      };
    }

    if (isLoadingSamples) {
      return {
        label: 'Loading saved calibration samples...',
        tone: 'info' as const,
      };
    }

    if (isRecording) {
      return {
        label: workingSampleExists
          ? `Listening to replacement sample ${workingSampleIndex}...`
          : `Listening for sample ${workingSampleIndex}...`,
        tone: 'info' as const,
      };
    }

    if (isUploading) {
      return {
        label: workingSampleExists
          ? `Replacing sample ${workingSampleIndex} in your acoustic profile...`
          : `Saving sample ${workingSampleIndex} to your acoustic profile...`,
        tone: 'info' as const,
      };
    }

    if (trainerError) {
      return {
        label: trainerError,
        tone: 'warning' as const,
      };
    }

    if (readyForRecognition) {
      return {
        label: hasSelectedSample
          ? `Ready. Sample ${selectedSampleIndex} is selected for playback or replacement.`
          : `Ready. Record sample ${selectedSampleIndex} to strengthen this match even more.`,
        tone: distinctivenessStatus === 'poor' ? ('warning' as const) : ('success' as const),
      };
    }

    if (savedSampleCount > 0) {
      return {
        label: `${savedSampleCount} saved. ${Math.max(0, 3 - savedSampleCount)} more sample${savedSampleCount === 2 ? '' : 's'} to finish the reliable baseline.`,
        tone: 'success' as const,
      };
    }

    return {
      label: 'Waiting for the first calibration sample.',
      tone: 'default' as const,
    };
  })();

  async function syncTrainerState(
    response: TrainingResponse,
    preserveSelection: number | undefined,
    keepCurrentSlot: boolean,
  ) {
    const remoteSamples = await fetchTrainingSamples(soundCard.id);
    const nextCount = remoteSamples.length;

    setSamples(remoteSamples);
    setSavedSampleCount(nextCount);
    setEnrollmentQuality(response.enrollment_quality ?? null);
    setDistinctivenessStatus(response.distinctiveness_status ?? null);
    setTrainerHint(response.recommended_action ?? null);
    setSelectedSampleIndex(
      keepCurrentSlot && preserveSelection != null
        ? preserveSelection
        : getNextSampleIndex(remoteSamples),
    );

    await updateCardTrainingStatus(soundCard.id, getTrainingStatus(nextCount), nextCount, {
      enrollment_quality: response.enrollment_quality,
      distinctiveness_status: response.distinctiveness_status,
      consistency_score: response.consistency_score,
      recommended_action: response.recommended_action ?? null,
    });
  }

  async function processSample(uri: string, sampleIndex: number, replacingExisting: boolean) {
    try {
      setIsUploading(true);
      setTrainerError(null);
      setPlaybackError(null);

      const response = await uploadTrainingSample(
        uri,
        soundCard.id,
        soundCard.label,
        soundCard.phrase_output,
        sampleIndex,
      );

      if (response.sound_card_id !== soundCard.id) {
        throw new Error('The training service returned a mismatched sound card response.');
      }

      await syncTrainerState(response, sampleIndex, replacingExisting);

      if (hapticFeedbackEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: unknown) {
      setTrainerError(getTrainerErrorMessage(error));
      if (hapticFeedbackEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsUploading(false);
      setActiveSampleIndex(null);
    }
  }

  async function handleRecordPress() {
    if (recordDisabled) return;

    if (isRecording) {
      const targetSampleIndex = activeSampleIndex ?? selectedSampleIndex;
      const replacingExisting = samples.some((sample) => sample.sample_index === targetSampleIndex);
      const uri = await stopAndUnload();
      if (!uri) {
        setActiveSampleIndex(null);
        setTrainerError('The recording could not be saved. Please try again.');
        return;
      }

      await processSample(uri, targetSampleIndex, replacingExisting);
      return;
    }

    setTrainerError(null);
    setPlaybackError(null);
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setPermissionBlocked(true);
      return;
    }

    setPermissionBlocked(false);

    try {
      if (playerStatus.playing) {
        player.pause();
        setPlayingSampleIndex(null);
      }

      const targetSampleIndex = selectedSampleIndex;
      setActiveSampleIndex(targetSampleIndex);
      await configureAudioSession();

      const recorder = createTrainerRecorder();
      recorderRef.current = recorder;

      await recorder.prepareToRecordAsync();
      recorder.record();

      setIsRecording(true);
      if (hapticFeedbackEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error: unknown) {
      setActiveSampleIndex(null);
      setTrainerError(error instanceof Error ? error.message : 'Recording could not start.');
    }
  }

  async function handlePlaySample(sample: TrainingSampleInfo) {
    if (sampleControlsDisabled) {
      setPlaybackError(
        backendOk === false
          ? 'Playback is unavailable while the recognition service is offline.'
          : 'Playback is unavailable while TalkBridge is recording or saving a sample.',
      );
      return;
    }

    setPlaybackError(null);

    try {
      if (playingSampleIndex === sample.sample_index && playerStatus.playing) {
        player.pause();
        setPlayingSampleIndex(null);
        return;
      }

      const source = await getTrainingSamplePlaybackSource(
        soundCard.id,
        sample.sample_index,
        sample.playback_path,
      );

      clearPlaybackObjectUrl();
      if (source.uri.startsWith('blob:')) {
        playbackObjectUrlRef.current = source.uri;
      }

      player.replace(source);
      player.play();
      setPlayingSampleIndex(sample.sample_index);
    } catch (error) {
      setPlayingSampleIndex(null);
      setPlaybackError(error instanceof Error ? error.message : 'Sample playback failed.');
    }
  }

  return (
    <Modal visible={isVisible} transparent animationType="none">
      <View style={styles.modalRoot}>
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />

        <Animated.View
          entering={FadeInUp.springify().damping(Motion.spring.gentle.damping)}
          exiting={FadeOut.duration(160)}
          style={styles.sheet}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.panel}>
              <View style={styles.sheetHandle} />
              <Pressable
                style={[styles.closeButton, closeDisabled && styles.controlDisabled]}
                onPress={() => {
                  if (!closeDisabled) {
                    onClose();
                  }
                }}
                disabled={closeDisabled}
              >
                <X size={22} color={Colors.textPrimary} />
              </Pressable>

              <View style={styles.headerBlock}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: `${meta.color}14`, borderColor: `${meta.color}2A` },
                  ]}
                >
                  <Sparkles size={16} color={meta.color} />
                  <Text style={[styles.badgeText, { color: meta.color }]}>
                    {category?.name ?? 'Training'}
                  </Text>
                </View>
                <Text style={styles.title}>Calibrate this sound</Text>
                <Text style={styles.subtitle}>
                  Record the sound that should trigger &quot;{soundCard.phrase_output}&quot;. Matching is based on the
                  recorded audio fingerprint, so non-verbal sounds work too.
                </Text>
              </View>

              <View style={styles.focusCard}>
                <View style={styles.focusMetaRow}>
                  <View style={[styles.focusMetaChip, { backgroundColor: Colors.surfaceTintBlue }]}>
                    <Text style={styles.focusMetaValue}>
                      {workingSampleExists ? `#${workingSampleIndex}` : `New #${workingSampleIndex}`}
                    </Text>
                    <Text style={styles.focusMetaLabel}>
                      {workingSampleExists ? 'selected sample' : 'next sample'}
                    </Text>
                  </View>
                  <View style={[styles.focusMetaChip, { backgroundColor: Colors.surfaceTintMint }]}>
                    <Text style={styles.focusMetaValue}>{savedSampleCount}</Text>
                    <Text style={styles.focusMetaLabel}>saved samples</Text>
                  </View>
                </View>

                <Text style={styles.focusPhrase}>{soundCard.label}</Text>
                <Text style={styles.focusSecondary}>Triggers: {soundCard.phrase_output}</Text>
                <Text style={styles.focusLabel}>MAKE THE SAME SOUND EACH TIME</Text>
                <Text style={styles.coachingText}>{coachingText}</Text>

                <Animated.View
                  key={liveTrainingStatus.label}
                  entering={FadeInUp.duration(180)}
                  style={[
                    styles.liveStatusChip,
                    liveTrainingStatus.tone === 'success'
                      ? styles.liveStatusSuccess
                      : liveTrainingStatus.tone === 'warning'
                        ? styles.liveStatusWarning
                        : liveTrainingStatus.tone === 'info'
                          ? styles.liveStatusInfo
                          : styles.liveStatusDefault,
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.liveStatusDot,
                      liveTrainingStatus.tone === 'success'
                        ? styles.liveStatusDotSuccess
                        : liveTrainingStatus.tone === 'warning'
                          ? styles.liveStatusDotWarning
                          : liveTrainingStatus.tone === 'info'
                            ? styles.liveStatusDotInfo
                            : styles.liveStatusDotDefault,
                      liveStatusDotStyle,
                    ]}
                  />
                  <Text style={styles.liveStatusText}>{liveTrainingStatus.label}</Text>
                </Animated.View>

                {enrollmentQuality ? (
                  <Text style={styles.qualityText}>
                    Calibration quality: {enrollmentQuality.charAt(0).toUpperCase()}
                    {enrollmentQuality.slice(1)}
                  </Text>
                ) : null}
                {readinessText ? (
                  <Text style={styles.readinessText}>Recognition readiness: {readinessText}</Text>
                ) : null}
                {trainerHint ? <Text style={styles.hintText}>{trainerHint}</Text> : null}
              </View>

              <View style={styles.samplePanel}>
                <View style={styles.samplePanelHeader}>
                  <View>
                    <Text style={styles.samplePanelTitle}>Main calibration samples</Text>
                    <Text style={styles.samplePanelSubtitle}>
                      Start with these 3 core samples. You can listen to each one and rerecord any slot.
                    </Text>
                  </View>
                  <Text style={styles.progressMeta}>{progressToReady}/3 saved</Text>
                </View>

                {isLoadingSamples ? (
                  <View style={styles.samplesLoading}>
                    <ActivityIndicator color={Colors.primary} />
                    <Text style={styles.samplesLoadingText}>Loading samples...</Text>
                  </View>
                ) : (
                  <View style={styles.samplesList}>
                    {coreSampleIndexes.map((slot, index) => (
                      <CoreCalibrationRow
                        key={slot}
                        slot={slot}
                        sample={coreSamples[index]}
                        selected={selectedSampleIndex === slot}
                        playing={playingSampleIndex === slot && playerStatus.playing}
                        disabled={sampleControlsDisabled}
                        onSelect={() => setSelectedSampleIndex(slot)}
                        onPlay={() => {
                          const sample = coreSamples[index];
                          if (sample) {
                            void handlePlaySample(sample);
                          }
                        }}
                      />
                    ))}

                    <View style={styles.extraSamplesPanel}>
                      <View style={styles.extraSamplesHeader}>
                        <View>
                          <Text style={styles.extraSamplesTitle}>Extra samples</Text>
                          <Text style={styles.extraSamplesSubtitle}>
                            Record more than 3 to improve recognition over time.
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => setSelectedSampleIndex(nextNewSampleIndex)}
                          disabled={sampleControlsDisabled}
                          style={({ pressed }) => [
                            styles.addSampleButton,
                            sampleControlsDisabled && styles.controlDisabled,
                            pressed && styles.addSampleButtonPressed,
                          ]}
                        >
                          <RefreshCcw size={14} color={Colors.primary} />
                          <Text style={styles.addSampleButtonText}>Record more</Text>
                        </Pressable>
                      </View>

                      {additionalSamples.length > 0 ? (
                        <View style={styles.samplesList}>
                          {additionalSamples.map((sample) => (
                            <SampleRow
                              key={sample.sample_index}
                              sample={sample}
                              selected={sample.sample_index === selectedSampleIndex}
                              playing={sample.sample_index === playingSampleIndex && playerStatus.playing}
                              disabled={sampleControlsDisabled}
                              onSelect={() => setSelectedSampleIndex(sample.sample_index)}
                              onPlay={() => void handlePlaySample(sample)}
                            />
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.extraSamplesEmpty}>
                          No extra samples yet. The first 3 are the main calibration set.
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>

              {permissionBlocked ? (
                <View style={styles.permissionWrap}>
                  <PermissionBlockedState
                    message="TalkBridge needs microphone access before it can calibrate this sound."
                    actionLabel="Try again"
                    onAction={() => {
                      setPermissionBlocked(false);
                      void handleRecordPress();
                    }}
                  />
                </View>
              ) : (
                <View style={styles.recordingZone}>
                  <View style={styles.chamber}>
                    <Pressable
                      onPress={() => void handleRecordPress()}
                      disabled={recordDisabled}
                      style={[styles.recordButtonPressable, recordDisabled && !isRecording && styles.controlDisabled]}
                    >
                      <Animated.View style={[styles.pulseRing, pulseStyle]} />
                      <View style={[styles.recordOrb, isRecording && styles.recordOrbActive]}>
                        {isUploading ? (
                          <ActivityIndicator color={Colors.surface} />
                        ) : isRecording ? (
                          <View style={styles.stopIcon} />
                        ) : (
                          <Mic size={32} color={Colors.surface} />
                        )}
                      </View>
                    </Pressable>
                    <Text style={styles.recordHint}>
                      {isUploading
                        ? workingSampleExists
                          ? `REPLACING SAMPLE ${workingSampleIndex}`
                          : `SAVING SAMPLE ${workingSampleIndex}`
                        : isRecording
                          ? 'STOP RECORDING'
                          : hasSelectedSample
                            ? `RECORD OVER SAMPLE ${selectedSampleIndex}`
                            : `RECORD SAMPLE ${selectedSampleIndex}`}
                    </Text>
                    <Text style={styles.recordSubhint}>
                      {backendOk === false
                        ? 'Reconnect to the backend on the same Wi-Fi before calibrating or replaying samples.'
                        : readyForRecognition
                        ? 'Add more examples to improve robustness, or replace a saved one if the sound changes.'
                        : 'Save at least three examples so recognition can trigger this card reliably.'}
                    </Text>
                  </View>
                  <View style={styles.wavePanel}>
                    <VoiceWavePlaceholder active={isRecording || isUploading} />
                  </View>
                </View>
              )}

              {playbackError ? <Text style={styles.errorText}>{playbackError}</Text> : null}
              {trainerError ? <Text style={styles.errorText}>{trainerError}</Text> : null}

              {readyForRecognition ? (
                <View style={styles.readyFooter}>
                  <View style={styles.readyBadge}>
                    <CheckCircle2 size={18} color={Colors.accent} />
                    <Text style={styles.readyBadgeText}>Recognition ready</Text>
                  </View>
                  <Text style={styles.readyFooterText}>
                    This sound card has enough calibration data to match from the home screen.
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.drawer,
    borderTopRightRadius: Radius.drawer,
    ...Shadow.luxe,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: Layout.isSmallDevice ? Spacing.lg : Spacing['4xl'],
  },
  panel: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 54,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.strokeStrong,
    marginBottom: Spacing.md,
  },
  closeButton: {
    alignSelf: 'center',
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  badgeText: {
    ...Typography.microLabel,
    letterSpacing: 0.4,
  },
  title: {
    ...Typography.sectionTitle,
    textAlign: 'center',
    fontSize: 22,
  },
  subtitle: {
    ...Typography.supportText,
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontSize: 14,
  },
  focusCard: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceTintBlue,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.08)',
  },
  focusMetaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  focusMetaChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
  },
  focusMetaValue: {
    ...Typography.microLabel,
    color: Colors.textPrimary,
    fontSize: 13,
    textTransform: 'none',
    letterSpacing: 0,
  },
  focusMetaLabel: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'none',
    letterSpacing: 0,
  },
  focusPhrase: {
    ...Typography.heroTitle,
    fontSize: 32,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontFamily: 'Outfit_700Bold',
  },
  focusSecondary: {
    ...Typography.supportText,
    marginTop: Spacing.sm,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  focusLabel: {
    ...Typography.microLabel,
    color: Colors.textTertiary,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: Spacing.md,
  },
  coachingText: {
    ...Typography.supportText,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  liveStatusChip: {
    marginTop: Spacing.md,
    minHeight: 32,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  liveStatusDefault: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.strokeMuted,
  },
  liveStatusInfo: {
    backgroundColor: Colors.statusInfoBg,
    borderColor: 'rgba(37,99,235,0.12)',
  },
  liveStatusSuccess: {
    backgroundColor: Colors.statusPositiveBg,
    borderColor: 'rgba(16,185,129,0.14)',
  },
  liveStatusWarning: {
    backgroundColor: Colors.statusWarningBg,
    borderColor: 'rgba(245,158,11,0.16)',
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveStatusDotDefault: {
    backgroundColor: Colors.textTertiary,
  },
  liveStatusDotInfo: {
    backgroundColor: Colors.primary,
  },
  liveStatusDotSuccess: {
    backgroundColor: Colors.success,
  },
  liveStatusDotWarning: {
    backgroundColor: Colors.warning,
  },
  liveStatusText: {
    ...Typography.supportText,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
    textAlign: 'left',
    fontWeight: '600',
    flex: 1,
  },
  qualityText: {
    ...Typography.supportText,
    marginTop: Spacing.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  readinessText: {
    ...Typography.supportText,
    marginTop: Spacing.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  hintText: {
    ...Typography.supportText,
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
  },
  progressPanel: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadow.soft,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressTitle: {
    ...Typography.cardTitle,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  progressMeta: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    textTransform: 'none',
    letterSpacing: 0,
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  progressChip: {
    minWidth: 78,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    alignItems: 'center',
  },
  progressChipFilled: {
    backgroundColor: Colors.statusPositiveBg,
    borderColor: 'rgba(16,185,129,0.18)',
  },
  progressChipSelected: {
    borderColor: Colors.primary,
  },
  progressChipValue: {
    ...Typography.microLabel,
    color: Colors.textPrimary,
    fontSize: 14,
    textTransform: 'none',
    letterSpacing: 0,
  },
  progressChipValueFilled: {
    color: Colors.success,
  },
  progressChipLabel: {
    ...Typography.microLabel,
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'none',
    letterSpacing: 0,
  },
  extraChip: {
    minWidth: 82,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceTintMint,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    alignItems: 'center',
  },
  extraChipValue: {
    ...Typography.microLabel,
    color: Colors.success,
    fontSize: 14,
    textTransform: 'none',
    letterSpacing: 0,
  },
  extraChipLabel: {
    ...Typography.microLabel,
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'none',
    letterSpacing: 0,
  },
  coreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    backgroundColor: Colors.background,
  },
  coreRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.statusInfoBg,
  },
  coreRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  coreRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  coreMiniButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}10`,
  },
  coreActionButton: {
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    alignItems: 'center',
  },
  coreActionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  coreActionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  coreActionButtonTextSelected: {
    color: Colors.surface,
  },
  samplePanel: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    padding: Spacing.lg,
    ...Shadow.soft,
  },
  samplePanelHeader: {
    gap: Spacing.md,
  },
  samplePanelTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  samplePanelSubtitle: {
    ...Typography.supportText,
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  addSampleButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: `${Colors.primary}10`,
    borderWidth: 1,
    borderColor: `${Colors.primary}22`,
  },
  addSampleButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  addSampleButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  samplesLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  samplesLoadingText: {
    ...Typography.supportText,
    color: Colors.textSecondary,
  },
  samplesList: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  extraSamplesPanel: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.strokeMuted,
    gap: Spacing.md,
  },
  extraSamplesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  extraSamplesTitle: {
    ...Typography.cardTitle,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  extraSamplesSubtitle: {
    ...Typography.supportText,
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  extraSamplesEmpty: {
    ...Typography.supportText,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  sampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    backgroundColor: Colors.background,
  },
  sampleRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.statusInfoBg,
  },
  sampleRowDisabled: {
    opacity: 0.56,
  },
  sampleRowPressed: {
    opacity: 0.92,
  },
  sampleIndexBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleIndexBubbleSelected: {
    borderColor: Colors.primary,
  },
  sampleIndexText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  sampleIndexTextSelected: {
    color: Colors.primary,
  },
  sampleCopy: {
    flex: 1,
  },
  sampleTitle: {
    ...Typography.supportText,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  sampleMeta: {
    ...Typography.supportText,
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  samplePlayButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${Colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  samplePlayButtonSelected: {
    backgroundColor: Colors.primary,
  },
  samplePlayButtonDisabled: {
    opacity: 0.5,
  },
  samplePlayButtonPressed: {
    opacity: 0.88,
  },
  emptySamplesState: {
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptySamplesTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySamplesText: {
    ...Typography.supportText,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  recordingZone: {
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  chamber: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
  },
  permissionWrap: {
    marginTop: Spacing.xl,
  },
  recordButtonPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  controlDisabled: {
    opacity: 0.56,
  },
  pulseRing: {
    position: 'absolute',
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  recordOrb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow,
    zIndex: 2,
  },
  recordOrbActive: {
    backgroundColor: Colors.emergency,
  },
  stopIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  recordHint: {
    ...Typography.microLabel,
    marginTop: Spacing.lg,
    color: Colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  recordSubhint: {
    ...Typography.supportText,
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: Spacing.lg,
  },
  wavePanel: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    paddingVertical: Spacing.lg,
  },
  readyFooter: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: Colors.statusPositiveBg,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.16)',
  },
  readyBadgeText: {
    ...Typography.microLabel,
    color: Colors.success,
    letterSpacing: 0.2,
  },
  readyFooterText: {
    ...Typography.supportText,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  errorText: {
    ...Typography.supportText,
    color: Colors.emergency,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});
