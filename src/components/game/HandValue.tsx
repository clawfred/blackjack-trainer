/**
 * HandValue Component
 * Displays the total value of a hand with soft/hard indicator.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface HandValueProps {
  value: number | null;
  isSoft?: boolean;
  isBlackjack?: boolean;
  isBusted?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: {
    fontSize: typography.fontSize.sm,
    padding: spacing.xs,
  },
  md: {
    fontSize: typography.fontSize.lg,
    padding: spacing.sm,
  },
  lg: {
    fontSize: typography.fontSize['2xl'],
    padding: spacing.md,
  },
};

export function HandValue({
  value,
  isSoft = false,
  isBlackjack = false,
  isBusted = false,
  label,
  size = 'md',
}: HandValueProps) {
  const scale = useSharedValue(1);
  const prevValue = React.useRef(value);
  
  // Animate on value change
  if (value !== null && value !== prevValue.current) {
    prevValue.current = value;
    scale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );
  }
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  if (value === null) return null;
  
  // Determine display text
  let displayText = value.toString();
  let displayColor: string = colors.text.primary;
  
  if (isBlackjack) {
    displayText = 'BJ';
    displayColor = colors.feedback.success;
  } else if (isBusted) {
    displayText = 'BUST';
    displayColor = colors.feedback.error;
  } else if (isSoft) {
    displayText = `${value} soft`;
  }
  
  const sizeConfig = sizeStyles[size];
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.valueContainer, { padding: sizeConfig.padding }]}>
        <Text
          style={[
            styles.value,
            {
              fontSize: sizeConfig.fontSize,
              color: displayColor,
            },
          ]}
        >
          {displayText}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueContainer: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    minWidth: 48,
    alignItems: 'center',
  },
  value: {
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
});

export default HandValue;
