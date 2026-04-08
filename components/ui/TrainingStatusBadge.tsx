import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Heart, Sparkles, TriangleAlert } from 'lucide-react-native';
import { Colors, Radius, Typography } from '@/constants/theme';

type TrainingStatus = 'draft' | 'needs_more_samples' | 'ready';

interface TrainingStatusBadgeProps {
  status: TrainingStatus;
  sampleCount?: number;
  favorite?: boolean;
  emergency?: boolean;
}

export function TrainingStatusBadge({
  status,
  sampleCount = 0,
  favorite = false,
  emergency = false,
}: TrainingStatusBadgeProps) {
  const config =
    status === 'ready'
      ? { label: 'Ready', color: Colors.accent, bg: Colors.statusPositiveBg, icon: CheckCircle2 }
      : status === 'needs_more_samples'
        ? { label: `${sampleCount}/3 samples`, color: Colors.warning, bg: Colors.statusWarningBg, icon: Sparkles }
        : { label: 'Draft', color: Colors.textMuted, bg: Colors.overlayTint, icon: TriangleAlert };

  const Icon = config.icon;

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: config.bg, borderColor: `${config.color}30` }]}>
        <Icon size={12} color={config.color} />
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      </View>

      {favorite ? (
        <View style={[styles.mini, { backgroundColor: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.26)' }]}>
          <Heart size={11} color={Colors.secondary} fill={Colors.secondary} />
        </View>
      ) : null}

      {emergency ? (
        <View style={[styles.mini, { backgroundColor: Colors.statusDangerBg, borderColor: `${Colors.warmth}26` }]}>
          <TriangleAlert size={11} color={Colors.warmth} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    ...Typography.microLabel,
    letterSpacing: 0.4,
  },
  mini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
