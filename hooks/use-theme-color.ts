/**
 * useThemeColor — TalkBridge Edition
 *
 * TalkBridge is a dark-first app. This hook is simplified to always return
 * the TalkBridge dark theme token.
 *
 * If a prop value is provided, it overrides the theme color directly.
 */

import { Colors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors,
) {
  // TalkBridge is dark-first — always use dark token
  const colorFromProps = props.dark ?? props.light;

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[colorName] as string;
}
