import '../global.css';

import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';

// Keep splash screen visible while we resolve auth state.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize: initAuth, session, isLoading } = useAuthStore();
  const { initialize: initApp, isHydrated, isOnboardingComplete } = useAppStore();

  useEffect(() => {
    void Promise.all([initAuth(), initApp()]);
  }, [initAuth, initApp]);

  useEffect(() => {
    if (isLoading || !isHydrated) return;

    SplashScreen.hideAsync();

    // --- Routing matrix ---
    // Session=No,  Onboarding=No  → /auth/sign-in
    // Session=No,  Onboarding=Yes → /auth/sign-in
    // Session=Yes, Onboarding=No  → /onboarding
    // Session=Yes, Onboarding=Yes → /(tabs)
    if (!session) {
      router.replace('/auth/sign-in');
    } else if (!isOnboardingComplete) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoading, isHydrated, session, isOnboardingComplete]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" backgroundColor="#0F1117" />
    </>
  );
}
