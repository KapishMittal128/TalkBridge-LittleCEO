import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Colors, Motion, Radius, Spacing, Typography } from '@/constants/theme';
import { GlassPanel } from './GlassPanel';

interface CategoryGradientCardProps {
  title: string;
  subtitle: string;
  countLabel: string;
  icon: LucideIcon;
  color: string;
  gradient: readonly string[];
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CategoryGradientCard({
  title,
  subtitle,
  countLabel,
  icon: Icon,
  color,
  gradient,
  onPress,
}: CategoryGradientCardProps) {
  const scale = useSharedValue(1);
  const gradientId = `category-${title.toLowerCase().replace(/\s+/g, '-')}`;

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
      <GlassPanel variant="elevated" padding={Spacing.xl} radius={Radius.card} borderColor={`${color}40`} style={styles.panel}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradient[0]} />
              <Stop offset="100%" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>

        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: `${color}15`, borderColor: `${color}36` }]}>
            <Icon size={22} color={color} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.count, { color }]}>{countLabel}</Text>
            <ChevronRight size={18} color={Colors.textMuted} />
          </View>
        </View>
      </GlassPanel>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    minHeight: 126,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  meta: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  count: {
    ...Typography.microLabel,
    letterSpacing: 0.5,
  },
});
