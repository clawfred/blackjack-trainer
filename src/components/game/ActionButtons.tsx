/**
 * ActionButtons Component
 * Game action buttons (Hit, Stand, Double, Split) with conditional enabling.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button } from '../ui/Button';
import { colors, spacing } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';

interface ActionButtonsProps {
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onSurrender?: () => void;
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender?: boolean;
  disabled?: boolean;
}

export function ActionButtons({
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  canHit,
  canStand,
  canDouble,
  canSplit,
  canSurrender = false,
  disabled = false,
}: ActionButtonsProps) {
  const haptics = useHaptics();
  
  const createHandler = (action: () => void) => () => {
    haptics.impact('medium');
    action();
  };
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      {/* Primary action row */}
      <View style={styles.primaryRow}>
        <Button
          title="HIT"
          variant="hit"
          size="lg"
          onPress={createHandler(onHit)}
          disabled={disabled || !canHit}
          style={styles.primaryButton}
        />
        <Button
          title="STAND"
          variant="stand"
          size="lg"
          onPress={createHandler(onStand)}
          disabled={disabled || !canStand}
          style={styles.primaryButton}
        />
      </View>
      
      {/* Secondary action row */}
      <View style={styles.secondaryRow}>
        <Button
          title="DOUBLE"
          variant="double"
          size="md"
          onPress={createHandler(onDouble)}
          disabled={disabled || !canDouble}
          style={styles.secondaryButton}
        />
        <Button
          title="SPLIT"
          variant="split"
          size="md"
          onPress={createHandler(onSplit)}
          disabled={disabled || !canSplit}
          style={styles.secondaryButton}
        />
        {canSurrender && onSurrender && (
          <Button
            title="SURRENDER"
            variant="surrender"
            size="md"
            onPress={createHandler(onSurrender)}
            disabled={disabled || !canSurrender}
            style={styles.secondaryButton}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.sm,
  },
  primaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    height: 56,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
  },
});

export default ActionButtons;
