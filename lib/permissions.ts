import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

/**
 * Requests microphone permission from the system.
 *
 * Returns `true` if permission is granted.
 * Returns `false` if denied or any error occurs.
 *
 * Call this before any recording attempt — not on app boot.
 * The right place to call this is when the user taps the Record button.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const status = await requestRecordingPermissionsAsync();
    return status.granted;
  } catch (error) {
    console.error('[TalkBridge] Microphone permission request failed:', error);
    return false;
  }
}

/**
 * Checks current microphone permission status without prompting.
 *
 * Returns `'granted'`, `'denied'`, or `'undetermined'`.
 */
export async function getMicrophonePermissionStatus(): Promise<
  'granted' | 'denied' | 'undetermined'
> {
  try {
    const status = await getRecordingPermissionsAsync();
    return status.status as 'granted' | 'denied' | 'undetermined';
  } catch (error) {
    console.error('[TalkBridge] Microphone permission status check failed:', error);
    return 'undetermined';
  }
}

/**
 * Sets the audio session mode required for recording on iOS.
 * Must be called before starting any recording session.
 */
export async function configureAudioSession(): Promise<void> {
  try {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
      allowsBackgroundRecording: false,
    });
  } catch (error) {
    console.error('[TalkBridge] Audio session configuration failed:', error);
  }
}
