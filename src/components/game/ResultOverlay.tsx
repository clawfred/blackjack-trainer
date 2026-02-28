/**
 * ResultOverlay Component
 * Shows the result of the hand with payout information.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { RoundResult } from '../../engine/game';

interface ResultOverlayProps {
  result: RoundResult;
  onNewHand: () => void;
}

export function ResultOverlay({ result, onNewHand }: ResultOverlayProps) {
  const haptics = useHaptics();
  const buttonScale = useSharedValue(1);
  
  // Determine overall outcome
  const totalPayout = result.totalPayout;
  const isWin = totalPayout > 0;
  const isLoss = totalPayout < 0;
  
  // Outcome text and color
  let outcomeText = 'PUSH';
  let outcomeColor: string = colors.text.secondary;
  
  if (isWin) {
    outcomeText = 'WIN!';
    outcomeColor = colors.feedback.success;
    haptics.notification('success');
  } else if (isLoss) {
    outcomeText = 'LOSS';
    outcomeColor = colors.feedback.error;
    haptics.notification('error');
  } else {
    haptics.impact('light');
  }
  
  // Check for special outcomes
  const hasBlackjack = result.playerOutcomes.some(o => o.outcome === 'blackjack');
  const dealerBusted = result.dealerBusted;
  
  if (hasBlackjack) {
    outcomeText = 'BLACKJACK!';
  }
  
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));
  
  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };
  
  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };
  
  const formatPayout = (amount: number) => {
    if (amount >= 0) return `+$${amount}`;
    return `-$${Math.abs(amount)}`;
  };
  
  return (
    <Animated.View 
      style={styles.overlay}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
    >
      <Animated.View 
        style={styles.card}
        entering={SlideInDown.springify().damping(18)}
      >
        {/* Outcome */}
        <Text style={[styles.outcomeText, { color: outcomeColor }]}>
          {outcomeText}
        </Text>
        
        {/* Payout */}
        <Text style={[styles.payoutText, { color: outcomeColor }]}>
          {formatPayout(totalPayout)}
        </Text>
        
        {/* Details */}
        <View style={styles.detailsContainer}>
          {dealerBusted && (
            <Text style={styles.detailText}>Dealer busted with {result.dealerFinalValue}</Text>
          )}
          {!dealerBusted && !hasBlackjack && (
            <Text style={styles.detailText}>Dealer: {result.dealerFinalValue}</Text>
          )}
        </View>
        
        {/* Hand breakdown for splits */}
        {result.playerOutcomes.length > 1 && (
          <View style={styles.handsBreakdown}>
            {result.playerOutcomes.map((outcome, i) => (
              <View key={i} style={styles.handResult}>
                <Text style={styles.handLabel}>Hand {i + 1}:</Text>
                <Text style={[
                  styles.handOutcome,
                  { 
                    color: outcome.payout > 0 
                      ? colors.feedback.success 
                      : outcome.payout < 0 
                        ? colors.feedback.error 
                        : colors.text.secondary 
                  }
                ]}>
                  {outcome.outcome.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* New Hand Button */}
        <Animated.View style={buttonStyle}>
          <Pressable
            style={styles.newHandButton}
            onPress={onNewHand}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Text style={styles.newHandButtonText}>NEW HAND</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 13, 15, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 280,
    ...shadows.lg,
  },
  outcomeText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  payoutText: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  detailsContainer: {
    marginBottom: spacing.lg,
  },
  detailText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  handsBreakdown: {
    width: '100%',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  handResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  handLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  handOutcome: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  newHandButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  newHandButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
});

export default ResultOverlay;
