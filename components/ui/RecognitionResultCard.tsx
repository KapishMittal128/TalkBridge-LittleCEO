import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Volume2 } from 'lucide-react-native';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

interface RecognitionResultCardProps {
  phrase: string;
  confidence?: number;
  label?: string;
}

export function RecognitionResultCard({ phrase, confidence, label }: RecognitionResultCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.glow} />
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <CheckCircle2 size={24} color={Colors.success} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{label ?? 'Recognized phrase'}</Text>
          <Text style={styles.phrase}>{phrase}</Text>
        </View>
        <View style={styles.voiceWrap}>
          <View style={styles.volumeIcon}>
            <Volume2 size={20} color={Colors.primary} />
          </View>
          {confidence != null ? <Text style={styles.confidence}>{Math.round(confidence * 100)}%</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    ...Shadow.luxe,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    right: -30,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.glowMint,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.surfaceTintMint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.14)',
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    ...Typography.microLabel,
    color: Colors.success,
    letterSpacing: 0.8,
    marginBottom: 6,
    fontWeight: '700',
  },
  phrase: {
    ...Typography.cardTitle,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  voiceWrap: {
    alignItems: 'center',
    gap: 8,
  },
  volumeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceTintBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidence: {
    ...Typography.microLabel,
    color: Colors.textTertiary,
    letterSpacing: 0.2,
    fontSize: 12,
  },
});
