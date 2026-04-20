import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronRight, Settings, User } from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useDataStore, type SoundCard } from '@/store/data-store';
import { useAudioStore } from '@/store/audio-store';
import { SpeakCoreButton, type SpeakCoreState } from '@/components/ui/SpeakCoreButton';
import { HeroGreetingCard } from '@/components/ui/HeroGreetingCard';
import { QuickActionPill } from '@/components/ui/QuickActionPill';
import { VocalTrainer } from '@/components/VocalTrainer';
import { QUICK_ACTION_ICON_BY_LABEL, QUICK_ACTION_LABELS, getCategoryMeta } from '@/constants/categories';
import { Colors, Layout, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import {
  appendConfirmedMatchSample,
  appendCorrectedMatchSample,
  checkBackendHealth,
  fetchRecognitionEvaluation,
  predictVocalSound,
  type RecognitionEvaluation,
  type RecognitionResult,
} from '@/lib/recognition';

type RecognitionState =
  | { type: 'idle' }
  | { type: 'success'; phrase: string; confidence: number; label?: string; modelStatus?: string }
  | { type: 'no-match'; message: string; modelStatus?: string };

function getGreeting(name?: string | null) {
  const hour = new Date().getHours();
  const prefix = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return `${prefix}, ${name || 'Friend'}`;
}

function getTone(slug?: string) {
  switch (slug) {
    case 'feelings':
      return 'violet' as const;
    case 'actions':
      return 'mint' as const;
    case 'emergency':
      return 'coral' as const;
    default:
      return 'cyan' as const;
  }
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { profile } = useAuth();
  const voiceFeedbackEnabled = profile?.voice_feedback_enabled !== false;
  const hapticFeedbackEnabled = profile?.haptic_feedback_enabled !== false;
  const initializeData = useDataStore((state) => state.initializeData);
  const categories = useDataStore((state) => state.categories);
  const soundCards = useDataStore((state) => state.soundCards);
  const recordRecognition = useDataStore((state) => state.recordRecognition);
  const incrementCardUsage = useDataStore((state) => state.incrementCardUsage);
  const updateCardTrainingStatus = useDataStore((state) => state.updateCardTrainingStatus);

  const {
    startRecording,
    stopRecording,
    isRecording,
    isProcessing: isAudioProcessing,
    error: audioError,
  } = useAudioStore();

  const [isPredicting, setIsPredicting] = useState(false);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [recognitionState, setRecognitionState] = useState<RecognitionState>({ type: 'idle' });
  const [lastSpoken, setLastSpoken] = useState<string | null>(null);
  const [isTrainerVisible, setIsTrainerVisible] = useState(false);
  const [selectedCardForTraining, setSelectedCardForTraining] = useState<SoundCard | null>(null);
  const [lastRecognitionUri, setLastRecognitionUri] = useState<string | null>(null);
  const [lastRecognitionResult, setLastRecognitionResult] = useState<RecognitionResult | null>(null);
  const [isCorrectionModalVisible, setIsCorrectionModalVisible] = useState(false);
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);
  const [isDebugModalVisible, setIsDebugModalVisible] = useState(false);
  const [debugEvaluation, setDebugEvaluation] = useState<RecognitionEvaluation | null>(null);
  const [isLoadingDebugEvaluation, setIsLoadingDebugEvaluation] = useState(false);

  const isCompactHeight = height < 820;
  const isVeryCompactHeight = height < 760;
  const speakSize = isVeryCompactHeight ? 122 : isCompactHeight ? 132 : 140;
  const verticalGap = isVeryCompactHeight ? 10 : 14;

  useEffect(() => {
    void initializeData();
  }, [initializeData]);

  useEffect(() => {
    void checkBackendHealth().then(setBackendOk);
    const interval = setInterval(() => {
      void checkBackendHealth().then(setBackendOk);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = useMemo(() => {
    const favorites = [...soundCards]
      .filter((card) => card.is_favorite)
      .sort((left, right) => {
        if (left.is_emergency !== right.is_emergency) {
          return left.is_emergency ? -1 : 1;
        }
        if (left.training_status !== right.training_status) {
          return left.training_status === 'ready' ? -1 : 1;
        }
        return right.usage_count - left.usage_count;
      });

    const fallback = QUICK_ACTION_LABELS.map((label) => soundCards.find((card) => card.label === label)).filter(
      (card): card is SoundCard => Boolean(card),
    );

    const ordered = [...favorites, ...fallback];
    const unique = ordered.filter((card, index, array) => array.findIndex((item) => item.id === card.id) === index);
    return unique.slice(0, 6);
  }, [soundCards]);

  const readyCards = useMemo(
    () => soundCards.filter((card) => card.training_status === 'ready').length,
    [soundCards],
  );
  const trainingCards = useMemo(
    () => soundCards.filter((card) => card.training_status !== 'ready').length,
    [soundCards],
  );
  const calibrationCount = useMemo(
    () => soundCards.reduce((sum, card) => sum + card.sample_count, 0),
    [soundCards],
  );
  const correctionCandidates = useMemo(
    () => soundCards.filter((card) => card.is_active).sort((left, right) => left.label.localeCompare(right.label)),
    [soundCards],
  );

  const speakState: SpeakCoreState = isRecording
    ? 'listening'
    : isPredicting || isAudioProcessing
      ? 'processing'
      : recognitionState.type === 'success'
        ? 'recognized'
        : recognitionState.type === 'no-match'
          ? 'no-match'
          : 'idle';

  const speakLiveStatus = (() => {
    if (isRecording) {
      return {
        label: 'Listening for your voice...',
        tone: 'info' as const,
      };
    }

    if (isPredicting || isAudioProcessing) {
      return {
        label: 'Matching against your trained phrases...',
        tone: 'info' as const,
      };
    }

    if (recognitionState.type === 'success') {
      return {
        label: recognitionState.modelStatus ?? 'Confident match found.',
        tone: 'success' as const,
      };
    }

    if (recognitionState.type === 'no-match') {
      return {
        label:
          recognitionState.modelStatus ??
          (backendOk === false ? 'Recognition service is offline.' : 'No confident match yet.'),
        tone: 'warning' as const,
      };
    }

    return {
      label: backendOk === false ? 'Recognition service offline.' : 'Model ready for a new sound.',
      tone: backendOk === false ? ('warning' as const) : ('default' as const),
    };
  })();

  function speakPhrase(text: string) {
    setLastSpoken(text);
    if (voiceFeedbackEnabled) {
      Speech.speak(text, {
        language: profile?.output_language || 'en',
        pitch: 1,
        rate: 0.9,
      });
    }
  }

  function updateCardFromTraining(card: SoundCard, trainingResponse: Awaited<ReturnType<typeof appendCorrectedMatchSample>>) {
    return updateCardTrainingStatus(
      card.id,
      trainingResponse.sample_count >= 3 ? 'ready' : 'needs_more_samples',
      trainingResponse.sample_count,
      {
        enrollment_quality: trainingResponse.enrollment_quality,
        distinctiveness_status: trainingResponse.distinctiveness_status,
        consistency_score: trainingResponse.consistency_score,
        recommended_action: trainingResponse.recommended_action ?? null,
      },
    );
  }

  function promptToSaveConfirmedMatch(uri: string, card: SoundCard) {
    Alert.alert(
      'Add this match to training?',
      `TalkBridge recognized "${card.label}". Do you want to save this live recording as another training sample for this card?`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Add sample',
          onPress: () => {
            void appendConfirmedMatchSample({
              uri,
              soundCardId: card.id,
              label: card.label,
              phraseOutput: card.phrase_output,
            })
              .then(async (trainingResponse) => {
                if (!trainingResponse) {
                  return;
                }

                await updateCardFromTraining(card, trainingResponse);

                Alert.alert(
                  'Sample added',
                  `Saved this live match to "${card.label}" to strengthen future recognition.`,
                );
              })
              .catch((error) => {
                Alert.alert(
                  'Could not add sample',
                  error instanceof Error ? error.message : 'Please try again.',
                );
              });
          },
        },
      ],
    );
  }

  async function handleCorrectPrediction(card: SoundCard) {
    if (!lastRecognitionUri || isSavingCorrection) {
      return;
    }

    try {
      setIsSavingCorrection(true);
      const trainingResponse = await appendCorrectedMatchSample({
        uri: lastRecognitionUri,
        soundCardId: card.id,
        label: card.label,
        phraseOutput: card.phrase_output,
      });
      await updateCardFromTraining(card, trainingResponse);
      setIsCorrectionModalVisible(false);
      Alert.alert('Correction saved', `Saved this recording under "${card.label}" for future matching.`);
    } catch (error) {
      Alert.alert(
        'Could not save correction',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSavingCorrection(false);
    }
  }

  async function openDebugModal() {
    if (!__DEV__) return;
    setIsDebugModalVisible(true);
    if (debugEvaluation || isLoadingDebugEvaluation) {
      return;
    }

    try {
      setIsLoadingDebugEvaluation(true);
      const evaluation = await fetchRecognitionEvaluation();
      setDebugEvaluation(evaluation);
    } catch (error) {
      console.warn('[Recognition] debug evaluation failed', error);
    } finally {
      setIsLoadingDebugEvaluation(false);
    }
  }

  async function triggerQuickAction(card: SoundCard) {
    if (card.training_status !== 'ready') {
      if (hapticFeedbackEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setSelectedCardForTraining(card);
      setIsTrainerVisible(true);
      return;
    }

    if (hapticFeedbackEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    speakPhrase(card.phrase_output);
    setRecognitionState({
      type: 'success',
      phrase: card.phrase_output,
      confidence: 1,
      label: card.label,
      modelStatus: 'Quick phrase played instantly.',
    });
    await incrementCardUsage(card.id);
  }

  async function handleSpeakPress() {
    if (!isRecording && backendOk === false) {
      setRecognitionState({
        type: 'no-match',
        message:
          'Recognition is offline right now. Keep the backend running and make sure your phone and laptop are on the same Wi-Fi.',
        modelStatus: 'Recognition service offline.',
      });
      if (hapticFeedbackEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return;
    }

    if (!isRecording) {
      setRecognitionState({ type: 'idle' });
      await startRecording();

      const nextError = useAudioStore.getState().error;
      if (nextError) {
        setRecognitionState({
          type: 'no-match',
          message: nextError,
          modelStatus: 'Recording could not start.',
        });
      }
      return;
    }

    try {
      setIsPredicting(true);
      const uri = await stopRecording();
      if (!uri) {
        setRecognitionState({
          type: 'no-match',
          message: 'Could not capture sound.',
          modelStatus: 'No recording was captured.',
        });
        return;
      }

      const result = await predictVocalSound(uri);
      setLastRecognitionUri(uri);
      setLastRecognitionResult(result);

      if (result?.sound_card_id && result.phrase_output) {
        const matchedCard = soundCards.find((card) => card.id === result.sound_card_id);
        const phrase = result.phrase_output;

        setRecognitionState({
          type: 'success',
          phrase,
          confidence: result.confidence,
          label: matchedCard?.label,
          modelStatus:
            result.decision_source === 'prototype_acoustic_fallback'
              ? 'Matched with the prototype fallback path.'
              : 'Matched using acoustic similarity from your saved samples.',
        });
        speakPhrase(phrase);
        await recordRecognition({
          phrase_output: phrase,
          confidence: result.confidence,
          sound_card_id: result.sound_card_id,
        });
        await incrementCardUsage(result.sound_card_id);
        if (matchedCard && result.confidence >= 0.72) {
          promptToSaveConfirmedMatch(uri, matchedCard);
        }
        if (hapticFeedbackEnabled) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setRecognitionState({
          type: 'no-match',
          message: result.message ?? 'No trained card matched that sound yet.',
          modelStatus:
            result.reason === 'needs_confirmation_low_data'
              ? 'TalkBridge heard something close, but this card still needs confirmation while it learns.'
              : result.rejection_reason === 'low_margin'
              ? 'Two phrases sounded too similar to separate safely.'
              : result.rejection_reason === 'below_threshold'
                ? result.reason === 'low_signal'
                  ? 'The recording quality was too weak or noisy to trust.'
                  : 'The recording was heard, but it was not strong enough to match.'
                : 'No trained card matched this sound yet.',
        });
        if (hapticFeedbackEnabled) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    } catch (error: unknown) {
        setLastRecognitionUri(null);
        setLastRecognitionResult(null);
        setRecognitionState({
          type: 'no-match',
          message:
          error instanceof Error
            ? backendOk === false
              ? 'Could not reach the recognition service. Check that your laptop and phone are on the same Wi-Fi and the backend is running.'
              : error.message
            : 'Recognition is unavailable right now. Use quick phrases or train more cards.',
          modelStatus: backendOk === false ? 'Recognition service offline.' : 'Recognition request failed.',
        });
      if (hapticFeedbackEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsPredicting(false);
    }
  }

  const recognitionActions =
    lastRecognitionUri && backendOk !== false ? (
      <View style={styles.recognitionActionRow}>
        <Pressable style={styles.secondaryActionButton} onPress={() => setIsCorrectionModalVisible(true)}>
          <Text style={styles.secondaryActionButtonText}>Wrong card?</Text>
        </Pressable>
        {__DEV__ && lastRecognitionResult ? (
          <Pressable style={styles.secondaryActionButton} onPress={() => void openDebugModal()}>
            <Text style={styles.secondaryActionButtonText}>Inspect</Text>
          </Pressable>
        ) : null}
      </View>
    ) : __DEV__ && lastRecognitionResult ? (
      <View style={styles.recognitionActionRow}>
        <Pressable style={styles.secondaryActionButton} onPress={() => void openDebugModal()}>
          <Text style={styles.secondaryActionButtonText}>Inspect</Text>
        </Pressable>
      </View>
    ) : null;

  const statusCard = (() => {
    if (recognitionState.type === 'success') {
      return (
        <View style={[styles.infoCard, styles.successCard]}>
          <Text style={styles.infoEyebrow}>Recognized</Text>
          <Text style={styles.infoHeadline} numberOfLines={2}>
            {recognitionState.phrase}
          </Text>
          <Text style={styles.infoMeta}>
            {recognitionState.label ?? 'Matched phrase'} • {Math.round(recognitionState.confidence * 100)}%
          </Text>
          {recognitionActions}
        </View>
      );
    }

    if (recognitionState.type === 'no-match') {
      return (
        <View style={[styles.infoCard, styles.warningCard]}>
          <Text style={styles.infoEyebrow}>
            {backendOk === false ? 'Recognition offline' : 'Needs training'}
          </Text>
          <Text style={styles.infoHeadline} numberOfLines={2}>
            {recognitionState.message}
          </Text>
          <Pressable style={styles.inlineAction} onPress={() => router.push('/categories')}>
            <Text style={styles.inlineActionText}>
              {backendOk === false ? 'Open phrases' : 'Open train'}
            </Text>
            <ChevronRight size={14} color={Colors.warning} />
          </Pressable>
          {recognitionActions}
        </View>
      );
    }

    return (
      <View style={styles.infoCard}>
        <View style={styles.infoTopRow}>
          <Text style={styles.infoEyebrow}>Communication bank</Text>
          <Pressable style={styles.inlineAction} onPress={() => router.push('/categories')}>
            <Text style={styles.inlineActionText}>Open train</Text>
            <ChevronRight size={14} color={Colors.primary} />
          </Pressable>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{readyCards}</Text>
            <Text style={styles.metricLabel}>Ready</Text>
          </View>
          <View style={[styles.metricCard, styles.metricCardViolet]}>
            <Text style={styles.metricValue}>{trainingCards}</Text>
            <Text style={styles.metricLabel}>Training</Text>
          </View>
          <View style={[styles.metricCard, styles.metricCardMint]}>
            <Text style={styles.metricValue}>{calibrationCount}</Text>
            <Text style={styles.metricLabel}>Samples</Text>
          </View>
        </View>
        <Text style={styles.infoMeta} numberOfLines={1}>
          {audioError
            ? audioError
            : lastSpoken
              ? `Last message: ${lastSpoken}`
              : backendOk === false
                ? 'Recognition service unavailable'
                : backendOk
                  ? 'Recognition ready'
                  : 'Checking recognition service'}
        </Text>
      </View>
    );
  })();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <View style={styles.topBar}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={20} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>TalkBridge</Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <Settings size={22} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.content,
          {
            gap: verticalGap,
            paddingBottom: Layout.bottomNavClearance + insets.bottom + (isVeryCompactHeight ? 12 : 20),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <HeroGreetingCard
            compact
            greeting={getGreeting(profile?.display_name?.split(' ')[0])}
            message="Ready to listen and speak with you."
            statusLabel={
              backendOk === false ? 'Backend offline' : backendOk ? 'Recognition ready' : 'Checking service'
            }
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.beaconPanel}>
          <Text style={styles.beaconEyebrow}>Voice beacon</Text>
          <SpeakCoreButton
            state={speakState}
            onPress={() => void handleSpeakPress()}
            size={speakSize}
            liveStatus={speakLiveStatus.label}
            liveStatusTone={speakLiveStatus.tone}
            disabled={backendOk === false && !isRecording}
          />
          <Text style={styles.beaconSupport}>
            {backendOk === false
              ? 'Recognition is offline. Quick phrases still work, but live matching needs the backend.'
              : 'Tap once to start listening, tap again to stop and match.'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(110).springify()}>
          {statusCard}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).springify()} style={styles.shortcutsPanel}>
          <View style={styles.shortcutsHeader}>
            <View>
              <Text style={styles.shortcutsEyebrow}>Quick phrases</Text>
              <Text style={styles.shortcutsTitle}>Speak fast</Text>
            </View>
            <Pressable style={styles.inlineAction} onPress={() => router.push('/categories')}>
              <Text style={styles.inlineActionText}>Browse</Text>
              <ChevronRight size={14} color={Colors.primary} />
            </Pressable>
          </View>

          <View style={styles.quickGrid}>
            {quickActions.map((card) => {
              const category = categories.find((item) => item.id === card.category_id);
              const meta = getCategoryMeta(category?.slug);
              const Icon = QUICK_ACTION_ICON_BY_LABEL[card.label] ?? meta.icon;

              return (
                <View key={card.id} style={styles.quickGridItem}>
                  <QuickActionPill
                    compact
                    label={card.label}
                    subtitle={
                      card.training_status === 'ready'
                        ? 'Ready'
                        : `${card.sample_count}/3 samples`
                    }
                    icon={Icon}
                    tone={getTone(category?.slug)}
                    onPress={() => void triggerQuickAction(card)}
                  />
                </View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {selectedCardForTraining && isTrainerVisible ? (
        <VocalTrainer
          isVisible={isTrainerVisible}
          onClose={() => setIsTrainerVisible(false)}
          soundCard={selectedCardForTraining}
          backendAvailable={backendOk}
        />
      ) : null}

      <Modal visible={isCorrectionModalVisible} transparent animationType="fade" onRequestClose={() => setIsCorrectionModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save this recording to the correct card</Text>
            <Text style={styles.modalBody}>
              Choose the card that should learn from the most recent recording.
            </Text>
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {correctionCandidates.map((card) => (
                <Pressable
                  key={card.id}
                  style={styles.modalListItem}
                  onPress={() => void handleCorrectPrediction(card)}
                  disabled={isSavingCorrection}
                >
                  <View>
                    <Text style={styles.modalListTitle}>{card.label}</Text>
                    <Text style={styles.modalListSubtitle}>{card.phrase_output}</Text>
                  </View>
                  <Text style={styles.modalListMeta}>{card.sample_count} saved</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.modalFooter}>
              {isSavingCorrection ? <ActivityIndicator color={Colors.primary} /> : null}
              <Pressable style={styles.secondaryActionButton} onPress={() => setIsCorrectionModalVisible(false)} disabled={isSavingCorrection}>
                <Text style={styles.secondaryActionButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isDebugModalVisible} transparent animationType="fade" onRequestClose={() => setIsDebugModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.debugModalCard]}>
            <Text style={styles.modalTitle}>Recognition debug</Text>
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              <Text style={styles.debugLabel}>Accepted: {lastRecognitionResult?.accepted ? 'yes' : 'no'}</Text>
              <Text style={styles.debugLabel}>Reason: {lastRecognitionResult?.reason ?? 'accepted'}</Text>
              <Text style={styles.debugLabel}>Top matches</Text>
              {(lastRecognitionResult?.topMatches ?? []).map((match) => (
                <Text key={`${match.soundCardId}-${match.label}`} style={styles.debugValue}>
                  {match.label}: {(match.score * 100).toFixed(1)}% · {match.readiness}
                </Text>
              ))}
              <Text style={styles.debugLabel}>Feature summary</Text>
              <Text style={styles.debugValue}>
                Duration {lastRecognitionResult?.debug?.featureSummary?.duration?.toFixed?.(2) ?? '0.00'}s ·
                RMS {lastRecognitionResult?.debug?.featureSummary?.mean_rms?.toFixed?.(4) ?? '0.0000'} ·
                Voiced {lastRecognitionResult?.debug?.featureSummary?.voiced_ratio?.toFixed?.(2) ?? '0.00'}
              </Text>
              <Text style={styles.debugLabel}>Waveform preview</Text>
              <View style={styles.waveformRow}>
                {(lastRecognitionResult?.debug?.waveformPreview ?? []).slice(0, 48).map((value, index) => (
                  <View
                    key={`wave-${index}`}
                    style={[
                      styles.waveformBar,
                      { height: Math.max(6, Math.min(42, value * 54)) },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.debugLabel}>Library evaluation</Text>
              {isLoadingDebugEvaluation ? <ActivityIndicator color={Colors.primary} /> : null}
              {debugEvaluation ? (
                <>
                  <Text style={styles.debugValue}>
                    Accepted accuracy {(debugEvaluation.acceptedAccuracy * 100).toFixed(1)}% · Rejection {(debugEvaluation.rejectionRate * 100).toFixed(1)}%
                  </Text>
                  {debugEvaluation.mostConfusableCards.slice(0, 3).map((item, index) => (
                    <Text key={`confusable-${index}`} style={styles.debugValue}>
                      {item.cards.join(' vs ')}: {item.count}
                    </Text>
                  ))}
                </>
              ) : null}
            </ScrollView>
            <View style={styles.modalFooter}>
              <Pressable style={styles.secondaryActionButton} onPress={() => setIsDebugModalVisible(false)}>
                <Text style={styles.secondaryActionButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Layout.screenPadding,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: Colors.textPrimary,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.soft,
  },
  iconButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  content: {
    paddingTop: 10,
  },
  scrollArea: {
    flex: 1,
  },
  beaconPanel: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadow.soft,
  },
  beaconEyebrow: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  beaconSupport: {
    ...Typography.supportText,
    textAlign: 'center',
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    padding: Spacing.lg,
    ...Shadow.soft,
  },
  successCard: {
    backgroundColor: Colors.surfaceTintMint,
    borderColor: 'rgba(16,185,129,0.14)',
  },
  warningCard: {
    backgroundColor: '#FFF8EE',
    borderColor: 'rgba(245,158,11,0.16)',
  },
  infoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  infoEyebrow: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  infoHeadline: {
    ...Typography.cardTitle,
    fontSize: 20,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  infoMeta: {
    ...Typography.supportText,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceTintBlue,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.08)',
    alignItems: 'center',
  },
  metricCardViolet: {
    backgroundColor: Colors.surfaceTintViolet,
    borderColor: 'rgba(124,58,237,0.08)',
  },
  metricCardMint: {
    backgroundColor: Colors.surfaceTintMint,
    borderColor: 'rgba(16,185,129,0.08)',
  },
  metricValue: {
    ...Typography.statNumber,
    fontSize: 22,
    lineHeight: 24,
  },
  metricLabel: {
    ...Typography.microLabel,
    marginTop: 4,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: `${Colors.primary}10`,
    borderWidth: 1,
    borderColor: `${Colors.primary}20`,
  },
  inlineActionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  shortcutsPanel: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    padding: Spacing.md,
    ...Shadow.soft,
  },
  shortcutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 10,
  },
  shortcutsEyebrow: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  shortcutsTitle: {
    ...Typography.sectionTitle,
    fontSize: 20,
    lineHeight: 24,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickGridItem: {
    width: '31.6%',
  },
  recognitionActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  secondaryActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    backgroundColor: Colors.background,
  },
  secondaryActionButtonText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: Layout.screenPadding,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    maxHeight: '78%',
    ...Shadow.soft,
  },
  debugModalCard: {
    maxHeight: '84%',
  },
  modalTitle: {
    ...Typography.sectionTitle,
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 8,
  },
  modalBody: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  modalList: {
    maxHeight: 340,
  },
  modalListContent: {
    gap: 10,
    paddingBottom: 4,
  },
  modalListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
  },
  modalListTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalListSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  modalListMeta: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.md,
  },
  debugLabel: {
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 4,
  },
  debugValue: {
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    minHeight: 46,
    marginBottom: 4,
  },
  waveformBar: {
    width: 4,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    opacity: 0.75,
  },
});
