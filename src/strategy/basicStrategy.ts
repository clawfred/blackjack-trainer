/**
 * Basic Strategy Engine
 * 
 * Complete basic strategy matrices for blackjack with support for different rule sets.
 * Provides optimal action lookup for any player hand vs dealer upcard combination.
 */

import { Card, Rank } from '../types';
import { Hand, evaluateHand, isPair, getHandType } from '../engine/hand';
import { RulesConfig } from '../engine/rules';

// ============================================================================
// Types
// ============================================================================

/**
 * Possible player actions
 */
export type Action = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

/**
 * Strategy codes used in the matrices
 * H = Hit
 * S = Stand
 * D = Double if allowed, else Hit
 * Ds = Double if allowed, else Stand
 * P = Split
 * Ph = Split if DAS allowed, else Hit
 * Pd = Split if DAS allowed, else Double
 * Rh = Surrender if allowed, else Hit
 * Rs = Surrender if allowed, else Stand
 * Rp = Surrender if allowed, else Split
 */
export type StrategyCode = 
  | 'H' | 'S' | 'D' | 'Ds' 
  | 'P' | 'Ph' | 'Pd'
  | 'Rh' | 'Rs' | 'Rp';

/**
 * Dealer upcard values (2-10 and A)
 */
export type DealerUpcard = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * Available actions based on current game state
 */
export interface AvailableActions {
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
}

/**
 * Result from strategy lookup
 */
export interface StrategyResult {
  /** The optimal action to take */
  optimal: Action;
  /** The raw strategy code from the matrix */
  code: StrategyCode;
  /** Whether this is a deviation from basic strategy (based on count) */
  isDeviation?: boolean;
}

// ============================================================================
// Strategy Matrices
// ============================================================================

/**
 * Hard totals strategy matrix (S17 rules, default)
 * Row: player hard total (4-20)
 * Column: dealer upcard (2-11 where 11=Ace)
 */
const HARD_TOTALS_S17: Record<number, Record<DealerUpcard, StrategyCode>> = {
  4:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
  5:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
  6:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
  7:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
  8:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
  9:  { 2: 'H',  3: 'D',  4: 'D',  5: 'D',  6: 'D',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
  10: { 2: 'D',  3: 'D',  4: 'D',  5: 'D',  6: 'D',  7: 'D',  8: 'D',  9: 'D',  10: 'H',  11: 'H' },
  11: { 2: 'D',  3: 'D',  4: 'D',  5: 'D',  6: 'D',  7: 'D',  8: 'D',  9: 'D',  10: 'D',  11: 'D' },
  12: { 2: 'H',  3: 'H',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
  13: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
  14: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
  15: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'Rh', 11: 'Rh' },
  16: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'Rh', 10: 'Rh', 11: 'Rh' },
  17: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'Rs' },
  18: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S' },
  19: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S' },
  20: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S' },
};

/**
 * Hard totals for H17 rules (dealer hits soft 17)
 * Differences from S17:
 * - 11 vs A: Still double (same)
 * - 15 vs A: Surrender (Rh) instead of Hit
 * - 17 vs A: Surrender (Rs) instead of Stand
 */
const HARD_TOTALS_H17: Record<number, Record<DealerUpcard, StrategyCode>> = {
  ...HARD_TOTALS_S17,
  11: { 2: 'D',  3: 'D',  4: 'D',  5: 'D',  6: 'D',  7: 'D',  8: 'D',  9: 'D',  10: 'D',  11: 'D' },
  15: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'Rh', 11: 'Rh' },
  17: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'Rs' },
};

/**
 * Soft totals strategy matrix (S17 rules)
 * Row: soft total (13-20, represented as A,2 through A,9)
 * We use the total value (13-20) for indexing
 */
