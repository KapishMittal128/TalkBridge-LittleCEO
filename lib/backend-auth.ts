import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACTIVE_SESSION_KEY = 'talkbridge_active_session';
const CREDENTIALS_KEY_PREFIX = 'talkbridge_creds_';
const BACKEND_SESSION_KEY = 'talkbridge_backend_session';
const REQUEST_TIMEOUT_MS = 12000;
let resolvedBaseUrl: string | null = null;

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

function extractHostFromExpoUrl(rawValue?: string | null) {
  if (!rawValue) {
    return null;
  }

  const withoutScheme = rawValue.trim().replace(/^[a-z]+:\/\//i, '').replace(/^\/\//, '');
  const hostSegment = withoutScheme.split('/')[0]?.split('?')[0]?.trim();
  if (!hostSegment) {
    return null;
  }

  const host = hostSegment.split(':')[0]?.trim();
  if (!host || host.toLowerCase() === 'exp') {
    return null;
  }

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

function getBaseUrlCandidates() {
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
}

async function secureGetItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`[BackendAuth] SecureStore.getItemAsync failed for ${key}. Falling back to AsyncStorage.`, error);
    return AsyncStorage.getItem(key);
  }
}

async function secureSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }

  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`[BackendAuth] SecureStore.setItemAsync failed for ${key}. Falling back to AsyncStorage.`, error);
    await AsyncStorage.setItem(key, value);
  }
}

async function secureDeleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }

  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`[BackendAuth] SecureStore.deleteItemAsync failed for ${key}. Falling back to AsyncStorage.`, error);
    await AsyncStorage.removeItem(key);
  }
}

async function fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
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

  throw lastError instanceof Error ? lastError : new Error('Backend service is unavailable.');
}

async function getStoredCredentials(username: string) {
  const raw = await secureGetItem(`${CREDENTIALS_KEY_PREFIX}${username}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as { username: string; passwordHash: string };
  } catch {
    return null;
  }
}

async function syncBackendUser(username: string, passwordHash: string) {
  const response = await fetchApiWithFallback('/auth/sync-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      username,
      password_hash: passwordHash,
    }),
  });

  if (!response.ok && response.status !== 409) {
    const text = await response.text().catch(() => '');
    throw new Error(text.trim() || 'Could not sync backend credentials.');
  }
}

async function createBackendSession(username: string, passwordHash: string) {
  const response = await fetchApiWithFallback('/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      username,
      password_hash: passwordHash,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text.trim() || 'Could not open a backend session.');
  }

  const payload = (await response.json()) as { token?: string };
  if (!payload.token) {
    throw new Error('Backend session response was missing a token.');
  }

  await secureSetItem(
    BACKEND_SESSION_KEY,
    JSON.stringify({
      username,
      token: payload.token,
    }),
  );

  return payload.token;
}

export async function getBackendSessionToken(): Promise<string | null> {
  const activeUsername = await secureGetItem(ACTIVE_SESSION_KEY);
  if (!activeUsername) {
    return null;
  }

  const cached = await secureGetItem(BACKEND_SESSION_KEY);
  if (!cached) {
    return null;
  }

  try {
    const parsed = JSON.parse(cached) as { username: string; token: string };
    if (parsed.username === activeUsername && parsed.token) {
      return parsed.token;
    }
  } catch {
    /* fall through */
  }

  return null;
}

export async function ensureBackendSession(): Promise<string | null> {
  const cached = await getBackendSessionToken();
  if (cached) {
    return cached;
  }

  const activeUsername = await secureGetItem(ACTIVE_SESSION_KEY);
  if (!activeUsername) {
    return null;
  }

  const credentials = await getStoredCredentials(activeUsername);
  if (!credentials?.passwordHash) {
    return null;
  }

  try {
    return await createBackendSession(activeUsername, credentials.passwordHash);
  } catch (error) {
    await syncBackendUser(activeUsername, credentials.passwordHash);
    return createBackendSession(activeUsername, credentials.passwordHash);
  }
}

export async function bootstrapBackendUser(username: string, passwordHash: string): Promise<void> {
  try {
    await syncBackendUser(username, passwordHash);
    await createBackendSession(username, passwordHash);
  } catch (error) {
    console.warn('[BackendAuth] Backend user bootstrap failed.', error);
  }
}

export async function clearBackendSession(): Promise<void> {
  const token = await getBackendSessionToken();
  await secureDeleteItem(BACKEND_SESSION_KEY);

  if (token) {
    try {
      await fetchApiWithFallback('/auth/session/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      console.warn('[BackendAuth] Backend session close failed.', error);
    }
  }
}
