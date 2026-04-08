import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  bootstrapBackendUser,
  clearBackendSession,
  ensureBackendSession,
} from '@/lib/backend-auth';
import { useAppStore } from '@/store/app-store';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  user_type: 'self' | 'caregiver_assisted';
  output_language: string;
  voice_feedback_enabled: boolean;
  haptic_feedback_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_step: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthFieldErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export interface AuthActionResult {
  error: string | null;
  fieldErrors?: AuthFieldErrors;
}

interface AuthContextValue {
  user: string | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<AuthActionResult>;
  register: (username: string, password: string, confirmPassword?: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  clearError: () => void;
}

const USERS_KEY = 'talkbridge_users';
const ACTIVE_SESSION_KEY = 'talkbridge_active_session';
const CREDENTIALS_KEY_PREFIX = 'talkbridge_creds_';
const PROFILE_KEY_PREFIX = 'talkbridge_data_';
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

const AuthContext = createContext<AuthContextValue | null>(null);

let authSnapshot: {
  user: string | null;
  profile: Profile | null;
  isLoading: boolean;
} = {
  user: null,
  profile: null,
  isLoading: true,
};

function credentialsKey(username: string) {
  return `${CREDENTIALS_KEY_PREFIX}${username}`;
}

function profileKey(username: string) {
  return `${PROFILE_KEY_PREFIX}${username}_profile`;
}

function normalizeUsername(username: string) {
  return username.trim();
}

function nowIso() {
  return new Date().toISOString();
}

function defaultProfile(username: string): Profile {
  const timestamp = nowIso();
  return {
    id: `profile-${username}`,
    user_id: username,
    display_name: username,
    user_type: 'self',
    output_language: 'en',
    voice_feedback_enabled: true,
    haptic_feedback_enabled: true,
    onboarding_completed: false,
    onboarding_step: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function withProfileDefaults(username: string, value: Partial<Profile> | null | undefined): Profile {
  return {
    ...defaultProfile(username),
    ...value,
    id: value?.id ?? `profile-${username}`,
    user_id: username,
  };
}

async function secureGetItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }

  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`[Auth] SecureStore.getItemAsync failed for ${key}. Falling back to AsyncStorage.`, error);
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
    console.warn(`[Auth] SecureStore.setItemAsync failed for ${key}. Falling back to AsyncStorage.`, error);
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
    console.warn(`[Auth] SecureStore.deleteItemAsync failed for ${key}. Falling back to AsyncStorage.`, error);
    await AsyncStorage.removeItem(key);
  }
}

