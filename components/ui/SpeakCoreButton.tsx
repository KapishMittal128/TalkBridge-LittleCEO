import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Mic, Sparkles, Waves } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Motion, Shadow, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export type SpeakCoreState = 'idle' | 'listening' | 'processing' | 'recognized' | 'no-match';

interface SpeakCoreButtonProps {
  onPress: () => void;
  state: SpeakCoreState;
  size?: number;
  liveStatus?: string;
  liveStatusTone?: 'default' | 'info' | 'success' | 'warning';
  disabled?: boolean;
}

function PulseRing({
  delay = 0,
  active,
  size = 160,
}: {
  delay?: number;
  active: boolean;
  size?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = withTiming(0, { duration: 180 });
      return;
    }

    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2500, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [active, delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 2]) }],
    opacity: interpolate(progress.value, [0, 1], [0.4, 0]),
  }));

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function SpeakCoreButton({
  onPress,
  state,
  size = 160,
  liveStatus,
  liveStatusTone = 'default',
  disabled = false,
}: SpeakCoreButtonProps) {
  const { profile } = useAuth();
  const pressScale = useSharedValue(1);
  const statusPulse = useSharedValue(1);
  const iconSize = Math.max(32, Math.round(size * 0.27));
  const hapticFeedbackEnabled = profile?.haptic_feedback_enabled !== false;

  const coreStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
    };
  });

  const iconColor =
    state === 'recognized'
      ? Colors.success
      : state === 'no-match'
        ? Colors.emergency
        : Colors.primary;

  const statusLabel =
    state === 'idle'
      ? 'Tap to speak'
      : state === 'listening'
        ? 'Listening...'
        : state === 'processing'
          ? 'Processing...'
          : state === 'recognized'
            ? 'Success'
            : 'Try again';

  const liveStatusStyle =
    liveStatusTone === 'success'
      ? styles.liveStatusSuccess
      : liveStatusTone === 'warning'
        ? styles.liveStatusWarning
        : liveStatusTone === 'info'
          ? styles.liveStatusInfo
          : styles.liveStatusDefault;

  useEffect(() => {
    if (state === 'listening' || state === 'processing') {
      statusPulse.value = withRepeat(withTiming(1.12, { duration: 800 }), -1, true);
    } else {
      statusPulse.value = withSpring(1, Motion.spring.settle);
    }
  }, [state, statusPulse]);

  const liveStatusDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statusPulse.value }],
    opacity: interpolate(statusPulse.value, [1, 1.12], [0.9, 1]),
  }));

  return (
    <View style={styles.container}>
      {state === 'listening' || state === 'processing' ? (
        <>
          <PulseRing active delay={0} size={size} />
          <PulseRing active delay={800} size={size} />
          <PulseRing active delay={1600} size={size} />
        </>
      ) : null}

      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          if (disabled) return;
          pressScale.value = withSpring(0.92, Motion.spring.snappy);
          if (hapticFeedbackEnabled) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }}
        onPressOut={() => {
          if (disabled) return;
          pressScale.value = withSpring(1, Motion.spring.bouncy);
        }}
        style={[styles.pressable, disabled && styles.pressableDisabled]}
      >
        <Animated.View
          style={[
            styles.core,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            coreStyle,
          ]}
        >
          {state === 'processing' ? (
            <Sparkles size={iconSize} color={iconColor} />
          ) : state === 'listening' ? (
            <Waves size={iconSize} color={iconColor} />
          ) : (
            <Mic size={iconSize} color={iconColor} />
          )}
        </Animated.View>
      </Pressable>

      <Text style={styles.statusLabel}>{statusLabel}</Text>
      {liveStatus ? (
        <Animated.View entering={FadeInUp.duration(180)} key={liveStatus} style={[styles.liveStatusChip, liveStatusStyle]}>
          <Animated.View
            style={[
              styles.liveStatusDot,
              liveStatusTone === 'success'
                ? styles.liveStatusDotSuccess
                : liveStatusTone === 'warning'
                  ? styles.liveStatusDotWarning
                  : liveStatusTone === 'info'
                    ? styles.liveStatusDotInfo
                    : styles.liveStatusDotDefault,
              liveStatusDotStyle,
            ]}
          />
          <Text style={styles.liveStatusText}>{liveStatus}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    zIndex: 10,
  },
  pressableDisabled: {
    opacity: 0.58,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  core: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.luxe,
  },
  statusLabel: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  liveStatusChip: {
    marginTop: Spacing.sm,
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  liveStatusDefault: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.strokeMuted,
  },
  liveStatusInfo: {
    backgroundColor: Colors.statusInfoBg,
    borderColor: 'rgba(37,99,235,0.12)',
  },
  liveStatusSuccess: {
    backgroundColor: Colors.statusPositiveBg,
    borderColor: 'rgba(16,185,129,0.14)',
  },
  liveStatusWarning: {
    backgroundColor: Colors.statusWarningBg,
    borderColor: 'rgba(245,158,11,0.16)',
  },
  liveStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveStatusDotDefault: {
    backgroundColor: Colors.textTertiary,
  },
  liveStatusDotInfo: {
    backgroundColor: Colors.primary,
  },
  liveStatusDotSuccess: {
    backgroundColor: Colors.success,
  },
  liveStatusDotWarning: {
    backgroundColor: Colors.warning,
  },
  liveStatusText: {
    ...Typography.supportText,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
