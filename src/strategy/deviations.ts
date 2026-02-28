/**
 * Card Counting Strategy Deviations
 * 
 * Implements the Illustrious 18 and Fab 4 surrender deviations.
 * These are index plays where the true count changes the optimal decision.
 */

import { Card } from '../types';
import { Hand, evaluateHand, isPair } from '../engine/hand';
import { RulesConfig } from '../engine/rules';
import { Action, getDealerUpcardValue, getOptimalAction, StrategyResult } from './basicStrategy';

// ============================================================================
// Types
// ============================================================================

/**
 * A deviation from basic strategy based on the true count
 */
export interface Deviation {
  /** Unique identifier for the deviation */
  id: string;
  /** Human-readable name */
  name: string;
  /** Player's hand total or description */
  playerHand: string;
  /** Dealer's upcard (2-11 where 11=Ace) */
  dealerUpcard: number;
  /** Basic strategy action (without counting) */
  basicAction: Action;
  /** Deviation action (when count condition is met) */
  deviationAction: Action;
  /** True count index at which to deviate */
  index: number;
  /** Comparison: 'gte' = deviate when TC >= index, 'lte' = deviate when TC <= index */
  comparison: 'gte' | 'lte';
  /** Rank in terms of EV impact (1 = most valuable) */
  rank: number;
  /** Whether this is a betting deviation (like insurance) */
  isBettingDeviation: boolean;
}

/**
 * Result of checking for deviations
 */
export interface DeviationResult {
  /** Whether a deviation applies */
  hasDeviation: boolean;
  /** The deviation details if one applies */
  deviation?: Deviation;
  /** The recommended action (may be deviation or basic strategy) */
  action: Action;
  /** The original basic strategy action */
  basicAction: Action;
}

// ============================================================================
// Illustrious 18 Deviations
// ============================================================================

/**
 * The Illustrious 18 - Most valuable playing deviations for Hi-Lo counting
 * Ordered by rank (EV impact, higher = more valuable)
 * 
 * Note: These are for 6-deck S17 games. Some indices vary slightly for other conditions.
 */
