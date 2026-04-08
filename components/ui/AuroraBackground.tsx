import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Colors } from '@/constants/theme';

export function AuroraBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <RadialGradient id="cyanField" cx="30%" cy="22%" r="42%">
              <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.24" />
              <Stop offset="58%" stopColor={Colors.primary} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={Colors.primary} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="violetField" cx="74%" cy="18%" r="40%">
              <Stop offset="0%" stopColor={Colors.secondary} stopOpacity="0.22" />
              <Stop offset="62%" stopColor={Colors.secondary} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={Colors.secondary} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="mintField" cx="56%" cy="72%" r="38%">
              <Stop offset="0%" stopColor={Colors.accent} stopOpacity="0.16" />
              <Stop offset="60%" stopColor={Colors.accent} stopOpacity="0.05" />
              <Stop offset="100%" stopColor={Colors.accent} stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="depthVeil" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={Colors.background} stopOpacity="0.18" />
              <Stop offset="45%" stopColor={Colors.backgroundSecondary} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={Colors.background} stopOpacity="0.9" />
            </LinearGradient>
          </Defs>

          <Rect width="100%" height="100%" fill={Colors.background} />
          <Circle cx="28%" cy="20%" r="220" fill="url(#cyanField)" />
          <Circle cx="76%" cy="16%" r="210" fill="url(#violetField)" />
          <Circle cx="56%" cy="74%" r="200" fill="url(#mintField)" />
          <Rect width="100%" height="100%" fill="url(#depthVeil)" />
        </Svg>

        {Platform.OS !== 'android' ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={styles.androidWash} />
        )}

        <View style={styles.noise} pointerEvents="none" />
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  androidWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,17,31,0.42)',
  },
  noise: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
});
