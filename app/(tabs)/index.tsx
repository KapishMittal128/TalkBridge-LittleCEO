import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing, Radius, Motion, Ui } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';
import { useDataStore, SoundCard } from '@/store/data-store';
import { Heart, Settings, Radio, Plus } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SpeakCoreButton } from '@/components/ui/SpeakCoreButton';
import { useAudioStore } from '@/store/audio-store';
import { predictVocalSound, checkBackendHealth } from '@/lib/recognition';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const initializeData = useDataStore((s) => s.initializeData);
  const soundCards = useDataStore((s) => s.soundCards);
  const recordRecognition = useDataStore((s) => s.recordRecognition);
  const incrementCardUsage = useDataStore((s) => s.incrementCardUsage);

  const {
    startRecording,
    stopRecording,
    isRecording,
    isProcessing: isAudioProcessing,
    error: audioError,
  } = useAudioStore();
  const { height } = useWindowDimensions();

  const [isPredicting, setIsPredicting] = useState(false);
  const [lastPhrase, setLastPhrase] = useState<string | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  useEffect(() => {
    void initializeData();
  }, [initializeData]);

  const refreshHealth = useCallback(() => {
    void checkBackendHealth().then(setBackendOk);
  }, []);

  useEffect(() => {
    refreshHealth();
    const t = setInterval(refreshHealth, 15000);
    return () => clearInterval(t);
  }, [refreshHealth]);

  const entrance = (delay: number) =>
    FadeInUp.delay(delay).springify().damping(20).stiffness(150);

  const readyCards = soundCards.filter((c) => c.training_status === 'ready');
  const favoriteCards = soundCards
    .filter((c) => c.is_favorite && c.training_status === 'ready')
    .slice(0, 8);

  const speakPhrase = (text: string) => {
    Speech.speak(text, {
      language: profile?.output_language || 'en',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const handleFavoritePress = (card: SoundCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    speakPhrase(card.phrase_output);
  };

  const handleSpeakPress = async () => {
    if (isRecording) {
      try {
        setIsPredicting(true);
        const uri = await stopRecording();
        if (!uri) {
          setLastPhrase(null);
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const result = await predictVocalSound(uri);

        if (result?.sound_card_id && result.phrase_output) {
          setLastPhrase(result.phrase_output);
          speakPhrase(result.phrase_output);
          await recordRecognition({
            phrase_output: result.phrase_output,
            confidence: result.confidence,
            sound_card_id: result.sound_card_id,
          });
          await incrementCardUsage(result.sound_card_id);
        } else {
          setLastPhrase(
            result?.message === 'No confident match found'
              ? 'No confident match'
              : 'Recognition unclear',
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (error) {
        console.error('Prediction failed:', error);
        setLastPhrase('Recognition service unreachable');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsPredicting(false);
      }
    } else {
      try {
        setLastPhrase(null);
        await startRecording();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  };

  const insightLine =
    backendOk === null
      ? 'Checking recognition service…'
      : backendOk
        ? readyCards.length > 0
          ? `${readyCards.length} trained sound(s) ready. Use the core to match your voice to a card.`
          : 'Open the Bank and complete TRAIN on at least one card so matching works.'
        : 'Recognition service offline — start the backend (see RUN.md) and set EXPO_PUBLIC_RECOGNITION_API_URL.';

  const backendLabel =
    backendOk === null ? 'Checking…' : backendOk ? 'Service online' : 'Service offline';

  return (
    <AuroraBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { minHeight: height, paddingTop: insets.top + Spacing.md },
        ]}
      >
        <Animated.View entering={entrance(0)}>
          <View style={styles.topRow}>
            <View style={styles.brandBlock}>
              <Text style={Ui.overline}>TalkBridge</Text>
              <Text style={styles.greetingLine}>
                <Text style={styles.greetingMuted}>Hello, </Text>
                <Text style={styles.greetingName}>{profile?.display_name || 'Friend'}</Text>
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.settingsFab, pressed && { opacity: 0.82 }]}
            >
              <Settings size={22} color={Colors.primary} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusChip,
                backendOk === true && styles.statusChipOk,
                backendOk === false && styles.statusChipOff,
              ]}
            >
              <Radio
                size={14}
                color={
                  backendOk === null
                    ? Colors.textMuted
                    : backendOk
                      ? Colors.success
                      : Colors.emergency
                }
              />
              <Text style={styles.statusChipText}>{backendLabel}</Text>
            </View>
            <View style={styles.statusChipMuted}>
              <Text style={styles.statusChipMutedText}>{readyCards.length} ready</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={entrance(Motion.choreography.stagger)} style={styles.hero}>
          <GlassPanel variant="elevated" padding={28} style={styles.heroPanel}>
            <SpeakCoreButton
              onPress={handleSpeakPress}
              isListening={isRecording}
              isProcessing={isPredicting || isAudioProcessing}
            />
            <View style={styles.statusBox}>
              {isPredicting ? (
                <Animated.View key="predicting" entering={FadeInUp} style={styles.statusInner}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.statusText}>Matching your sound…</Text>
                </Animated.View>
              ) : lastPhrase ? (
                <Animated.Text key="phrase" entering={FadeInUp} style={styles.phraseText}>
                  “{lastPhrase}”
                </Animated.Text>
              ) : (
                <Animated.Text key="idle" entering={FadeInUp} style={styles.hintText}>
                  {isRecording ? 'Listening…' : 'Tap once to record · tap again to match'}
                </Animated.Text>
              )}
            </View>
            {audioError ? <Text style={styles.audioErr}>{audioError}</Text> : null}
          </GlassPanel>
        </Animated.View>

        <Animated.View entering={entrance(Motion.choreography.stagger * 2)}>
          <View style={styles.sectionHeadRow}>
            <View style={styles.sectionLabelFlex}>
              <SectionLabel
                eyebrow="Shortcuts"
                title="Favorite sounds"
                subtitle="Tap a card to speak it instantly."
              />
            </View>
            <Pressable
              onPress={() => router.push('/modal')}
              style={({ pressed }) => [styles.addPill, pressed && { opacity: 0.88 }]}
            >
              <Plus size={18} color={Colors.textInverse} strokeWidth={2.5} />
              <Text style={styles.addPillText}>New</Text>
            </Pressable>
          </View>

          {favoriteCards.length === 0 ? (
            <GlassPanel variant="ghost" padding={Spacing.xl} style={styles.emptyFav}>
              <Heart size={32} color={Colors.textMuted} style={{ opacity: 0.5, marginBottom: Spacing.md }} />
              <Text style={styles.emptyFavTitle}>No favorites yet</Text>
              <Text style={styles.emptyFavText}>
                Train cards in the Bank, then tap the heart on a card you use often.
              </Text>
              <Pressable
                onPress={() => router.push('/categories')}
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}
              >
                <Text style={styles.secondaryBtnText}>Open Bank</Text>
              </Pressable>
            </GlassPanel>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favScroll}
            >
              {favoriteCards.map((card) => (
                <Pressable
                  key={card.id}
                  onPress={() => handleFavoritePress(card)}
                  style={({ pressed }) => [styles.favCardWrap, pressed && { opacity: 0.92 }]}
                >
                  <GlassPanel
                    accent={card.is_emergency}
                    padding={Spacing.lg}
                    style={styles.favCard}
                  >
                    <View style={styles.favIconRow}>
                      <Heart
                        size={20}
                        color={card.is_emergency ? Colors.emergency : Colors.warmth}
                        fill={card.is_emergency ? Colors.emergency : Colors.warmth}
                      />
                    </View>
                    <Text style={styles.cardLabel} numberOfLines={3}>
                      {card.phrase_output}
                    </Text>
                  </GlassPanel>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        <Animated.View entering={entrance(Motion.choreography.stagger * 3)}>
          <GlassPanel variant="ghost" padding={Spacing.lg} style={styles.insightPanel}>
            <View style={styles.insightRow}>
              <View style={styles.insightIcon}>
                <Radio size={18} color={Colors.accent} />
              </View>
              <Text style={styles.insightText}>{insightLine}</Text>
            </View>
          </GlassPanel>
        </Animated.View>

        <View style={{ height: 120 + insets.bottom }} />
      </ScrollView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: Spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  brandBlock: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  greetingLine: {
    marginTop: Spacing.sm,
  },
  greetingMuted: {
    fontSize: FontSize['2xl'],
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  greetingName: {
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  settingsFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeStrong,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  statusChipOk: {
    borderColor: 'rgba(56, 226, 177, 0.35)',
    backgroundColor: 'rgba(56, 226, 177, 0.08)',
  },
  statusChipOff: {
    borderColor: 'rgba(255, 90, 95, 0.35)',
    backgroundColor: 'rgba(255, 90, 95, 0.08)',
  },
  statusChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  statusChipMuted: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    justifyContent: 'center',
  },
  statusChipMutedText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  hero: {
    marginBottom: Spacing['2xl'],
  },
  heroPanel: {
    alignItems: 'center',
  },
  statusBox: {
    marginTop: Spacing.lg,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  statusInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    color: Colors.primary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  phraseText: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: Colors.glowPrimary,
    textShadowRadius: 12,
  },
  hintText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 20,
  },
  audioErr: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs,
    color: Colors.emergency,
    textAlign: 'center',
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionLabelFlex: {
    flex: 1,
    minWidth: 0,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    marginTop: 28,
  },
  addPillText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  favScroll: {
    paddingBottom: Spacing['2xl'],
    gap: Spacing.md,
    paddingRight: Spacing.xl,
  },
  favCardWrap: {
    width: 168,
    marginRight: Spacing.md,
  },
  favCard: {
    minHeight: 132,
    justifyContent: 'flex-start',
  },
  favIconRow: {
    marginBottom: Spacing.sm,
  },
  emptyFav: {
    marginBottom: Spacing['2xl'],
    alignItems: 'flex-start',
  },
  emptyFavTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptyFavText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },
  secondaryBtn: {
    backgroundColor: Colors.surfaceHighlight,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.strokeStrong,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  cardLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: 20,
  },
  insightPanel: {
    marginTop: Spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 226, 177, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 226, 177, 0.25)',
  },
  insightText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: 21,
  },
});