export const ILLUSTRIOUS_18: Deviation[] = [
  // Insurance - the most valuable deviation
  {
    id: 'insurance',
    name: 'Insurance',
    playerHand: 'any',
    dealerUpcard: 11, // Ace
    basicAction: 'stand', // Decline insurance
    deviationAction: 'stand', // Take insurance (handled separately)
    index: 3,
    comparison: 'gte',
    rank: 1,
    isBettingDeviation: true,
  },
  
  // 16 vs 10 - Stand at TC >= 0
  {
    id: '16v10',
    name: '16 vs 10',
    playerHand: '16',
    dealerUpcard: 10,
    basicAction: 'hit',
    deviationAction: 'stand',
    index: 0,
    comparison: 'gte',
    rank: 2,
    isBettingDeviation: false,
  },
  
  // 15 vs 10 - Stand at TC >= +4
  {
    id: '15v10',
    name: '15 vs 10',
    playerHand: '15',
    dealerUpcard: 10,
    basicAction: 'hit',
    deviationAction: 'stand',
    index: 4,
    comparison: 'gte',
    rank: 3,
    isBettingDeviation: false,
  },
  
  // 10,10 vs 5 - Split at TC >= +5
  {
    id: '10-10v5',
    name: '10,10 vs 5',
    playerHand: '10,10',
    dealerUpcard: 5,
    basicAction: 'stand',
    deviationAction: 'split',
    index: 5,
    comparison: 'gte',
    rank: 4,
    isBettingDeviation: false,
  },
  
  // 10,10 vs 6 - Split at TC >= +4
  {
    id: '10-10v6',
    name: '10,10 vs 6',
    playerHand: '10,10',
    dealerUpcard: 6,
    basicAction: 'stand',
    deviationAction: 'split',
    index: 4,
    comparison: 'gte',
    rank: 5,
    isBettingDeviation: false,
  },
  
  // 10 vs 10 - Double at TC >= +4
  {
    id: '10v10',
    name: '10 vs 10',
    playerHand: '10',
    dealerUpcard: 10,
    basicAction: 'hit',
    deviationAction: 'double',
    index: 4,
    comparison: 'gte',
    rank: 6,
    isBettingDeviation: false,
  },
  
  // 12 vs 3 - Stand at TC >= +2
  {
    id: '12v3',
    name: '12 vs 3',
    playerHand: '12',
    dealerUpcard: 3,
    basicAction: 'hit',
    deviationAction: 'stand',
    index: 2,
    comparison: 'gte',
    rank: 7,
    isBettingDeviation: false,
  },
  
  // 12 vs 2 - Stand at TC >= +3
  {
    id: '12v2',
    name: '12 vs 2',
    playerHand: '12',
    dealerUpcard: 2,
    basicAction: 'hit',
    deviationAction: 'stand',
    index: 3,
    comparison: 'gte',
    rank: 8,
    isBettingDeviation: false,
  },
  
  // 11 vs A - Double at TC >= +1 (S17)
  {
    id: '11vA',
    name: '11 vs A',
    playerHand: '11',
    dealerUpcard: 11,
    basicAction: 'hit',
    deviationAction: 'double',
    index: 1,
    comparison: 'gte',
    rank: 9,
    isBettingDeviation: false,
  },
  
  // 9 vs 2 - Double at TC >= +1
  {
    id: '9v2',
    name: '9 vs 2',
    playerHand: '9',
    dealerUpcard: 2,
    basicAction: 'hit',
    deviationAction: 'double',
    index: 1,
    comparison: 'gte',
    rank: 10,
    isBettingDeviation: false,
  },
  
  // 10 vs A - Double at TC >= +4
  {
    id: '10vA',
    name: '10 vs A',
    playerHand: '10',
    dealerUpcard: 11,
    basicAction: 'hit',
    deviationAction: 'double',
    index: 4,
    comparison: 'gte',
    rank: 11,
    isBettingDeviation: false,
  },
  
  // 9 vs 7 - Double at TC >= +3
  {
    id: '9v7',
    name: '9 vs 7',
    playerHand: '9',
    dealerUpcard: 7,
    basicAction: 'hit',
    deviationAction: 'double',
    index: 3,
    comparison: 'gte',
    rank: 12,
    isBettingDeviation: false,
  },
  
  // 16 vs 9 - Stand at TC >= +5
  {
    id: '16v9',
    name: '16 vs 9',
    playerHand: '16',
    dealerUpcard: 9,
    basicAction: 'hit',
    deviationAction: 'stand',
    index: 5,
    comparison: 'gte',
    rank: 13,
    isBettingDeviation: false,
  },
  
  // 13 vs 2 - Hit at TC <= -1
  {
    id: '13v2',
    name: '13 vs 2',
    playerHand: '13',
    dealerUpcard: 2,
    basicAction: 'stand',
    deviationAction: 'hit',
    index: -1,
    comparison: 'lte',
    rank: 14,
    isBettingDeviation: false,
  },
  
  // 12 vs 4 - Hit at TC <= 0
  {
    id: '12v4',
    name: '12 vs 4',
    playerHand: '12',
    dealerUpcard: 4,
    basicAction: 'stand',
    deviationAction: 'hit',
    index: 0,
    comparison: 'lte',
    rank: 15,
    isBettingDeviation: false,
  },
  
  // 12 vs 5 - Hit at TC <= -2
  {
    id: '12v5',
    name: '12 vs 5',
    playerHand: '12',
    dealerUpcard: 5,
    basicAction: 'stand',
    deviationAction: 'hit',
    index: -2,
    comparison: 'lte',
    rank: 16,
    isBettingDeviation: false,
  },
  
  // 12 vs 6 - Hit at TC <= -1
  {
    id: '12v6',
    name: '12 vs 6',
    playerHand: '12',
    dealerUpcard: 6,
    basicAction: 'stand',
    deviationAction: 'hit',
    index: -1,
    comparison: 'lte',
    rank: 17,
    isBettingDeviation: false,
  },
  
  // 13 vs 3 - Hit at TC <= -2
  {
    id: '13v3',
    name: '13 vs 3',
    playerHand: '13',
    dealerUpcard: 3,
    basicAction: 'stand',
    deviationAction: 'hit',
    index: -2,
    comparison: 'lte',
    rank: 18,
    isBettingDeviation: false,
  },
];

/**
 * Fab 4 Surrender Deviations
 * The most valuable surrender-based deviations
 */
