import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageCircleMore, Sparkles, Waves } from 'lucide-react-native';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

interface HeroGreetingCardProps {
  greeting: string;
  message: string;
  statusLabel?: string;
  compact?: boolean;
}

export function HeroGreetingCard({
  greeting,
  message,
  statusLabel,
  compact = false,
}: HeroGreetingCardProps) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.ambientGlowPrimary} />
      <View style={styles.ambientGlowSecondary} />

      <View style={styles.topRow}>
        <View style={styles.badge}>
          <MessageCircleMore size={16} color={Colors.primary} />
          <Text style={styles.badgeText}>{statusLabel ?? 'Communication ready'}</Text>
        </View>
        <View style={styles.motif}>
          <Sparkles size={18} color={Colors.secondary} />
        </View>
      </View>

      <Text style={[styles.greeting, compact && styles.greetingCompact]}>{greeting}</Text>
      <Text style={[styles.message, compact && styles.messageCompact]}>{message}</Text>

      {!compact ? (
        <View style={styles.footerRow}>
          <View style={styles.footerChip}>
            <Waves size={14} color={Colors.primary} />
            <Text style={styles.footerChipText}>Voice-ready flow</Text>
          </View>
          <View style={[styles.footerChip, styles.footerChipSecondary]}>
            <Sparkles size={14} color={Colors.secondary} />
            <Text style={[styles.footerChipText, { color: Colors.secondary }]}>Calm assistive UI</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    minHeight: 182,
    justifyContent: 'center',
    ...Shadow.luxe,
    overflow: 'hidden',
  },
  cardCompact: {
    minHeight: 126,
    padding: Spacing.lg,
  },
  ambientGlowPrimary: {
    position: 'absolute',
    top: -36,
    right: -18,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.glowPrimary,
  },
  ambientGlowSecondary: {
    position: 'absolute',
    bottom: -30,
    left: -12,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.glowViolet,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceTintBlue,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    ...Typography.microLabel,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  motif: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: Colors.surfaceTintViolet,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    ...Typography.heroTitle,
    fontSize: 36,
    lineHeight: 40,
    color: Colors.textPrimary,
    fontWeight: '900',
  },
  greetingCompact: {
    fontSize: 28,
    lineHeight: 31,
  },
  message: {
    ...Typography.supportText,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  messageCompact: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
  },
  footerChipSecondary: {
    backgroundColor: Colors.surfaceTintViolet,
  },
  footerChipText: {
    ...Typography.microLabel,
    color: Colors.primary,
    fontSize: 11,
    letterSpacing: 0.4,
  },
});
