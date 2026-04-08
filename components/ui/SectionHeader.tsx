import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  style?: ViewStyle;
  trailing?: React.ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = false,
  style,
  trailing,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, centered && styles.centered, style]}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={[styles.eyebrow, centered && styles.alignCenter]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, centered && styles.alignCenter]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, centered && styles.alignCenter]}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
  },
  eyebrow: {
    ...Typography.microLabel,
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
    fontSize: 26,
    lineHeight: 31,
  },
  subtitle: {
    ...Typography.supportText,
    marginTop: 8,
    color: Colors.textSecondary,
    maxWidth: 320,
  },
  trailing: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  alignCenter: {
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});
