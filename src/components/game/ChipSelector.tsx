/**
 * ChipSelector Component
 * Chip selection UI for placing bets.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Chip } from './Chip';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';

const CHIP_DENOMINATIONS = [5, 25, 100, 500];

interface ChipSelectorProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  onAddBet: (amount: number) => void;
  currentBet: number;
  bankroll: number;
  onClearBet: () => void;
  onDeal: () => void;
}

export function ChipSelector({
  selectedChip,
  onSelectChip,
  onAddBet,
  currentBet,
  bankroll,
  onClearBet,
  onDeal,
}: ChipSelectorProps) {
  const haptics = useHaptics();
  
  const handleChipPress = (value: number) => {
    if (value <= bankroll - currentBet) {
      onAddBet(value);
    }
  };
  
  const canDeal = currentBet > 0;
  const dealButtonScale = useSharedValue(1);
  
  const dealButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dealButtonScale.value }],
  }));
  
  const handleDealPressIn = () => {
    dealButtonScale.value = withSpring(0.95);
  };
  
  const handleDealPressOut = () => {
    dealButtonScale.value = withSpring(1);
  };
  
  const handleDeal = () => {
    if (canDeal) {
      haptics.impact('medium');
      onDeal();
    }
  };
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      {/* Current bet display */}
      <View style={styles.betDisplay}>
        <Text style={styles.betLabel}>BET</Text>
        <Text style={styles.betAmount}>${currentBet}</Text>
        <Text style={styles.bankrollLabel}>Bank: ${bankroll}</Text>
      </View>
      
      {/* Chip row */}
      <View style={styles.chipRow}>
        {CHIP_DENOMINATIONS.map((value) => {
          const isDisabled = value > bankroll - currentBet;
          return (
            <Chip
              key={value}
              value={value}
              size="lg"
              selected={selectedChip === value}
              disabled={isDisabled}
              onPress={() => {
                onSelectChip(value);
                handleChipPress(value);
              }}
            />
          );
        })}
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.clearButton, currentBet === 0 && styles.disabledButton]}
          onPress={onClearBet}
          disabled={currentBet === 0}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </Pressable>
        
        <Animated.View style={dealButtonStyle}>
          <Pressable
            style={[styles.dealButton, !canDeal && styles.disabledButton]}
            onPress={handleDeal}
            onPressIn={handleDealPressIn}
            onPressOut={handleDealPressOut}
            disabled={!canDeal}
          >
            <Text style={styles.dealButtonText}>DEAL</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  betDisplay: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  betLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  betAmount: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginVertical: spacing.xs,
  },
  bankrollLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  clearButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
  },
  clearButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  dealButton: {
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.lg,
  },
  dealButtonText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ChipSelector;