async function getRegisteredUsers(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

async function saveRegisteredUsers(usernames: string[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(usernames));
}

async function loadProfile(username: string): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(profileKey(username));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

async function persistProfile(username: string, profile: Profile) {
  await AsyncStorage.setItem(profileKey(username), JSON.stringify(profile));
}

async function hashPassword(password: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export function getAuthSnapshot() {
  return authSnapshot;
}

export async function getActiveUsername() {
  if (authSnapshot.user) {
    return authSnapshot.user;
  }

  return secureGetItem(ACTIVE_SESSION_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authSnapshot = { user, profile, isLoading };
  }, [user, profile, isLoading]);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const activeUsername = await secureGetItem(ACTIVE_SESSION_KEY);
        if (!activeUsername) {
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setIsLoading(false);
          }
          return;
        }

        const credentials = await secureGetItem(credentialsKey(activeUsername));
        if (!credentials) {
          await secureDeleteItem(ACTIVE_SESSION_KEY);
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setIsLoading(false);
          }
          return;
        }

        const savedProfile = await loadProfile(activeUsername);

        if (isMounted) {
          setUser(activeUsername);
          setProfile(withProfileDefaults(activeUsername, savedProfile));
          setIsLoading(false);
        }
        void ensureBackendSession().catch((backendError) => {
          console.warn('[Auth] Backend session warmup failed during initialization.', backendError);
        });
      } catch (initError) {
        console.warn('[Auth] Session initialization failed.', initError);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  async function login(usernameInput: string, password: string): Promise<AuthActionResult> {
    const username = normalizeUsername(usernameInput);
    const fieldErrors: AuthFieldErrors = {};

    if (!username) {
      fieldErrors.username = 'Username is required.';
    }
    if (!password) {
      fieldErrors.password = 'Password is required.';
    }

    if (fieldErrors.username || fieldErrors.password) {
      setError(null);
      return { error: null, fieldErrors };
    }

    setIsLoading(true);
    setError(null);

    try {
      const credentialsRaw = await secureGetItem(credentialsKey(username));
      if (!credentialsRaw) {
        setError('No account found with this username.');
        return { error: 'No account found with this username.' };
      }

      const credentials = JSON.parse(credentialsRaw) as { username: string; passwordHash: string };
      const enteredHash = await hashPassword(password);
      if (credentials.passwordHash !== enteredHash) {
        setError('Incorrect password.');
        return { error: 'Incorrect password.' };
      }

      await secureSetItem(ACTIVE_SESSION_KEY, username);
      const savedProfile = await loadProfile(username);
      setUser(username);
      setProfile(withProfileDefaults(username, savedProfile));
      setError(null);
      void ensureBackendSession().catch((backendError) => {
        console.warn('[Auth] Backend session initialization failed after login.', backendError);
      });
      return { error: null };
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Unable to sign in right now.';
      setError(message);
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  }

  async function register(
    usernameInput: string,
    password: string,
    confirmPassword?: string,
  ): Promise<AuthActionResult> {
    const username = normalizeUsername(usernameInput);
    const fieldErrors: AuthFieldErrors = {};

    if (!username) {
      fieldErrors.username = 'Username is required.';
    } else if (!USERNAME_PATTERN.test(username)) {
      fieldErrors.username = 'Username must be 3–20 characters. Letters, numbers, underscores only.';
    }

    if (!password) {
      fieldErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      fieldErrors.password = 'Password must be at least 8 characters.';
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      fieldErrors.confirmPassword = 'Passwords do not match.';
    }

    if (fieldErrors.username || fieldErrors.password || fieldErrors.confirmPassword) {
      setError(null);
      return { error: null, fieldErrors };
    }

    setIsLoading(true);
    setError(null);

    try {
      const users = await getRegisteredUsers();
      if (users.includes(username)) {
        setError(null);
        return {
          error: null,
          fieldErrors: {
            username: 'An account with this username already exists.',
          },
        };
      }

      const passwordHash = await hashPassword(password);
      await secureSetItem(
        credentialsKey(username),
        JSON.stringify({
          username,
          passwordHash,
        }),
      );

      await saveRegisteredUsers([...users, username]);
      await secureSetItem(ACTIVE_SESSION_KEY, username);

      const nextProfile = defaultProfile(username);
      await persistProfile(username, nextProfile);
      void bootstrapBackendUser(username, passwordHash);

      setUser(username);
      setProfile(nextProfile);
      setError(null);
      return { error: null };
    } catch (registerError) {
      const message = registerError instanceof Error ? registerError.message : 'Unable to create this account.';
      setError(message);
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    await clearBackendSession();
    await secureDeleteItem(ACTIVE_SESSION_KEY);
    const { useDataStore } = await import('@/store/data-store');
    await useDataStore.getState().clearData();
    await useAppStore.getState().setOnboardingComplete(false);
    useAppStore.setState({
      isHydrated: true,
      isOnboardingComplete: false,
      currentMode: 'idle',
      outputLanguage: 'en',
      lastOutputText: null,
    });
    setUser(null);
    setProfile(null);
    setError(null);
    setIsLoading(false);
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return;

    const nextProfile: Profile = withProfileDefaults(user, {
      ...(profile ?? {}),
      ...updates,
      updated_at: nowIso(),
    });

    setProfile(nextProfile);
    await persistProfile(user, nextProfile);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isLoading,
      error,
      login,
      register,
      logout,
      updateProfile,
      clearError: () => setError(null),
    }),
    [user, profile, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