export const FAB_4_SURRENDERS: Deviation[] = [
  // 14 vs 10 - Surrender at TC >= +3
  {
    id: 'surr-14v10',
    name: '14 vs 10 (Surrender)',
    playerHand: '14',
    dealerUpcard: 10,
    basicAction: 'hit',
    deviationAction: 'surrender',
    index: 3,
    comparison: 'gte',
    rank: 1,
    isBettingDeviation: false,
  },
  
  // 15 vs 9 - Surrender at TC >= +2
  {
    id: 'surr-15v9',
    name: '15 vs 9 (Surrender)',
    playerHand: '15',
    dealerUpcard: 9,
    basicAction: 'hit',
    deviationAction: 'surrender',
    index: 2,
    comparison: 'gte',
    rank: 2,
    isBettingDeviation: false,
  },
  
  // 15 vs A - Surrender at TC >= +1 (S17) or TC >= 0 (H17)
  {
    id: 'surr-15vA',
    name: '15 vs A (Surrender)',
    playerHand: '15',
    dealerUpcard: 11,
    basicAction: 'hit',
    deviationAction: 'surrender',
    index: 1,
    comparison: 'gte',
    rank: 3,
    isBettingDeviation: false,
  },
  
  // 14 vs A - Surrender at TC >= +3
  {
    id: 'surr-14vA',
    name: '14 vs A (Surrender)',
    playerHand: '14',
    dealerUpcard: 11,
    basicAction: 'hit',
    deviationAction: 'surrender',
    index: 3,
    comparison: 'gte',
    rank: 4,
    isBettingDeviation: false,
  },
];

/**
 * All deviations combined
 */
export const ALL_DEVIATIONS: Deviation[] = [...ILLUSTRIOUS_18, ...FAB_4_SURRENDERS];

// ============================================================================
// Deviation Lookup Functions
// ============================================================================

/**
 * Check if a hand matches a deviation pattern
 */
function matchesDeviation(hand: Hand, deviation: Deviation, dealerUpcard: Card): boolean {
  const { value, isSoft } = evaluateHand(hand);
  const dealerValue = getDealerUpcardValue(dealerUpcard);
  
  // Check dealer upcard match
  if (dealerValue !== deviation.dealerUpcard) {
    return false;
  }
  
  // Handle special cases
  if (deviation.playerHand === 'any') {
    return true;
  }
  
  // Handle pair deviations (10,10)
  if (deviation.playerHand === '10,10') {
    if (!isPair(hand) || hand.cards.length !== 2) return false;
    return hand.cards[0].value === 10;
  }
  
  // Handle regular hard totals
  // Don't apply hard total deviations to soft hands
  if (isSoft) {
    return false;
  }
  
  return value.toString() === deviation.playerHand;
}

/**
 * Check if a deviation should apply based on true count
 */
function shouldApplyDeviation(deviation: Deviation, trueCount: number): boolean {
  if (deviation.comparison === 'gte') {
    return trueCount >= deviation.index;
  } else {
    return trueCount <= deviation.index;
  }
}

/**
 * Check if insurance should be taken based on count
 */
export function shouldTakeInsurance(trueCount: number): boolean {
  // Insurance is +EV at true count >= +3
  return trueCount >= 3;
}

/**
 * Get the deviation-adjusted optimal action
 * Returns both the adjusted action and whether a deviation was applied
 */
export function getCountAdjustedAction(
  playerHand: Hand,
  dealerUpcard: Card,
  rules: RulesConfig,
  trueCount: number,
  includeIllustrious18: boolean = true,
  includeFab4: boolean = true
): DeviationResult {
  // Get basic strategy first
  const basicResult = getOptimalAction(playerHand, dealerUpcard, rules);
  const basicAction = basicResult.optimal;
  
  // Build list of deviations to check
  let deviationsToCheck: Deviation[] = [];
  if (includeIllustrious18) {
    deviationsToCheck = [...deviationsToCheck, ...ILLUSTRIOUS_18];
  }
  if (includeFab4 && rules.surrender !== 'none') {
    deviationsToCheck = [...deviationsToCheck, ...FAB_4_SURRENDERS];
  }
  
  // Check each deviation
  for (const deviation of deviationsToCheck) {
    // Skip betting deviations (insurance)
    if (deviation.isBettingDeviation) continue;
    
    // Skip surrender deviations if surrender not available
    if (deviation.deviationAction === 'surrender' && rules.surrender === 'none') continue;
    
    // Check if deviation matches this situation
    if (!matchesDeviation(playerHand, deviation, dealerUpcard)) continue;
    
    // Check if count triggers the deviation
    if (!shouldApplyDeviation(deviation, trueCount)) continue;
    
    // Deviation applies!
    return {
      hasDeviation: true,
      deviation,
      action: deviation.deviationAction,
      basicAction,
    };
  }
  
  // No deviation applies
  return {
    hasDeviation: false,
    action: basicAction,
    basicAction,
  };
}

