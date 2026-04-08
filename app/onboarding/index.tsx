import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Globe2,
  HeartHandshake,
  Languages,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react-native';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/contexts/AuthContext';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { OnboardingStepCard } from '@/components/ui/OnboardingStepCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { VoiceWavePlaceholder } from '@/components/ui/VoiceWavePlaceholder';
import { Colors, Layout, Motion, Radius, Spacing, Typography } from '@/constants/theme';

type OnboardingStep = 'welcome' | 'user_type' | 'language' | 'finalizing';

const STEPS: OnboardingStep[] = ['welcome', 'user_type', 'language', 'finalizing'];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [userType, setUserType] = useState<'self' | 'caregiver_assisted' | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishingError, setFinishingError] = useState<string | null>(null);

  const { setOnboardingComplete } = useAppStore();
  const { updateProfile } = useAuth();

  async function handleFinalize() {
    try {
      setIsFinishing(true);
      setFinishingError(null);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      await updateProfile({
        user_type: userType ?? 'self',
        output_language: language,
        onboarding_completed: true,
        display_name: 'Local User',
      });

      await setOnboardingComplete(true);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      setFinishingError(error instanceof Error ? error.message : 'Unable to complete setup right now.');
    } finally {
      setIsFinishing(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <AuroraBackground>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.progressRow}>
          {STEPS.map((item, index) => (
            <View
              key={item}
              style={[
                styles.progressDot,
                index === stepIndex && styles.progressCurrent,
                index < stepIndex && styles.progressDone,
              ]}
            />
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'welcome' ? (
            <Animated.View entering={FadeIn.duration(500)} style={styles.screenBlock}>
              <View style={styles.heroCenter}>
                <View style={styles.heroBadge}>
                  <Sparkles size={20} color={Colors.primary} />
                  <Text style={styles.heroBadgeText}>TalkBridge</Text>
                </View>
                <Text style={styles.heroTitle}>A warm bridge between expression and understanding.</Text>
                <Text style={styles.heroSupport}>
                  Train personal sounds, map them to phrases, and communicate in a space that feels calm, safe, and responsive.
                </Text>
              </View>

              <GlassPanel variant="elevated" glow="cyan" radius={Radius.panel} padding={Spacing['2xl']} style={styles.welcomePanel}>
                <SectionHeader
                  eyebrow="What you get"
                  title="Built with care for everyday communication"
                  subtitle="Everything is arranged to reduce friction: fast shortcuts, guided training, and gentle feedback when recognition needs another try."
                />
              </GlassPanel>

              <Pressable style={styles.primaryButton} onPress={() => setStep('user_type')}>
                <Text style={styles.primaryButtonText}>Begin setup</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {step === 'user_type' ? (
            <Animated.View entering={FadeInDown.springify().damping(Motion.spring.gentle.damping)} style={styles.screenBlock}>
              <SectionHeader
                eyebrow="Step 1"
                title="Who are we designing this space for?"
                subtitle="This helps TalkBridge tune the language and defaults. You can change it later."
              />

              <View style={styles.stack}>
                <OnboardingStepCard
                  title="For myself"
                  subtitle="I will use TalkBridge to express my needs, feelings, and requests."
                  icon={UserRound}
                  active={userType === 'self'}
                  onPress={() => setUserType('self')}
                />
                <OnboardingStepCard
                  title="For someone I support"
                  subtitle="I am setting this up with care for another person."
                  icon={HeartHandshake}
                  active={userType === 'caregiver_assisted'}
                  onPress={() => setUserType('caregiver_assisted')}
                />
              </View>

              <Pressable
                style={[styles.primaryButton, !userType && styles.disabledButton]}
                disabled={!userType}
                onPress={() => setStep('language')}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {step === 'language' ? (
            <Animated.View entering={FadeInDown.springify().damping(Motion.spring.gentle.damping)} style={styles.screenBlock}>
              <SectionHeader
                eyebrow="Step 2"
                title="Choose the spoken output language"
                subtitle="This is the voice used when a phrase is recognized and spoken aloud."
              />

              <View style={styles.stack}>
                <OnboardingStepCard
                  title="English"
                  subtitle="Clear default for speech output and starter phrases."
                  icon={Languages}
                  active={language === 'en'}
                  onPress={() => setLanguage('en')}
                />
                <OnboardingStepCard
                  title="Hindi"
                  subtitle="Supportive starter choice for multilingual homes."
                  icon={Globe2}
                  active={language === 'hi'}
                  onPress={() => setLanguage('hi')}
                />
              </View>

              <Pressable style={styles.primaryButton} onPress={() => setStep('finalizing')}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {step === 'finalizing' ? (
            <Animated.View entering={FadeInUp.springify().damping(Motion.spring.gentle.damping)} style={styles.screenBlock}>
              <SectionHeader
                centered
                eyebrow="Final step"
                title="Preparing your communication space"
                subtitle="Starter categories, quick phrases, and training flow are being arranged with care."
              />

              <GlassPanel variant="elevated" glow="mint" radius={Radius.panel} padding={Spacing['2xl']} style={styles.finalPanel}>
                {isFinishing ? (
                  <>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <View style={styles.wavePanel}>
                      <VoiceWavePlaceholder active />
                    </View>
                    <Text style={styles.finalTitle}>Seeding your voice library...</Text>
                    <Text style={styles.finalSupport}>Needs, feelings, actions, emergency, and quick shortcuts are being prepared.</Text>
                  </>
                ) : finishingError ? (
                  <>
                    <View style={styles.errorIcon}>
                      <ShieldCheck size={24} color={Colors.warmth} />
                    </View>
                    <Text style={styles.finalTitle}>Setup paused</Text>
                    <Text style={styles.finalSupport}>{finishingError}</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.successIcon}>
                      <ShieldCheck size={24} color={Colors.accent} />
                    </View>
                    <Text style={styles.finalTitle}>Ready to enter TalkBridge</Text>
                    <Text style={styles.finalSupport}>Your home hub, shortcut grid, communication library, and training chamber are all prepared.</Text>
                  </>
                )}
              </GlassPanel>

              <Pressable style={styles.primaryButton} onPress={handleFinalize} disabled={isFinishing}>
                <Text style={styles.primaryButtonText}>{isFinishing ? 'Finishing...' : finishingError ? 'Try again' : 'Enter TalkBridge'}</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </ScrollView>
      </View>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.glassBorderSubtle,
  },
  progressCurrent: {
    width: 28,
    backgroundColor: Colors.primary,
  },
  progressDone: {
    backgroundColor: 'rgba(54,215,255,0.5)',
  },
  screenBlock: {
    flex: 1,
    justifyContent: 'space-between',
    gap: Spacing['2xl'],
  },
  heroCenter: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: Spacing.xl,
  },
  heroBadgeText: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  heroTitle: {
    ...Typography.heroTitle,
    textAlign: 'center',
    maxWidth: 340,
  },
  heroSupport: {
    ...Typography.supportText,
    textAlign: 'center',
    marginTop: Spacing.lg,
    maxWidth: 340,
  },
  welcomePanel: {
    minHeight: 192,
  },
  stack: {
    gap: Spacing.md,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 10,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: 17,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.35,
  },
  finalPanel: {
    alignItems: 'center',
    minHeight: 280,
    justifyContent: 'center',
  },
  wavePanel: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  finalTitle: {
    ...Typography.sectionTitle,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  finalSupport: {
    ...Typography.supportText,
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 300,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(85,230,193,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(85,230,193,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255,138,122,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,138,122,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
