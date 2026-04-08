import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AudioLines, Sparkles } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { GlassPanel } from './GlassPanel';
import { VoiceWavePlaceholder } from './VoiceWavePlaceholder';

interface RecordingStateOverlayProps {
  title: string;
  subtitle: string;
  active?: boolean;
}

export function RecordingStateOverlay({
  title,
  subtitle,
  active = false,
}: RecordingStateOverlayProps) {
  return (
    <GlassPanel variant="ghost" padding={Spacing.lg} radius={Radius.card} borderColor={active ? 'rgba(54,215,255,0.24)' : undefined}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
          {active ? <AudioLines size={18} color={Colors.primary} /> : <Sparkles size={18} color={Colors.secondary} />}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.waveWrap}>
            <VoiceWavePlaceholder active={active} barCount={10} />
          </View>
        </View>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(167,139,250,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(54,215,255,0.12)',
    borderColor: 'rgba(54,215,255,0.22)',
  },
  copy: {
    flex: 1,
  },
  title: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  subtitle: {
    ...Typography.supportText,
    marginTop: Spacing.xs,
  },
  waveWrap: {
    marginTop: Spacing.md,
    alignItems: 'flex-start',
  },
});
