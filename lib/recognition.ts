import { ensureBackendSession } from '@/lib/backend-auth';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const REQUEST_TIMEOUT_MS = 12000;
let resolvedBaseUrl: string | null = null;

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

function extractHostFromExpoUrl(rawValue?: string | null) {
  if (!rawValue) return null;

  const withoutScheme = rawValue.trim().replace(/^[a-z]+:\/\//i, '').replace(/^\/\//, '');
  const hostSegment = withoutScheme.split('/')[0]?.split('?')[0]?.trim();
  if (!hostSegment) return null;

  const host = hostSegment.split(':')[0]?.trim();
  if (!host || host.toLowerCase() === 'exp') return null;

  return host;
}

function isLocalNetworkUrl(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return true;
    }

    const match = hostname.match(/^172\.(\d{1,2})\./);
    if (match) {
      const secondOctet = Number(match[1]);
      return secondOctet >= 16 && secondOctet <= 31;
    }

    return false;
  } catch {
    return false;
  }
}

const getBaseUrlCandidates = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_RECOGNITION_API_URL?.trim();
  const urls = new Set<string>();
  const configuredIsLocalNetwork = configuredUrl ? isLocalNetworkUrl(configuredUrl) : false;

  if (__DEV__ && Platform.OS !== 'web') {
    const expoHost =
      extractHostFromExpoUrl(Constants.expoConfig?.hostUri) ??
      extractHostFromExpoUrl(Constants.experienceUrl) ??
      extractHostFromExpoUrl(Constants.linkingUri);
    if (expoHost) {
      if (!configuredUrl || isLocalNetworkUrl(configuredUrl)) {
        urls.add(`http://${expoHost}:8000`);
      }
    }
  }

  if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      urls.add(`http://${host}:8000`);
    }
  }

  urls.add('http://localhost:8000');
  urls.add('http://127.0.0.1:8000');

  if (configuredUrl) {
    urls.add(normalizeBaseUrl(configuredUrl));
  }

  const prioritizedUrls = Array.from(urls).map(normalizeBaseUrl);
  if (configuredUrl && configuredIsLocalNetwork) {
    return [
      normalizeBaseUrl(configuredUrl),
      ...prioritizedUrls.filter((url) => url !== normalizeBaseUrl(configuredUrl)),
    ];
  }

  return prioritizedUrls;
};

