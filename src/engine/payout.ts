/**
 * Payout Logic Module
 * Handles payout calculations for all game outcomes.
 */

import { Hand, evaluateHand, isBlackjack } from './hand';
import { RulesConfig } from './rules';

export type HandOutcome =
  | 'blackjack'
  | 'win'
  | 'lose'
  | 'push'
  | 'bust'
  | 'surrender'
  | 'dealer_blackjack';

export interface PayoutResult {
  /** Outcome of the hand */
  outcome: HandOutcome;
  /** Net payout (positive = player wins, negative = player loses) */
  payout: number;
  /** Original bet amount */
  originalBet: number;
  /** Detailed explanation */
  description: string;
}

/**
 * Get blackjack payout multiplier from rules
 */
export function getBlackjackMultiplier(rules: RulesConfig): number {
  return rules.blackjackPays === '3:2' ? 1.5 : 1.2;
}

/**
 * Calculate payout for a single hand
 */
export function calculatePayout(
  playerHand: Hand,
  dealerHand: Hand,
  rules: RulesConfig
): PayoutResult {
  const originalBet = playerHand.bet;
  
  // Surrendered hand
  if (playerHand.isSurrendered) {
    return {
      outcome: 'surrender',
      payout: -originalBet / 2,
      originalBet,
      description: 'Surrendered - half bet returned',
    };
  }
  
  // Player busted
  if (playerHand.isBusted) {
    return {
      outcome: 'bust',
      payout: -originalBet,
      originalBet,
      description: 'Player busted',
    };
  }
  
  const playerValue = evaluateHand(playerHand).value;
  const dealerValue = evaluateHand(dealerHand).value;
  const playerBJ = isBlackjack(playerHand);
  const dealerBJ = isBlackjack(dealerHand);
  
  // Both have blackjack - push
  if (playerBJ && dealerBJ) {
    return {
      outcome: 'push',
      payout: 0,
      originalBet,
      description: 'Both blackjack - push',
    };
  }
  
  // Player blackjack
  if (playerBJ) {
    const multiplier = getBlackjackMultiplier(rules);
    return {
      outcome: 'blackjack',
      payout: originalBet * multiplier,
      originalBet,
      description: `Blackjack! Pays ${rules.blackjackPays}`,
    };
  }
  
  // Dealer blackjack
  if (dealerBJ) {
    return {
      outcome: 'dealer_blackjack',
      payout: -originalBet,
      originalBet,
      description: 'Dealer blackjack',
    };
  }
  
  // Dealer busted
  if (dealerValue > 21) {
    return {
      outcome: 'win',
      payout: originalBet,
      originalBet,
      description: 'Dealer busted',
    };
  }
  
  // Compare values
  if (playerValue > dealerValue) {
    return {
      outcome: 'win',
      payout: originalBet,
      originalBet,
      description: `Player ${playerValue} beats dealer ${dealerValue}`,
    };
  }
  
  if (playerValue < dealerValue) {
    return {
      outcome: 'lose',
      payout: -originalBet,
      originalBet,
      description: `Dealer ${dealerValue} beats player ${playerValue}`,
    };
  }
  
  // Push (tie)
  return {
    outcome: 'push',
    payout: 0,
    originalBet,
    description: `Push at ${playerValue}`,
  };
}

/**
 * Calculate total payout for multiple hands (after splits)
 */
export function calculateTotalPayout(
  playerHands: Hand[],
  dealerHand: Hand,
  rules: RulesConfig
): { results: PayoutResult[]; totalPayout: number } {
  const results = playerHands.map(hand => calculatePayout(hand, dealerHand, rules));
  const totalPayout = results.reduce((sum, r) => sum + r.payout, 0);
  
  return { results, totalPayout };
}

/**
 * Calculate insurance payout (if player took insurance)
 * Insurance pays 2:1 if dealer has blackjack
 */
export function calculateInsurancePayout(
  insuranceBet: number,
  dealerHand: Hand
): { payout: number; description: string } {
  if (isBlackjack(dealerHand)) {
    return {
      payout: insuranceBet * 2, // 2:1 payout
      description: 'Insurance wins - dealer blackjack',
    };
  }
  return {
    payout: -insuranceBet,
    description: 'Insurance loses - no dealer blackjack',
  };
}

/**
 * Check if outcome is a win (for stats)
 */
export function isWin(outcome: HandOutcome): boolean {
  return outcome === 'blackjack' || outcome === 'win';
}

/**
 * Check if outcome is a loss (for stats)
 */
export function isLoss(outcome: HandOutcome): boolean {
  return outcome === 'lose' || outcome === 'bust' || outcome === 'dealer_blackjack';
}

/**
 * Check if outcome is a push (for stats)
 */
export function isPush(outcome: HandOutcome): boolean {
  return outcome === 'push';
}

/**
 * Get the effective bet amount considering doubles
 * For doubled hands, the original bet before doubling
 */
export function getOriginalBet(hand: Hand): number {
  return hand.isDoubled ? hand.bet / 2 : hand.bet;
}
