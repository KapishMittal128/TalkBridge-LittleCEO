import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Mic, RefreshCcw, Star } from 'lucide-react-native';
import { Colors, Motion, Radius, Spacing, Typography, Shadow } from '@/constants/theme';
import { TrainingStatusBadge } from './TrainingStatusBadge';

interface SoundCardTileProps {
  label: string;
  phrase: string;
  sampleCount: number;
  status: 'draft' | 'needs_more_samples' | 'ready';
  favorite?: boolean;
  emergency?: boolean;
  accentColor: string;
  onPress: () => void;
  onLongPress?: () => void;
  onTrain: () => void;
  onFavorite: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STATUS_CONFIG = {
  draft: { label: 'Train now', color: Colors.statusDraft, bg: Colors.statusDraftBg },
  needs_more_samples: { label: 'Keep training', color: Colors.statusTrain, bg: Colors.statusInfoBg },
  ready: { label: 'Recalibrate', color: Colors.statusReady, bg: Colors.statusPositiveBg },
} as const;

export function SoundCardTile({
  label,
  phrase,
  sampleCount,
  status,
  accentColor,
  onPress,
  onLongPress,
  onTrain,
  onFavorite,
  favorite,
  emergency,
}: SoundCardTileProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const statusCfg = STATUS_CONFIG[status];
  const needsTraining = status !== 'ready';

  function handleFavoritePress(event: GestureResponderEvent) {
    event.stopPropagation();
    onFavorite();
  }

  function handleActionPress(event: GestureResponderEvent) {
    event.stopPropagation();
    onTrain();
  }

  return (
    <AnimatedPressable
      onPress={needsTraining ? onTrain : onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, Motion.spring.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Motion.spring.bouncy);
      }}
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.header}>
        <TrainingStatusBadge
          status={status}
          sampleCount={sampleCount}
          favorite={favorite}
          emergency={emergency}
        />
        <Pressable onPress={handleFavoritePress} style={styles.favoriteBtn} hitSlop={8}>
          <Star size={16} color={favorite ? Colors.accent : Colors.textMuted} fill={favorite ? Colors.accent : 'transparent'} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.phrase} numberOfLines={2}>{phrase}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerCopy}>
          <Text style={styles.calibrationText}>
            {needsTraining ? `${sampleCount}/3 calibrations saved` : `${sampleCount} calibrations saved`}
          </Text>
          <Text style={[styles.actionText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
        <Pressable
          onPress={handleActionPress}
          style={[styles.playBtn, { backgroundColor: `${accentColor}12`, borderColor: `${accentColor}25` }]}
          hitSlop={8}
        >
          {needsTraining ? (
            <>
              <Mic size={14} color={accentColor} />
              <Text style={[styles.playBtnText, { color: accentColor }]}>Train</Text>
            </>
          ) : (
            <>
              <RefreshCcw size={12} color={accentColor} />
              <Text style={[styles.playBtnText, { color: accentColor }]}>Recalibrate</Text>
            </>
          )}
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    ...Shadow.luxe,
    minHeight: 182,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  content: {
    marginVertical: Spacing.sm,
    flex: 1,
    justifyContent: 'flex-start',
  },
  label: {
    ...Typography.cardTitle,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  phrase: {
    ...Typography.supportText,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  footerCopy: {
    flex: 1,
  },
  calibrationText: {
    ...Typography.microLabel,
    color: Colors.textTertiary,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 12,
  },
  actionText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
  },
  favoriteBtn: {
    padding: 4,
  },
  playBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
  },
  playBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