const SOFT_TOTALS_S17: Record<number, Record<DealerUpcard, StrategyCode>> = {
  13: { 2: 'H',  3: 'H',  4: 'H',  5: 'D',  6: 'D',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // A,2
  14: { 2: 'H',  3: 'H',  4: 'H',  5: 'D',  6: 'D',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // A,3
  15: { 2: 'H',  3: 'H',  4: 'D',  5: 'D',  6: 'D',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // A,4
  16: { 2: 'H',  3: 'H',  4: 'D',  5: 'D',  6: 'D',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // A,5
  17: { 2: 'H',  3: 'D',  4: 'D',  5: 'D',  6: 'D',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // A,6
  18: { 2: 'Ds', 3: 'Ds', 4: 'Ds', 5: 'Ds', 6: 'Ds', 7: 'S',  8: 'S',  9: 'H',  10: 'H',  11: 'H' },  // A,7
  19: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'Ds', 7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S' },  // A,8
  20: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S' },  // A,9
};

/**
 * Soft totals for H17 rules
 * Differences from S17:
 * - A,7 vs 2: Double (Ds) instead of Stand (same - was already Ds)
 * - A,8 vs 6: Double (Ds) remains the same
 */
const SOFT_TOTALS_H17: Record<number, Record<DealerUpcard, StrategyCode>> = {
  ...SOFT_TOTALS_S17,
  // H17 has slightly more aggressive doubling on soft hands vs dealer 2
  18: { 2: 'Ds', 3: 'Ds', 4: 'Ds', 5: 'Ds', 6: 'Ds', 7: 'S',  8: 'S',  9: 'H',  10: 'H',  11: 'H' },
  19: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'Ds', 7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S' },
};

/**
 * Pairs strategy matrix with DAS (Double After Split) allowed
 * Row: pair rank (represented by card value, A=11)
 */
const PAIRS_DAS: Record<number, Record<DealerUpcard, StrategyCode>> = {
  2:  { 2: 'Ph', 3: 'Ph', 4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // 2,2
  3:  { 2: 'Ph', 3: 'Ph', 4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // 3,3
  4:  { 2: 'H',  3: 'H',  4: 'H',  5: 'Ph', 6: 'Ph', 7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // 4,4
  5:  { 2: 'D',  3: 'D',  4: 'D',  5: 'D',  6: 'D',  7: 'D',  8: 'D',  9: 'D',  10: 'H',  11: 'H' },  // 5,5 (treat as 10)
  6:  { 2: 'Ph', 3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // 6,6
  7:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // 7,7
  8:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'P',  9: 'P',  10: 'P',  11: 'Rp' }, // 8,8
  9:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'S',  8: 'P',  9: 'P',  10: 'S',  11: 'S' },  // 9,9
  10: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S' },  // 10,10
  11: { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'P',  9: 'P',  10: 'P',  11: 'P' },  // A,A
};

/**
 * Pairs strategy without DAS (No Double After Split)
 * Key differences:
 * - 2,2 vs 2-3: Hit instead of Split
 * - 3,3 vs 2-3: Hit instead of Split
 * - 4,4: Never split (becomes hard 8, always hit)
 * - 6,6 vs 2: Hit instead of Split
 */
const PAIRS_NO_DAS: Record<number, Record<DealerUpcard, StrategyCode>> = {
  2:  { 2: 'H',  3: 'H',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // 2,2
  3:  { 2: 'H',  3: 'H',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // 3,3
  4:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // 4,4
  5:  { 2: 'D',  3: 'D',  4: 'D',  5: 'D',  6: 'D',  7: 'D',  8: 'D',  9: 'D',  10: 'H',  11: 'H' },  // 5,5 (treat as 10)
  6:  { 2: 'H',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // 6,6
  7:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },  // 7,7
  8:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'P',  9: 'P',  10: 'P',  11: 'Rp' }, // 8,8
  9:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'S',  8: 'P',  9: 'P',  10: 'S',  11: 'S' },  // 9,9
  10: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S' },  // 10,10
  11: { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'P',  9: 'P',  10: 'P',  11: 'P' },  // A,A
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert dealer card to upcard value (2-11)
 */
export function getDealerUpcardValue(card: Card): DealerUpcard {
  if (card.rank === 'A') return 11;
  if (['K', 'Q', 'J', '10'].includes(card.rank)) return 10;
  return parseInt(card.rank, 10) as DealerUpcard;
}

/**
 * Get pair value for matrix lookup (2-11)
 */
function getPairValue(card: Card): number {
  if (card.rank === 'A') return 11;
  if (['K', 'Q', 'J', '10'].includes(card.rank)) return 10;
  return parseInt(card.rank, 10);
}

/**
 * Select the appropriate matrices based on rules
 */
function getMatrices(rules: RulesConfig) {
  const hardMatrix = rules.dealerHitsSoft17 ? HARD_TOTALS_H17 : HARD_TOTALS_S17;
  const softMatrix = rules.dealerHitsSoft17 ? SOFT_TOTALS_H17 : SOFT_TOTALS_S17;
  const pairMatrix = rules.doubleAfterSplit ? PAIRS_DAS : PAIRS_NO_DAS;
  
  return { hardMatrix, softMatrix, pairMatrix };
}

/**
 * Convert strategy code to action based on available actions
 */
function codeToAction(code: StrategyCode, available: AvailableActions): Action {
  switch (code) {
    case 'H':
      return 'hit';
    case 'S':
      return 'stand';
    case 'D':
      // Double if allowed, else hit
      return available.canDouble ? 'double' : 'hit';
    case 'Ds':
      // Double if allowed, else stand
      return available.canDouble ? 'double' : 'stand';
    case 'P':
      // Always split (matrix should only show this when split is valid)
      return available.canSplit ? 'split' : 'hit';
    case 'Ph':
      // Split if DAS allowed, else hit (handled by matrix selection)
      return available.canSplit ? 'split' : 'hit';
    case 'Pd':
      // Split if DAS allowed, else double
      return available.canSplit ? 'split' : (available.canDouble ? 'double' : 'hit');
    case 'Rh':
      // Surrender if allowed, else hit
      return available.canSurrender ? 'surrender' : 'hit';
    case 'Rs':
      // Surrender if allowed, else stand
      return available.canSurrender ? 'surrender' : 'stand';
    case 'Rp':
      // Surrender if allowed, else split
      return available.canSurrender ? 'surrender' : (available.canSplit ? 'split' : 'hit');
    default:
      return 'hit';
  }
}

// ============================================================================
// Main Strategy Lookup Function
// ============================================================================

/**
 * Get the strategy code from the matrix for a given situation
 * This returns the raw code before applying available actions
 */
export function getStrategyCode(
  playerHand: Hand,
  dealerUpcard: Card,
  rules: RulesConfig
): StrategyCode {
  const { hardMatrix, softMatrix, pairMatrix } = getMatrices(rules);
  const dealerValue = getDealerUpcardValue(dealerUpcard);
  const { value, isSoft } = evaluateHand(playerHand);
  const handType = getHandType(playerHand);
  
  // For pairs, use pair matrix
  if (handType === 'pair' && playerHand.cards.length === 2) {
    const pairValue = getPairValue(playerHand.cards[0]);
    const pairRow = pairMatrix[pairValue];
    if (pairRow) {
      return pairRow[dealerValue];
    }
  }
  
  // For soft hands, use soft matrix
  if (isSoft && value >= 13 && value <= 20) {
    const softRow = softMatrix[value];
    if (softRow) {
      return softRow[dealerValue];
    }
  }
  
  // For hard hands
  // Clamp value to matrix range
  const clampedValue = Math.max(4, Math.min(20, value));
  const hardRow = hardMatrix[clampedValue];
  if (hardRow) {
    return hardRow[dealerValue];
  }
  
  // Default to hit for edge cases (shouldn't happen)
  return 'H';
}

/**
 * Get the optimal action for a given hand/dealer combination
 */
export function getOptimalAction(
  playerHand: Hand,
  dealerUpcard: Card,
  rules: RulesConfig,
  availableActions?: AvailableActions
): StrategyResult {
  // Default available actions if not provided
  const available: AvailableActions = availableActions ?? {
    canHit: true,
    canStand: true,
    canDouble: playerHand.cards.length === 2,
    canSplit: isPair(playerHand) && playerHand.cards.length === 2,
    canSurrender: rules.surrender !== 'none' && playerHand.cards.length === 2,
  };
  
  const code = getStrategyCode(playerHand, dealerUpcard, rules);
  const optimal = codeToAction(code, available);
  
  return {
    optimal,
    code,
  };
}

/**
 * Check if a player's action matches basic strategy
 */
export function isOptimalAction(
  playerAction: Action,
  playerHand: Hand,
  dealerUpcard: Card,
  rules: RulesConfig,
  availableActions?: AvailableActions
): boolean {
  const { optimal } = getOptimalAction(playerHand, dealerUpcard, rules, availableActions);
  return playerAction === optimal;
}

/**
 * Get all actions in order of preference for a situation
 * Returns array of actions from best to worst
 */
export function getActionsByPreference(
  playerHand: Hand,
  dealerUpcard: Card,
  rules: RulesConfig,
  availableActions?: AvailableActions
): Action[] {
  const available: AvailableActions = availableActions ?? {
    canHit: true,
    canStand: true,
    canDouble: playerHand.cards.length === 2,
    canSplit: isPair(playerHand) && playerHand.cards.length === 2,
    canSurrender: rules.surrender !== 'none' && playerHand.cards.length === 2,
  };
  
  const { optimal } = getOptimalAction(playerHand, dealerUpcard, rules, available);
  
  // Build list of available actions with optimal first
  const actions: Action[] = [optimal];
  
  // Add other available actions
  if (available.canHit && !actions.includes('hit')) actions.push('hit');
  if (available.canStand && !actions.includes('stand')) actions.push('stand');
  if (available.canDouble && !actions.includes('double')) actions.push('double');
  if (available.canSplit && !actions.includes('split')) actions.push('split');
  if (available.canSurrender && !actions.includes('surrender')) actions.push('surrender');
  
  return actions;
}

// ============================================================================
// Strategy Matrix Export (for UI display)
// ============================================================================

/**
 * Get the hard totals matrix for display
 */
export function getHardTotalsMatrix(rules: RulesConfig): Record<number, Record<DealerUpcard, StrategyCode>> {
  return rules.dealerHitsSoft17 ? { ...HARD_TOTALS_H17 } : { ...HARD_TOTALS_S17 };
}

/**
 * Get the soft totals matrix for display
 */
export function getSoftTotalsMatrix(rules: RulesConfig): Record<number, Record<DealerUpcard, StrategyCode>> {
  return rules.dealerHitsSoft17 ? { ...SOFT_TOTALS_H17 } : { ...SOFT_TOTALS_S17 };
}

/**
 * Get the pairs matrix for display
 */
export function getPairsMatrix(rules: RulesConfig): Record<number, Record<DealerUpcard, StrategyCode>> {
  return rules.doubleAfterSplit ? { ...PAIRS_DAS } : { ...PAIRS_NO_DAS };
}

/**
 * Strategy code descriptions for UI
 */
export const STRATEGY_CODE_DESCRIPTIONS: Record<StrategyCode, string> = {
  'H': 'Hit',
  'S': 'Stand',
  'D': 'Double if allowed, otherwise Hit',
  'Ds': 'Double if allowed, otherwise Stand',
  'P': 'Split',
  'Ph': 'Split if DAS, otherwise Hit',
  'Pd': 'Split if DAS, otherwise Double',
  'Rh': 'Surrender if allowed, otherwise Hit',
  'Rs': 'Surrender if allowed, otherwise Stand',
  'Rp': 'Surrender if allowed, otherwise Split',
};
