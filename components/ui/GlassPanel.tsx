import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Shadow } from '@/constants/theme';

export type GlassPanelVariant = 'default' | 'elevated' | 'ghost';
export type GlowTone = 'cyan' | 'violet' | 'mint' | 'coral' | 'amber' | 'none';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
  variant?: GlassPanelVariant;
  glow?: GlowTone;
  borderColor?: string;
}

const VARIANTS: Record<GlassPanelVariant, { backgroundColor: string; borderColor: string; intensity: number }> = {
  default: {
    backgroundColor: Colors.surfaceGlassStrong,
    borderColor: Colors.glassBorder,
    intensity: 24,
  },
  elevated: {
    backgroundColor: Colors.surfaceGlassStrong,
    borderColor: Colors.glassBorder,
    intensity: 32,
  },
  ghost: {
    backgroundColor: Colors.surfaceGlassSoft,
    borderColor: Colors.glassBorderSubtle,
    intensity: 16,
  },
};

const glowMap = {
  cyan: { shadowColor: Colors.primary },
  violet: { shadowColor: Colors.secondary },
  mint: { shadowColor: Colors.accent },
  coral: { shadowColor: Colors.warmth },
  amber: { shadowColor: Colors.warning },
  none: {},
} as const;

export function GlassPanel({
  children,
  style,
  contentStyle,
  padding = 20,
  radius = Radius.card,
  variant = 'default',
  glow = 'none',
  borderColor,
}: GlassPanelProps) {
  const variantStyle = VARIANTS[variant];

  return (
    <View
      style={[
        styles.outer,
        { borderRadius: radius },
        glow !== 'none' && styles.glow,
        glow !== 'none' && glowMap[glow],
        style,
      ]}
    >
      <BlurView
        intensity={variantStyle.intensity}
        tint="light"
        style={[
          styles.blur,
          {
            borderRadius: radius,
            padding,
            backgroundColor: variantStyle.backgroundColor,
            borderColor: borderColor ?? variantStyle.borderColor,
          },
          contentStyle,
        ]}
      >
        <View style={styles.topLight} />
        <View style={styles.innerTint} />
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    ...Shadow.glass,
  },
  glow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  blur: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  topLight: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  innerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
});
