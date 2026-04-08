import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

interface EmptyStatePanelProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export function EmptyStatePanel({
  title,
  message,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}: EmptyStatePanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.iconWrap}>
        <Icon size={28} color={Colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    backgroundColor: Colors.background,
    borderRadius: Radius.panel,
    borderWidth: 1,
    borderColor: Colors.strokeMuted,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.sectionTitle,
    fontSize: 22,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  message: {
    ...Typography.supportText,
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 280,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    marginTop: Spacing.xl,
    borderRadius: Radius.pill,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
  },
  buttonText: {
    ...Typography.microLabel,
    color: Colors.surface,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
