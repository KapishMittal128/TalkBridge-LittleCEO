import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AlertTriangle, Sparkles } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { GlassPanel } from './GlassPanel';

interface NoMatchStateCardProps {
  title?: string;
  message: string;
}

export function NoMatchStateCard({
  title = 'No confident match yet',
  message,
}: NoMatchStateCardProps) {
  return (
    <GlassPanel variant="default" padding={Spacing.xl} radius={Radius.card} glow="coral" borderColor="rgba(255,138,122,0.3)">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id="recognitionWarningCard" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,138,122,0.16)" />
            <Stop offset="100%" stopColor="rgba(255,197,110,0.16)" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#recognitionWarningCard)" />
      </Svg>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <AlertTriangle size={18} color={Colors.warmth} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <Sparkles size={18} color={Colors.warning} />
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Colors.statusDangerBg,
    borderWidth: 1,
    borderColor: 'rgba(255,138,122,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    ...Typography.cardTitle,
    fontSize: 17,
  },
  message: {
    ...Typography.supportText,
    marginTop: Spacing.xs,
  },
});
