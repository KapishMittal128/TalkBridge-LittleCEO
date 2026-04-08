import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  User,
  Vibrate,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/store/data-store';
import { Colors, Layout, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

function InfoRow({
  icon: Icon,
  title,
  subtitle,
  toneColor,
  trailing,
  onPress,
}: {
  icon: typeof Mail;
  title: string;
  subtitle: string;
  toneColor: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.infoRow,
        !onPress && styles.infoRowDisabled,
        pressed && onPress ? styles.infoRowPressed : null,
      ]}
    >
      <View style={[styles.infoIconWrap, { backgroundColor: `${toneColor}14` }]}>
        <Icon size={18} color={toneColor} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoSubtitle}>{subtitle}</Text>
      </View>
      {trailing}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, logout, updateProfile } = useAuth();
  const soundCards = useDataStore((state) => state.soundCards);
  const history = useDataStore((state) => state.history);
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [activePanel, setActivePanel] = useState<'username' | 'displayName' | 'help' | 'privacy' | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  const displayName = profile?.display_name?.trim() || user || 'TalkBridge member';
  const username = user ?? 'local-user';
  const trainedCards = useMemo(
    () => soundCards.filter((card) => card.training_status === 'ready').length,
    [soundCards],
  );
  const totalSamples = useMemo(
    () => soundCards.reduce((sum, card) => sum + card.sample_count, 0),
    [soundCards],
  );
  const joinedDate = useMemo(() => {
    const source = profile?.created_at ? new Date(profile.created_at) : null;
    if (!source || Number.isNaN(source.getTime())) {
      return 'Just now';
    }

    return source.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [profile?.created_at]);
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    setDisplayNameDraft(displayName);
  }, [displayName]);

  useEffect(() => {
    setVoiceFeedback(profile?.voice_feedback_enabled !== false);
    setHapticFeedback(profile?.haptic_feedback_enabled !== false);
  }, [profile?.voice_feedback_enabled, profile?.haptic_feedback_enabled]);

  function onSignOut() {
    void (async () => {
      await logout();
      router.replace('/auth/sign-in');
    })();
  }

  async function saveDisplayName() {
    const nextName = displayNameDraft.trim();
    if (!nextName) {
      setDisplayNameError('Display name cannot be empty.');
      return;
    }

    await updateProfile({ display_name: nextName });
    setDisplayNameError(null);
    setActivePanel(null);
  }

  function handleVoiceFeedbackChange(value: boolean) {
    setVoiceFeedback(value);
    void updateProfile({ voice_feedback_enabled: value });
  }

  function handleHapticFeedbackChange(value: boolean) {
    setHapticFeedback(value);
    void updateProfile({ haptic_feedback_enabled: value });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: Layout.bottomNavClearance + insets.bottom,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.replace('/')} hitSlop={12}>
            <ChevronLeft size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.screenTitle}>Profile</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileGlow} />
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || 'TB'}</Text>
            </View>
            <View style={styles.profileCopy}>
              <View style={styles.memberChip}>
                <ShieldCheck size={14} color={Colors.primary} />
              <Text style={styles.memberChipText}>TalkBridge member</Text>
            </View>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>@{username}</Text>
          </View>
        </View>

          <View style={styles.profileStats}>
            <View style={styles.profileStatCard}>
              <Text style={styles.profileStatValue}>{profile?.output_language?.toUpperCase() || 'EN'}</Text>
              <Text style={styles.profileStatLabel}>Voice language</Text>
            </View>
            <View style={[styles.profileStatCard, styles.profileStatCardViolet]}>
              <Text style={styles.profileStatValue}>{profile?.user_type === 'caregiver_assisted' ? 'Assist' : 'Self'}</Text>
              <Text style={styles.profileStatLabel}>User mode</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>Personal information</Text>
          <InfoRow
            icon={Mail}
            title="Username"
            subtitle={username}
            toneColor={Colors.primary}
            onPress={() => setActivePanel('username')}
            trailing={<ChevronRight size={18} color={Colors.textTertiary} />}
          />
          <View style={styles.divider} />
          <InfoRow
            icon={User}
            title="Display name"
            subtitle={displayName}
            toneColor={Colors.secondary}
            onPress={() => {
              setDisplayNameDraft(displayName);
              setDisplayNameError(null);
              setActivePanel('displayName');
            }}
            trailing={<ChevronRight size={18} color={Colors.textTertiary} />}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>Preferences</Text>
          <InfoRow
            icon={Bell}
            title="Voice feedback"
            subtitle="Audible confirmation after phrase output."
            toneColor={Colors.primary}
            trailing={
              <Switch
                value={voiceFeedback}
                onValueChange={handleVoiceFeedbackChange}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <View style={styles.divider} />
          <InfoRow
            icon={Vibrate}
            title="Haptic feedback"
            subtitle="Touch response while speaking and training."
            toneColor={Colors.accent}
            trailing={
              <Switch
                value={hapticFeedback}
                onValueChange={handleHapticFeedbackChange}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>Support and privacy</Text>
          <InfoRow
            icon={CircleHelp}
            title="Help center"
            subtitle="Learn how speaking, training, and calibration work."
            toneColor={Colors.warning}
            onPress={() => setActivePanel('help')}
            trailing={<ChevronRight size={18} color={Colors.textTertiary} />}
          />
          <View style={styles.divider} />
          <InfoRow
            icon={Lock}
            title="Privacy"
            subtitle="Your training and phrase data stay on this device."
            toneColor={Colors.emergency}
            onPress={() => setActivePanel('privacy')}
            trailing={<ChevronRight size={18} color={Colors.textTertiary} />}
          />
        </View>

        <Pressable style={styles.signOutButton} onPress={onSignOut}>
          <LogOut size={18} color={Colors.emergency} />
          <Text style={styles.signOutText}>Log out</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={activePanel !== null} transparent animationType="fade" onRequestClose={() => setActivePanel(null)}>
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={() => setActivePanel(null)} />
          <View style={[styles.modalCard, { marginBottom: insets.bottom + Spacing.lg }]}>
            {activePanel === 'username' ? (
              <>
                <Text style={styles.modalTitle}>Account username</Text>
                <Text style={styles.modalBody}>
                  Your username is <Text style={styles.modalBodyStrong}>@{username}</Text>. It is used to keep your
                  TalkBridge training data tied to this account.
                </Text>
                <View style={styles.accountSummaryRow}>
                  <View style={styles.accountSummaryCard}>
                    <Text style={styles.accountSummaryValue}>{trainedCards}</Text>
                    <Text style={styles.accountSummaryLabel}>ready cards</Text>
                  </View>
                  <View style={styles.accountSummaryCard}>
                    <Text style={styles.accountSummaryValue}>{totalSamples}</Text>
                    <Text style={styles.accountSummaryLabel}>saved samples</Text>
                  </View>
                </View>
                <View style={styles.accountMetaList}>
                  <Text style={styles.modalListItem}>Member since {joinedDate}</Text>
                  <Text style={styles.modalListItem}>History entries saved: {history.length}</Text>
                  <Text style={styles.modalListItem}>Account names are kept stable so your training stays isolated.</Text>
                </View>
                <Text style={styles.modalCaption}>To use a different username, create a new account and train it separately.</Text>
              </>
            ) : null}

            {activePanel === 'displayName' ? (
              <>
                <Text style={styles.modalTitle}>Edit display name</Text>
                <Text style={styles.modalBody}>This name appears across your TalkBridge profile and greeting screens.</Text>
                <TextInput
                  value={displayNameDraft}
                  onChangeText={(value) => {
                    setDisplayNameDraft(value);
                    if (displayNameError) {
                      setDisplayNameError(null);
                    }
                  }}
                  placeholder="Enter display name"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.modalInput}
                  maxLength={40}
                  autoFocus
                />
                {displayNameError ? <Text style={styles.modalError}>{displayNameError}</Text> : null}
              </>
            ) : null}

            {activePanel === 'help' ? (
              <>
                <Text style={styles.modalTitle}>Help center</Text>
                <Text style={styles.modalBody}>Tap the main speak button to recognize a trained sound and trigger its phrase.</Text>
                <Text style={styles.modalSectionTitle}>Training</Text>
                <Text style={styles.modalListItem}>Train each card with at least three clear samples for reliable matching.</Text>
                <Text style={styles.modalListItem}>Use Categories to replay saved samples, recalibrate any card, or add more examples if recognition drifts.</Text>
                <Text style={styles.modalSectionTitle}>Daily use</Text>
                <Text style={styles.modalListItem}>Quick phrases let you trigger important ready cards without recording first.</Text>
                <Text style={styles.modalListItem}>History shows your recent communication moments and outputs.</Text>
                <Text style={styles.modalSectionTitle}>Tips</Text>
                <Text style={styles.modalListItem}>Hold the phone close and reduce background noise while calibrating.</Text>
                <Text style={styles.modalListItem}>If a phrase is missed, retrain that specific card with three new takes.</Text>
              </>
            ) : null}

            {activePanel === 'privacy' ? (
              <>
                <Text style={styles.modalTitle}>Privacy</Text>
                <Text style={styles.modalBody}>
                  Your TalkBridge account, cards, and training history are stored per account on this device, and your
                  voice samples stay scoped to your signed-in profile.
                </Text>
                <Text style={styles.modalSectionTitle}>What stays with your account</Text>
                <Text style={styles.modalListItem}>Logging out clears the in-memory session before another user signs in.</Text>
                <Text style={styles.modalListItem}>Each account keeps its own communication bank and training progress.</Text>
                <Text style={styles.modalListItem}>Display name, feedback preferences, and language stay saved to your profile.</Text>
                <Text style={styles.modalSectionTitle}>Control</Text>
                <Text style={styles.modalListItem}>You can sign out anytime from this screen.</Text>
              </>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondaryButton} onPress={() => setActivePanel(null)}>
                <Text style={styles.modalSecondaryButtonText}>Close</Text>
              </Pressable>
              {activePanel === 'displayName' ? (
                <Pressable style={styles.modalPrimaryButton} onPress={() => void saveDisplayName()}>
                  <Text style={styles.modalPrimaryButtonText}>Save</Text>
                </Pressable>
              ) : null}
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
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    ...Shadow.soft,
  },
  screenTitle: {
    ...Typography.sectionTitle,
    fontSize: 22,
  },
  topBarSpacer: {
    width: 42,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    padding: Spacing.xl,
    overflow: 'hidden',
    ...Shadow.luxe,
  },
  profileGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -50,
    top: -70,
    backgroundColor: Colors.glowPrimary,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: Colors.surfaceTintBlue,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.sectionTitle,
    color: Colors.primary,
    fontSize: 28,
  },
  profileCopy: {
    flex: 1,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceTintBlue,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.12)',
    marginBottom: Spacing.sm,
  },
  memberChipText: {
    ...Typography.microLabel,
    color: Colors.primary,
    fontSize: 10,
  },
  profileName: {
    ...Typography.heroTitle,
    fontSize: 30,
    lineHeight: 34,
  },
  profileEmail: {
    ...Typography.supportText,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  profileStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  profileStatCard: {
    flex: 1,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceTintBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.08)',
  },
  profileStatCardViolet: {
    backgroundColor: Colors.surfaceTintViolet,
    borderColor: 'rgba(124,58,237,0.08)',
  },
  profileStatValue: {
    ...Typography.microLabel,
    color: Colors.textPrimary,
    fontSize: 14,
    textTransform: 'none',
    letterSpacing: 0,
  },
  profileStatLabel: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 11,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    padding: Spacing.xl,
    ...Shadow.soft,
  },
  sectionEyebrow: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoRowPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  infoRowDisabled: {
    opacity: 0.9,
  },
  infoIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  infoSubtitle: {
    ...Typography.supportText,
    marginTop: 3,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.strokeMuted,
    marginVertical: Spacing.lg,
  },
  signOutButton: {
    alignSelf: 'stretch',
    minHeight: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceTintCoral,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  signOutText: {
    ...Typography.body,
    color: Colors.emergency,
    fontWeight: '700',
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'flex-end',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xl,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.drawer,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.luxe,
  },
  modalTitle: {
    ...Typography.sectionTitle,
    fontSize: 22,
  },
  modalBody: {
    ...Typography.supportText,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  modalBodyStrong: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  modalCaption: {
    ...Typography.microLabel,
    color: Colors.textMuted,
    textTransform: 'none',
    letterSpacing: 0,
  },
  modalSectionTitle: {
    ...Typography.microLabel,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.xs,
  },
  modalInput: {
    ...Typography.body,
    minHeight: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
  },
  modalError: {
    ...Typography.microLabel,
    color: Colors.emergency,
    textTransform: 'none',
    letterSpacing: 0,
  },
  modalListItem: {
    ...Typography.supportText,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  accountSummaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  accountSummaryCard: {
    flex: 1,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  accountSummaryValue: {
    ...Typography.sectionTitle,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  accountSummaryLabel: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    textTransform: 'none',
    letterSpacing: 0,
    marginTop: 4,
  },
  accountMetaList: {
    gap: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalSecondaryButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  modalSecondaryButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalPrimaryButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  modalPrimaryButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
