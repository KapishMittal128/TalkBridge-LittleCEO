import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { Colors, Motion, Radius, Spacing, Typography } from '@/constants/theme';
import { GlassPanel } from './GlassPanel';

interface OnboardingStepCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  active?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function OnboardingStepCard({
  title,
  subtitle,
  icon: Icon,
  active = false,
  onPress,
}: OnboardingStepCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(Motion.choreography.pressInScale, Motion.spring.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Motion.spring.bouncy);
      }}
      style={animatedStyle}
    >
      <GlassPanel
        variant="elevated"
        padding={Spacing.xl}
        radius={Radius.card}
        glow={active ? 'cyan' : 'none'}
        borderColor={active ? 'rgba(54,215,255,0.34)' : undefined}
      >
        <View style={styles.row}>
          <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
            <Icon size={22} color={active ? Colors.primary : Colors.textSecondary} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={[styles.trailing, active && styles.trailingActive]}>
            {active ? <Check size={16} color={Colors.primary} /> : <ChevronRight size={16} color={Colors.textMuted} />}
          </View>
        </View>
      </GlassPanel>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(54,215,255,0.12)',
    borderColor: 'rgba(54,215,255,0.28)',
  },
  copy: {
    flex: 1,
  },
  title: {
    ...Typography.cardTitle,
  },
  subtitle: {
    ...Typography.supportText,
    marginTop: Spacing.xs,
  },
  trailing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailingActive: {
    backgroundColor: 'rgba(54,215,255,0.12)',
  },
});
