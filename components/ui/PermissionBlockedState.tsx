import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MicOff } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { GlassPanel } from './GlassPanel';

interface PermissionBlockedStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PermissionBlockedState({
  title = 'Microphone access is blocked',
  message,
  actionLabel,
  onAction,
}: PermissionBlockedStateProps) {
  return (
    <GlassPanel variant="default" padding={Spacing.xl} radius={Radius.card} borderColor="rgba(255,138,122,0.28)">
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MicOff size={18} color={Colors.warmth} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {actionLabel && onAction ? (
            <Pressable style={styles.button} onPress={onAction}>
              <Text style={styles.buttonText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  button: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.statusDangerBg,
    borderWidth: 1,
    borderColor: 'rgba(255,138,122,0.24)',
  },
  buttonText: {
    ...Typography.microLabel,
    color: Colors.warmth,
    letterSpacing: 0.3,
  },
});