/** React Native FormData expects a proper file URI (keep file:// on iOS). */
function uriForUpload(localUri: string): string {
  if (!localUri) return localUri;
  if (Platform.OS === 'ios' && !localUri.startsWith('file://')) {
    return `file://${localUri}`;
  }
  return localUri;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeConfidence(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric > 1) {
    return Math.max(0, Math.min(1, numeric / 100));
  }
  return Math.max(0, Math.min(1, numeric));
}

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The recognition service took too long to respond.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchApiWithFallback(path: string, init: RequestInit): Promise<Response> {
  const candidates = resolvedBaseUrl
    ? [resolvedBaseUrl, ...getBaseUrlCandidates().filter((url) => url !== resolvedBaseUrl)]
    : getBaseUrlCandidates();

  let lastError: unknown = null;
  for (const baseUrl of candidates) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}${path}`, init);
      resolvedBaseUrl = baseUrl;
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('The recognition service is unavailable right now.');
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  const payload = await response.json();
  if (!isRecord(payload)) {
    throw new Error('The recognition service returned an unexpected response.');
  }
  return payload;
}

async function throwApiError(response: Response, fallbackMessage: string): Promise<never> {
  try {
    const payload = await parseJson(response);
    const errorCode =
      typeof payload.error_code === 'string' ? payload.error_code : undefined;
    const detail = payload.detail;
    if (typeof detail === 'string' && detail.trim()) {
      const error = new Error(detail) as Error & { code?: string };
      error.code = errorCode;
      throw error;
    }
    const message = payload.message;
    if (typeof message === 'string' && message.trim()) {
      const error = new Error(message) as Error & { code?: string };
      error.code = errorCode;
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message !== 'The recognition service returned an unexpected response.') {
      throw error;
    }
  }

  const text = await response.text().catch(() => '');
  throw new Error(text.trim() || fallbackMessage);
}

export interface RecognitionResult {
  match_label: string | null;
  sound_card_id: string | null;
  confidence: number;
  phrase_output: string | null;
  message?: string;
  decision_source?: 'hybrid_acoustic_match' | 'prototype_acoustic_fallback';
  best_similarity?: number;
  second_best_similarity?: number | null;
  support_score?: number;
  active_signal_count?: number;
  rejection_reason?: 'below_threshold' | 'low_margin' | 'no_samples' | null;
}

export interface TrainingResponse {
  status: string;
  sound_card_id: string;
  sample_count: number;
  sample_index?: number;
  enrollment_quality?: 'poor' | 'fair' | 'good';
  distinctiveness_status?: 'good' | 'close' | 'poor';
  consistency_score?: number;
  recommended_action?: string | null;
}

export interface TrainedCardResponse {
  sound_card_id?: string;
  label?: string;
  phrase_output?: string;
  sample_count?: number;
  enrollment_quality?: 'poor' | 'fair' | 'good';
  distinctiveness_status?: 'good' | 'close' | 'poor';
  consistency_score?: number;
  recommended_action?: string | null;
}

export interface TrainingSampleInfo {
  sample_index: number;
  file_name?: string;
  format?: string;
  duration_seconds?: number | null;
  created_at?: number | null;
  playback_path: string;
}

async function getAuthorizedHeaders() {
  const token = await ensureBackendSession();
  if (!token) {
    throw new Error('No authenticated backend session is available.');
  }

  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function resolveRecognitionBaseUrl() {
  if (resolvedBaseUrl) {
    return resolvedBaseUrl;
  }

  await fetchApiWithFallback('/health', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resolvedBaseUrl) {
    throw new Error('The recognition service is unavailable right now.');
  }

  return resolvedBaseUrl;
}

/**
 * Fetches the user's generated communication bank trained cards.
 */
export async function fetchTrainedCards(_username?: string): Promise<TrainedCardResponse[]> {
  try {
    const token = await ensureBackendSession();
    if (!token) {
      return [];
    }

    const response = await fetchApiWithFallback('/cards', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      console.warn(`[Recognition] Failed to fetch trained cards: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const cards: Record<string, unknown>[] = Array.isArray(data.cards)
      ? data.cards.filter(isRecord)
      : [];
    return cards.map((card: Record<string, unknown>) => ({
      sound_card_id: typeof card?.sound_card_id === 'string' ? card.sound_card_id : undefined,
      label: typeof card?.label === 'string' ? card.label : undefined,
      phrase_output: typeof card?.phrase_output === 'string' ? card.phrase_output : undefined,
      sample_count: Number.isFinite(Number(card?.sample_count)) ? Number(card.sample_count) : undefined,
      enrollment_quality:
        card?.enrollment_quality === 'poor' || card?.enrollment_quality === 'fair' || card?.enrollment_quality === 'good'
          ? card.enrollment_quality
          : undefined,
      distinctiveness_status:
        card?.distinctiveness_status === 'good' ||
        card?.distinctiveness_status === 'close' ||
        card?.distinctiveness_status === 'poor'
          ? card.distinctiveness_status
          : undefined,
      consistency_score:
        Number.isFinite(Number(card?.consistency_score)) ? Number(card.consistency_score) : undefined,
      recommended_action:
        typeof card?.recommended_action === 'string' ? card.recommended_action : null,
    }));
  } catch (error) {
    console.error("[Recognition] fetchTrainedCards error:", error);
    return [];
  }
}

/**
 * Uploads a training audio sample for a specific sound card.
 */
