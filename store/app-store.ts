import { create } from 'zustand';
import { storage } from '@/lib/storage';

const ONBOARDING_KEY = 'talkbridge_onboarding_complete';

// ---------------------------------------------------------------------------
// App Mode — reflects the current real-time recognition state
// ---------------------------------------------------------------------------
export type AppMode = 'idle' | 'listening' | 'processing' | 'result';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
interface AppState {
  isHydrated: boolean;
  isOnboardingComplete: boolean;
  currentMode: AppMode;
  outputLanguage: string;
  lastOutputText: string | null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
interface AppActions {
  initialize: () => Promise<void>;
  setOnboardingComplete: (value: boolean) => Promise<void>;
  setMode: (mode: AppMode) => void;
  setOutputLanguage: (language: string) => void;
  setLastOutput: (text: string | null) => void;
  resetMode: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useAppStore = create<AppState & AppActions>((set) => ({
  // --- State
  isHydrated: false,
  isOnboardingComplete: false,
  currentMode: 'idle',
  outputLanguage: 'en',
  lastOutputText: null,

  // --- Actions
  initialize: async () => {
    try {
      const v = await storage.getItem(ONBOARDING_KEY);
      set({
        isOnboardingComplete: v === 'true',
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  setOnboardingComplete: async (value) => {
    set({ isOnboardingComplete: value });
    try {
      if (value) {
        await storage.setItem(ONBOARDING_KEY, 'true');
      } else {
        await storage.removeItem(ONBOARDING_KEY);
      }
    } catch {
      /* non-fatal */
    }
  },

  setMode: (mode) => set({ currentMode: mode }),
  setOutputLanguage: (language) => set({ outputLanguage: language }),
  setLastOutput: (text) => set({ lastOutputText: text }),
  resetMode: () => set({ currentMode: 'idle', lastOutputText: null }),
}));