/**
 * Get strategy result with count adjustment
 * Combines basic strategy with deviation checking
 */
export function getOptimalActionWithCount(
  playerHand: Hand,
  dealerUpcard: Card,
  rules: RulesConfig,
  trueCount?: number
): StrategyResult {
  const basicResult = getOptimalAction(playerHand, dealerUpcard, rules);
  
  // If no count provided, return basic strategy
  if (trueCount === undefined) {
    return basicResult;
  }
  
  // Check for deviations
  const deviationResult = getCountAdjustedAction(
    playerHand,
    dealerUpcard,
    rules,
    trueCount
  );
  
  if (deviationResult.hasDeviation && deviationResult.deviation) {
    return {
      optimal: deviationResult.action,
      code: basicResult.code, // Keep original code for reference
      isDeviation: true,
    };
  }
  
  return basicResult;
}

/**
 * Get all applicable deviations for a given situation (for learning/display)
 */
export function getApplicableDeviations(
  playerHand: Hand,
  dealerUpcard: Card,
  rules: RulesConfig
): Deviation[] {
  return ALL_DEVIATIONS.filter(deviation => {
    // Skip betting deviations
    if (deviation.isBettingDeviation) return false;
    
    // Skip if surrender not available for surrender deviations
    if (deviation.deviationAction === 'surrender' && rules.surrender === 'none') return false;
    
    return matchesDeviation(playerHand, deviation, dealerUpcard);
  });
}

/**
 * Get deviation by ID
 */
export function getDeviationById(id: string): Deviation | undefined {
  return ALL_DEVIATIONS.find(d => d.id === id);
}

/**
 * Get all Illustrious 18 deviations (for learning mode)
 */
export function getIllustrious18(): Deviation[] {
  return [...ILLUSTRIOUS_18];
}

/**
 * Get all Fab 4 surrender deviations (for learning mode)
 */
export function getFab4Surrenders(): Deviation[] {
  return [...FAB_4_SURRENDERS];
}

// ============================================================================
// Betting Deviations
// ============================================================================

/**
 * Get recommended bet size based on true count
 * Returns a multiplier to apply to base bet
 * 
 * Common spread strategies:
 * - TC <= 0: Minimum bet (1 unit)
 * - TC +1: 2 units
 * - TC +2: 4 units
 * - TC +3: 6 units
 * - TC +4: 8 units
 * - TC +5+: Max bet (10+ units)
 */
export function getBetMultiplier(trueCount: number, maxSpread: number = 8): number {
  if (trueCount <= 0) return 1;
  if (trueCount >= maxSpread) return maxSpread;
  
  // Linear spread from 1 to maxSpread
  return Math.min(maxSpread, Math.max(1, Math.floor(trueCount * 2)));
}

/**
 * Get bet recommendation with reasoning
 */
export interface BetRecommendation {
  multiplier: number;
  reason: string;
  trueCount: number;
  playerAdvantage: boolean;
}

export function getBetRecommendation(trueCount: number, maxSpread: number = 8): BetRecommendation {
  const multiplier = getBetMultiplier(trueCount, maxSpread);
  const playerAdvantage = trueCount >= 1;
  
  let reason: string;
  if (trueCount <= 0) {
    reason = 'Negative/neutral count - minimum bet';
  } else if (trueCount >= 5) {
    reason = 'High count - maximum bet, strong player advantage';
  } else if (trueCount >= 3) {
    reason = 'Good count - increased bet';
  } else {
    reason = 'Slightly positive count - moderate bet';
  }
  
  return {
    multiplier,
    reason,
    trueCount,
    playerAdvantage,
  };
}
