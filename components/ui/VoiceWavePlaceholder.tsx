import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Radius } from '@/constants/theme';

function WaveBar({ index, active }: { index: number; active: boolean }) {
  const height = useSharedValue(8);

  useEffect(() => {
    if (!active) {
      height.value = withTiming(8, { duration: 220 });
      return;
    }

    height.value = withDelay(
      index * 90,
      withRepeat(
        withSequence(
          withTiming(30 + (index % 3) * 10, { duration: 320 }),
          withTiming(10 + (index % 2) * 6, { duration: 380 }),
        ),
        -1,
        true,
      ),
    );
  }, [active, height, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
}

export function VoiceWavePlaceholder({
  active = true,
  barCount = 12,
}: {
  active?: boolean;
  barCount?: number;
}) {
  return (
    <View style={styles.row}>
      {Array.from({ length: barCount }).map((_, index) => (
        <WaveBar key={index} index={index} active={active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 42,
  },
  bar: {
    width: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    opacity: 0.85,
  },
});
