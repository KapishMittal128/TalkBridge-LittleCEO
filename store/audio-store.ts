import { AudioModule, RecordingPresets, type AudioRecorder } from 'expo-audio';
import { create } from 'zustand';
import { configureAudioSession, requestMicrophonePermission } from '../lib/permissions';

interface AudioState {
  recorder: AudioRecorder | null;
  isRecording: boolean;
  isProcessing: boolean;
  lastRecordingUri: string | null;
  error: string | null;

  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  reset: () => void;
}

type RecorderConstructor = new (options: typeof RecordingPresets.HIGH_QUALITY) => AudioRecorder;

function createRecorder(): AudioRecorder {
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

export const useAudioStore = create<AudioState>((set, get) => ({
  recorder: null,
  isRecording: false,
  isProcessing: false,
  lastRecordingUri: null,
  error: null,

  startRecording: async () => {
    try {
      set({ error: null, isProcessing: false });

      // Ensure we have permissions
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      await configureAudioSession();

      const recorder = createRecorder();
      set({ recorder });

      // Prepare and start recording
      await recorder.prepareToRecordAsync();
      recorder.record();

      set({ isRecording: true, error: null });
      console.log('[AudioStore] Recording started');
    } catch (err) {
      console.error('[AudioStore] Start recording failed:', err);
      set({
        recorder: null,
        error: err instanceof Error ? err.message : 'Recording could not start.',
        isRecording: false,
        isProcessing: false,
      });
    }
  },

  stopRecording: async () => {
    const { recorder } = get();
    if (!recorder) {
      set({ isRecording: false, isProcessing: false });
      return null;
    }

    try {
      set({ isRecording: false, isProcessing: true });

      await recorder.stop();
      const uri = recorder.uri;

      set({
        recorder: null,
        lastRecordingUri: uri,
        isProcessing: false,
        error: uri ? null : 'The recording could not be saved.',
      });
      console.log('[AudioStore] Recording stopped, URI:', uri);

      return uri;
    } catch (err) {
      console.error('[AudioStore] Stop recording failed:', err);
      set({
        recorder: null,
        error: err instanceof Error ? err.message : 'Recording could not be saved.',
        isProcessing: false,
        isRecording: false,
      });
      return null;
    }
  },

  reset: () => {
    set({
      recorder: null,
      isRecording: false,
      isProcessing: false,
      lastRecordingUri: null,
      error: null,
    });
  },
}));
