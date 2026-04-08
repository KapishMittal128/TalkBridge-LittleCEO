import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ArrowUpRight } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, Motion, Radius, Typography } from '@/constants/theme';
import { GlassPanel } from './GlassPanel';

interface QuickActionPillProps {
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: 'cyan' | 'violet' | 'mint' | 'coral';
  onPress: () => void;
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QuickActionPill({
  label,
  subtitle,
  icon: Icon,
  tone = 'cyan',
  onPress,
  compact = false,
}: QuickActionPillProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const toneColor =
    tone === 'violet'
      ? Colors.secondary
      : tone === 'mint'
        ? Colors.accent
        : tone === 'coral'
          ? Colors.warmth
          : Colors.primary;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(Motion.choreography.pressDeepScale, Motion.spring.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Motion.spring.bouncy);
      }}
      style={[animatedStyle, styles.wrap]}
    >
      <GlassPanel
        variant="elevated"
        padding={compact ? 14 : 18}
        radius={Radius.lg}
        style={[styles.panel, compact && styles.panelCompact]}
        borderColor={`${toneColor}24`}
      >
        <View style={[styles.topRow]}>
          <View style={[styles.iconWrap, compact && styles.iconWrapCompact, { backgroundColor: `${toneColor}14`, borderColor: `${toneColor}26` }]}>
            <Icon size={compact ? 18 : 20} color={toneColor} />
          </View>
          <View style={[styles.statePill, compact && styles.statePillCompact, { backgroundColor: `${toneColor}12` }]}>
            <Text style={[styles.stateText, { color: toneColor }]}>Quick</Text>
          </View>
        </View>
        <View style={[styles.copy, compact && styles.copyCompact]}>
          <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
          {subtitle ? <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</Text> : null}
        </View>
        {!compact ? (
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: toneColor }]}>Open phrase</Text>
            <ArrowUpRight size={14} color={toneColor} />
          </View>
        ) : null}
      </GlassPanel>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  panel: {
    minHeight: 148,
    justifyContent: 'space-between',
  },
  panelCompact: {
    minHeight: 104,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapCompact: {
    width: 38,
    height: 38,
    borderRadius: 14,
  },
  statePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  statePillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stateText: {
    ...Typography.microLabel,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  copy: {
    marginTop: 18,
  },
  copyCompact: {
    marginTop: 10,
  },
  label: {
    ...Typography.cardTitle,
    fontSize: 18,
  },
  labelCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  subtitle: {
    ...Typography.supportText,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  subtitleCompact: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.strokeMuted,
  },
  footerText: {
    ...Typography.microLabel,
    fontSize: 11,
    letterSpacing: 0.4,
  },
});
