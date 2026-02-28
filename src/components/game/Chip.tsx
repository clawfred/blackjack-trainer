/**
 * Chip Component
 * Renders a casino chip with appropriate color based on denomination.
 */

import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, shadows } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Chip colors by denomination (per PRD Section 8.7)
const chipColors: Record<number, { bg: string; border: string; text: string }> = {
  1: {
    bg: '#FFFFFF',
    border: '#E0E0E0',
    text: colors.text.inverse,
  },
  5: {
    bg: '#E63946',
    border: '#C4303B',
    text: colors.text.primary,
  },
  25: {
    bg: '#22C55E',
    border: '#1A9E4A',
    text: colors.text.primary,
  },
  100: {
    bg: '#1D1D1F',
    border: '#3D3D3F',
    text: colors.text.primary,
  },
  500: {
    bg: '#7C3AED',
    border: '#6429C7',
    text: colors.text.primary,
  },
};

interface ChipProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  style?: ViewStyle;
}

const sizeConfig = {
  sm: { diameter: 36, fontSize: typography.fontSize.sm },
  md: { diameter: 48, fontSize: typography.fontSize.base },
  lg: { diameter: 64, fontSize: typography.fontSize.lg },
};

export function Chip({
  value,
  size = 'md',
  onPress,
  disabled = false,
  selected = false,
  style,
}: ChipProps) {
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  
  const chipStyle = chipColors[value] || chipColors[5]; // Default to red if unknown
  const { diameter, fontSize } = sizeConfig[size];
  
  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };
  
  const handlePress = () => {
    if (onPress && !disabled) {
      haptics.impact('light');
      onPress();
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  // Format value display (1000 -> 1K)
  const displayValue = value >= 1000 ? `${value / 1000}K` : value.toString();
  
  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        animatedStyle,
        styles.chip,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: chipStyle.bg,
          borderColor: selected ? colors.accent.primary : chipStyle.border,
          borderWidth: selected ? 3 : 2,
          opacity: disabled ? 0.5 : 1,
        },
        shadows.sm,
        style,
      ]}
    >
      {/* Inner ring decoration */}
      <Animated.View
        style={[
          styles.innerRing,
          {
            width: diameter - 8,
            height: diameter - 8,
            borderRadius: (diameter - 8) / 2,
            borderColor: chipStyle.border,
          },
        ]}
      />
      <Text
        style={[
          styles.value,
          {
            fontSize,
            color: chipStyle.text,
          },
        ]}
      >
        {displayValue}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  value: {
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
});

export default Chip;