export async function uploadTrainingSample(
  uri: string,
  soundCardId: string,
  label: string,
  phraseOutput: string,
  sampleIndex: number,
): Promise<TrainingResponse> {
  const formData = new FormData();
  const headers = await getAuthorizedHeaders();

  const filename = uri.split('/').pop() || 'recording.m4a';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `audio/${match[1]}` : 'audio/m4a';

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append('file', blob, filename);
  } else {
    // @ts-ignore RN FormData file part
    formData.append('file', {
      uri: uriForUpload(uri),
      name: filename,
      type,
    });
  }

  formData.append('sound_card_id', soundCardId);
  formData.append('label', label);
  formData.append('phrase_output', phraseOutput);
  formData.append('sample_index', String(sampleIndex));

  const response = await fetchApiWithFallback('/train-sample', {
    method: 'POST',
    body: formData,
    headers: {
      ...headers,
    },
  });

  if (!response.ok) {
    await throwApiError(response, 'Training could not be completed for this sample.');
  }

  const payload = await parseJson(response);
  const returnedCardId = payload.sound_card_id ?? payload.card_id;
  const returnedSampleCount = payload.sample_count ?? payload.sample_index;

  if (typeof returnedCardId !== 'string') {
    throw new Error('The training response did not include a sound card id.');
  }

  const sampleCount = Number(returnedSampleCount);
  if (!Number.isFinite(sampleCount)) {
    throw new Error('The training response did not include a valid sample count.');
  }

  return {
    status: typeof payload.status === 'string' ? payload.status : 'success',
    sound_card_id: returnedCardId,
    sample_count: sampleCount,
    sample_index: Number.isFinite(Number(payload.sample_index)) ? Number(payload.sample_index) : undefined,
    enrollment_quality:
      payload.enrollment_quality === 'poor' || payload.enrollment_quality === 'fair' || payload.enrollment_quality === 'good'
        ? payload.enrollment_quality
        : undefined,
    distinctiveness_status:
      payload.distinctiveness_status === 'good' ||
      payload.distinctiveness_status === 'close' ||
      payload.distinctiveness_status === 'poor'
        ? payload.distinctiveness_status
        : undefined,
    consistency_score:
      Number.isFinite(Number(payload.consistency_score)) ? Number(payload.consistency_score) : undefined,
    recommended_action:
      typeof payload.recommended_action === 'string' ? payload.recommended_action : null,
  };
}

/**
 * Predicts which sound card matches the recorded audio.
 */
export async function predictVocalSound(uri: string): Promise<RecognitionResult> {
  const formData = new FormData();
  const headers = await getAuthorizedHeaders();
  const filename = uri.split('/').pop() || 'predict.m4a';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `audio/${match[1]}` : 'audio/m4a';

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append('audio', blob, filename);
  } else {
    // @ts-ignore RN FormData file part
    formData.append('audio', {
      uri: uriForUpload(uri),
      name: filename,
      type,
    });
  }

  const response = await fetchApiWithFallback('/recognize', {
    method: 'POST',
    body: formData,
    headers: {
      ...headers,
    },
  });

  if (!response.ok) {
    await throwApiError(response, 'Recognition failed for that recording.');
  }

  const payload = await parseJson(response);

  return {
    match_label: typeof payload.match_label === 'string' ? payload.match_label : null,
    sound_card_id: typeof payload.sound_card_id === 'string' ? payload.sound_card_id : null,
    confidence: normalizeConfidence(payload.confidence),
    phrase_output: typeof payload.phrase_output === 'string' ? payload.phrase_output : null,
    message: typeof payload.message === 'string' ? payload.message : undefined,
    decision_source:
      payload.decision_source === 'hybrid_acoustic_match' || payload.decision_source === 'prototype_acoustic_fallback'
        ? payload.decision_source
        : undefined,
    best_similarity:
      Number.isFinite(Number(payload.best_similarity)) ? Number(payload.best_similarity) : undefined,
    second_best_similarity:
      payload.second_best_similarity == null
        ? null
        : Number.isFinite(Number(payload.second_best_similarity))
          ? Number(payload.second_best_similarity)
          : undefined,
    support_score:
      Number.isFinite(Number(payload.support_score)) ? Number(payload.support_score) : undefined,
    active_signal_count:
      Number.isFinite(Number(payload.active_signal_count)) ? Number(payload.active_signal_count) : undefined,
    rejection_reason:
      payload.rejection_reason === 'below_threshold' ||
      payload.rejection_reason === 'low_margin' ||
      payload.rejection_reason === 'no_samples'
        ? payload.rejection_reason
        : null,
  };
}

