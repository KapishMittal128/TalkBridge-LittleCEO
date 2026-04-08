import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock3, MessageSquareText, Target } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

interface HistoryEventCardProps {
  phrase: string;
  createdAt: string;
  confidence: number;
  label?: string | null;
  onPress?: () => void;
}

export function HistoryEventCard({ phrase, createdAt, confidence, label, onPress }: HistoryEventCardProps) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : null]}>
      <View style={styles.topRow}>
        <View style={styles.metaChip}>
          <Clock3 size={12} color={Colors.textTertiary} />
          <Text style={styles.metaText}>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</Text>
        </View>
        <View style={styles.confidenceChip}>
          <Target size={12} color={Colors.primary} />
          <Text style={styles.confidenceText}>{Math.round(confidence * 100)}% Match</Text>
        </View>
      </View>

      <View style={styles.phraseRow}>
        <View style={styles.iconWrap}>
          <MessageSquareText size={18} color={Colors.primary} />
        </View>
        <View style={styles.copyWrap}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          <Text style={styles.phrase}>{phrase}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    ...Shadow.soft,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...Typography.microLabel,
    color: Colors.textTertiary,
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  confidenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
  },
  confidenceText: {
    ...Typography.microLabel,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  copyWrap: {
    flex: 1,
  },
  label: {
    ...Typography.microLabel,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phrase: {
    ...Typography.cardTitle,
    lineHeight: 24,
    fontSize: 18,
    color: Colors.textPrimary,
  },
});
