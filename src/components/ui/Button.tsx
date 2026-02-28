import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'hit'
  | 'stand'
  | 'double'
  | 'split'
  | 'surrender';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantColors: Record<ButtonVariant, { bg: string; text: string; pressed: string }> = {
  primary: {
    bg: colors.accent.primary,
    text: colors.text.inverse,
    pressed: '#3DBDB5',
  },
  secondary: {
    bg: colors.background.elevated,
    text: colors.text.primary,
    pressed: '#2F2F32',
  },
  success: {
    bg: colors.feedback.success,
    text: colors.text.inverse,
    pressed: '#1CA84E',
  },
  warning: {
    bg: colors.feedback.warning,
    text: colors.text.inverse,
    pressed: '#D49B07',
  },
  danger: {
    bg: colors.accent.danger,
    text: colors.text.primary,
    pressed: '#E64545',
  },
  hit: {
    bg: colors.actions.hit,
    text: colors.text.inverse,
    pressed: '#3BC970',
  },
  stand: {
    bg: colors.actions.stand,
    text: colors.text.inverse,
    pressed: '#E6B814',
  },
  double: {
    bg: colors.actions.double,
    text: colors.text.inverse,
    pressed: '#4E94E6',
  },
  split: {
    bg: colors.actions.split,
    text: colors.text.inverse,
    pressed: '#E05BA3',
  },
  surrender: {
    bg: colors.actions.surrender,
    text: colors.text.inverse,
    pressed: '#9478E6',
  },
};

const sizeStyles: Record<
  ButtonSize,
  { paddingH: number; paddingV: number; fontSize: number; radius: number }
> = {
  sm: {
    paddingH: spacing.sm,
    paddingV: spacing.xs,
    fontSize: typography.fontSize.sm,
    radius: borderRadius.sm,
  },
  md: {
    paddingH: spacing.md,
    paddingV: spacing.sm,
    fontSize: typography.fontSize.base,
    radius: borderRadius.md,
  },
  lg: {
    paddingH: spacing.lg,
    paddingV: spacing.md,
    fontSize: typography.fontSize.lg,
    radius: borderRadius.lg,
  },
};

export function Button({
  title,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const variantStyle = variantColors[variant];
  const sizeStyle = sizeStyles[size];

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonContent = title || children;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        animatedStyle,
        {
          backgroundColor: variantStyle.bg,
          paddingHorizontal: sizeStyle.paddingH,
          paddingVertical: sizeStyle.paddingV,
          borderRadius: sizeStyle.radius,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          ...shadows.sm,
        },
        style,
      ]}
    >
      {typeof buttonContent === 'string' ? (
        <Text
          style={[
            styles.text,
            {
              color: variantStyle.text,
              fontSize: sizeStyle.fontSize,
              fontWeight: typography.fontWeight.semibold,
            },
            textStyle,
          ]}
        >
          {buttonContent}
        </Text>
      ) : (
        buttonContent
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
});

export default Button;