/**
 * Basic health check for the recognition service.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetchApiWithFallback('/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchTrainingSamples(soundCardId: string): Promise<TrainingSampleInfo[]> {
  const headers = await getAuthorizedHeaders();
  const response = await fetchApiWithFallback(`/cards/${encodeURIComponent(soundCardId)}/samples`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    await throwApiError(response, 'Could not load the saved training samples for this phrase.');
  }

  const payload = await parseJson(response);
  const samples = Array.isArray(payload.samples) ? payload.samples.filter(isRecord) : [];

  return samples.map((sample) => ({
    sample_index: Number(sample.sample_index),
    file_name: typeof sample.file_name === 'string' ? sample.file_name : undefined,
    format: typeof sample.format === 'string' ? sample.format : undefined,
    duration_seconds:
      sample.duration_seconds == null
        ? null
        : Number.isFinite(Number(sample.duration_seconds))
          ? Number(sample.duration_seconds)
          : null,
    created_at:
      sample.created_at == null
        ? null
        : Number.isFinite(Number(sample.created_at))
          ? Number(sample.created_at)
          : null,
    playback_path:
      typeof sample.playback_path === 'string'
        ? sample.playback_path
        : `/cards/${encodeURIComponent(soundCardId)}/samples/${Number(sample.sample_index)}/audio`,
  }));
}

export async function getTrainingSamplePlaybackSource(
  soundCardId: string,
  sampleIndex: number,
  playbackPath?: string,
): Promise<{ uri: string; headers: Record<string, string> }> {
  const headers = await getAuthorizedHeaders();
  const baseUrl = await resolveRecognitionBaseUrl();
  const relativePath = playbackPath || `/cards/${encodeURIComponent(soundCardId)}/samples/${sampleIndex}/audio`;
  const remoteUri = `${baseUrl}${relativePath}`;

  if (Platform.OS !== 'web') {
    const cacheRoot = FileSystem.cacheDirectory;
    if (!cacheRoot) {
      throw new Error('Audio playback cache is unavailable on this device.');
    }

    const playbackDirectory = `${cacheRoot}talkbridge-playback/`;
    await FileSystem.makeDirectoryAsync(playbackDirectory, { intermediates: true }).catch(() => {
      /* directory may already exist */
    });

    const safeCardId = encodeURIComponent(soundCardId);
    const cacheUri = `${playbackDirectory}${safeCardId}-sample-${sampleIndex}.wav`;
    await FileSystem.downloadAsync(remoteUri, cacheUri, {
      headers,
    });

    return {
      uri: cacheUri,
      headers: {},
    };
  }

  const response = await fetch(remoteUri, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    await throwApiError(response, 'Sample playback could not be loaded.');
  }

  const playbackBlob = await response.blob();
  const blobUrl = URL.createObjectURL(playbackBlob);

  return {
    uri: blobUrl,
    headers: {},
  };
}

export async function appendConfirmedMatchSample(params: {
  uri: string;
  soundCardId: string;
  label: string;
  phraseOutput: string;
  maxSamples?: number;
}): Promise<TrainingResponse | null> {
  const samples = await fetchTrainingSamples(params.soundCardId);
  const maxSamples = params.maxSamples ?? 8;

  if (samples.length >= maxSamples) {
    return null;
  }

  const usedIndexes = new Set(samples.map((sample) => sample.sample_index));
  let nextSampleIndex = 1;
  while (usedIndexes.has(nextSampleIndex)) {
    nextSampleIndex += 1;
  }

  return uploadTrainingSample(
    params.uri,
    params.soundCardId,
    params.label,
    params.phraseOutput,
    nextSampleIndex,
  );
}

export async function resetTrainingCard(soundCardId: string): Promise<void> {
  const headers = await getAuthorizedHeaders();
  const response = await fetchApiWithFallback(`/cards/${encodeURIComponent(soundCardId)}/reset`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    await throwApiError(response, 'Could not reset this training card.');
  }
}

export async function deleteTrainingCard(soundCardId: string): Promise<void> {
  const headers = await getAuthorizedHeaders();
  const response = await fetchApiWithFallback(`/cards/${encodeURIComponent(soundCardId)}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    await throwApiError(response, 'Could not delete this training card.');
  }
}
