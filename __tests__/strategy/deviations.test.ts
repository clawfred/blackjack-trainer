/**
 * Card Counting Deviations Tests
 * 
 * Tests for the Illustrious 18 and Fab 4 surrender deviations,
 * as well as count-adjusted strategy and betting recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  ILLUSTRIOUS_18,
  FAB_4_SURRENDERS,
  ALL_DEVIATIONS,
  getCountAdjustedAction,
  getOptimalActionWithCount,
  shouldTakeInsurance,
  getApplicableDeviations,
  getDeviationById,
  getBetMultiplier,
  getBetRecommendation,
  Deviation,
} from '../../src/strategy/deviations';
import { getOptimalAction } from '../../src/strategy/basicStrategy';
import { Hand, createHand, addCardToHand } from '../../src/engine/hand';
import { RulesConfig, VEGAS_STRIP_RULES } from '../../src/engine/rules';
import { Card, createCard, Rank, Suit } from '../../src/types';

// ============================================================================
// Test Helpers
// ============================================================================

function makeHand(cards: Array<[Rank, Suit]>, bet: number = 10): Hand {
  let hand = createHand(bet);
  for (const [rank, suit] of cards) {
    hand = addCardToHand(hand, createCard(rank, suit));
  }
  return hand;
}

function makeCard(rank: Rank, suit: Suit = 'spades'): Card {
  return createCard(rank, suit);
}

// ============================================================================
// Deviation Data Structure Tests
// ============================================================================

describe('Deviation Data', () => {
  describe('Illustrious 18', () => {
    it('should have exactly 18 deviations', () => {
      // Note: Insurance is included in Illustrious 18, so count is 18
      expect(ILLUSTRIOUS_18.length).toBe(18);
    });
    
    it('should have unique IDs', () => {
      const ids = ILLUSTRIOUS_18.map(d => d.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
    
    it('should have ranks from 1 to 18', () => {
      const ranks = ILLUSTRIOUS_18.map(d => d.rank).sort((a, b) => a - b);
      expect(ranks[0]).toBe(1);
      expect(ranks[ranks.length - 1]).toBe(18);
    });
    
    it('should have Insurance as rank 1 (most valuable)', () => {
      const insurance = ILLUSTRIOUS_18.find(d => d.id === 'insurance');
      expect(insurance).toBeDefined();
      expect(insurance?.rank).toBe(1);
      expect(insurance?.isBettingDeviation).toBe(true);
    });
    
    it('should have 16 vs 10 as rank 2', () => {
      const dev = ILLUSTRIOUS_18.find(d => d.id === '16v10');
      expect(dev).toBeDefined();
      expect(dev?.rank).toBe(2);
      expect(dev?.basicAction).toBe('hit');
      expect(dev?.deviationAction).toBe('stand');
      expect(dev?.index).toBe(0);
    });
  });
  
  describe('Fab 4 Surrenders', () => {
    it('should have exactly 4 surrender deviations', () => {
      expect(FAB_4_SURRENDERS.length).toBe(4);
    });
    
    it('should all be surrender actions', () => {
      for (const dev of FAB_4_SURRENDERS) {
        expect(dev.deviationAction).toBe('surrender');
      }
    });
    
    it('should have unique IDs', () => {
      const ids = FAB_4_SURRENDERS.map(d => d.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
  
  describe('ALL_DEVIATIONS', () => {
    it('should combine Illustrious 18 and Fab 4', () => {
      expect(ALL_DEVIATIONS.length).toBe(ILLUSTRIOUS_18.length + FAB_4_SURRENDERS.length);
    });
  });
});

// ============================================================================
// Deviation Lookup Tests
// ============================================================================

describe('getDeviationById', () => {
  it('should find deviations by ID', () => {
    expect(getDeviationById('16v10')).toBeDefined();
    expect(getDeviationById('insurance')).toBeDefined();
    expect(getDeviationById('surr-14v10')).toBeDefined();
  });
  
  it('should return undefined for unknown ID', () => {
    expect(getDeviationById('unknown')).toBeUndefined();
  });
});

describe('getApplicableDeviations', () => {
  const rules = VEGAS_STRIP_RULES;
  
  it('should find deviations for 16 vs 10', () => {
    const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
    const deviations = getApplicableDeviations(hand, makeCard('10'), rules);
    
    expect(deviations.length).toBeGreaterThan(0);
    expect(deviations.some(d => d.id === '16v10')).toBe(true);
  });
  
  it('should find deviations for 12 vs 3', () => {
    const hand = makeHand([['10', 'hearts'], ['2', 'diamonds']]);
    const deviations = getApplicableDeviations(hand, makeCard('3'), rules);
    
    expect(deviations.some(d => d.id === '12v3')).toBe(true);
  });
  
  it('should not return betting deviations (insurance)', () => {
    const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
    const deviations = getApplicableDeviations(hand, makeCard('A'), rules);
    
    expect(deviations.every(d => !d.isBettingDeviation)).toBe(true);
  });
  
  it('should not return surrender deviations when surrender unavailable', () => {
    const noSurrenderRules = { ...rules, surrender: 'none' as const };
    const hand = makeHand([['10', 'hearts'], ['4', 'diamonds']]);
    const deviations = getApplicableDeviations(hand, makeCard('10'), noSurrenderRules);
    
    expect(deviations.every(d => d.deviationAction !== 'surrender')).toBe(true);
  });
});

// ============================================================================
// Count-Adjusted Action Tests
// ============================================================================

describe('getCountAdjustedAction', () => {
  const rules = VEGAS_STRIP_RULES;
  
  describe('16 vs 10 (Index 0)', () => {
    const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
    const dealer = makeCard('10');
    // Note: Basic strategy for 16 vs 10 is Rh (surrender if allowed, else hit)
    // With late surrender, basic action is surrender
    // Deviation is to STAND at TC >= 0
    
    it('should surrender at negative count (basic strategy)', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, -2);
      expect(result.hasDeviation).toBe(false);
      // Basic strategy is surrender (Rh)
      expect(result.action).toBe('surrender');
    });
    
    it('should stand at TC = 0 (deviation)', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, 0);
      expect(result.hasDeviation).toBe(true);
      expect(result.action).toBe('stand');
      expect(result.deviation?.id).toBe('16v10');
    });
    
    it('should stand at positive count', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, 3);
      expect(result.hasDeviation).toBe(true);
      expect(result.action).toBe('stand');
    });
  });
  
  describe('15 vs 10 (Index +4)', () => {
    const hand = makeHand([['10', 'hearts'], ['5', 'diamonds']]);
    const dealer = makeCard('10');
    // Note: Basic strategy for 15 vs 10 is Rh (surrender if allowed, else hit)
    // With late surrender, basic action is surrender
    // Deviation is to STAND at TC >= +4
    
    it('should surrender at TC +3 (basic strategy)', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, 3);
      expect(result.hasDeviation).toBe(false);
      // Basic strategy is surrender (Rh)
      expect(result.action).toBe('surrender');
    });
    
    it('should stand at TC +4 (deviation)', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, 4);
      expect(result.hasDeviation).toBe(true);
      expect(result.action).toBe('stand');
    });
    
    it('should stand at TC +5', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, 5);
      expect(result.hasDeviation).toBe(true);
      expect(result.action).toBe('stand');
    });
  });
  
  describe('12 vs 3 (Index +2)', () => {
    const hand = makeHand([['10', 'hearts'], ['2', 'diamonds']]);
    const dealer = makeCard('3');
    
    it('should hit at TC +1', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, 1);
      expect(result.hasDeviation).toBe(false);
      expect(result.action).toBe('hit');
    });
    
    it('should stand at TC +2', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, 2);
      expect(result.hasDeviation).toBe(true);
      expect(result.action).toBe('stand');
    });
  });
  
  describe('13 vs 2 (Index -1, negative deviation)', () => {
    const hand = makeHand([['10', 'hearts'], ['3', 'diamonds']]);
    const dealer = makeCard('2');
    
    it('should stand at TC 0', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, 0);
      expect(result.hasDeviation).toBe(false);
      expect(result.action).toBe('stand');
    });
    
    it('should hit at TC -1', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, -1);
      expect(result.hasDeviation).toBe(true);
      expect(result.action).toBe('hit');
    });
    
    it('should hit at TC -3', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, -3);
      expect(result.hasDeviation).toBe(true);
      expect(result.action).toBe('hit');
    });
  });
  
  describe('10,10 vs 5 (Index +5 for splitting)', () => {
    const hand = makeHand([['10', 'hearts'], ['10', 'diamonds']]);
    const dealer = makeCard('5');
    
    it('should stand at TC +4', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, 4);
      expect(result.hasDeviation).toBe(false);
      expect(result.action).toBe('stand');
    });
    
    it('should split at TC +5', () => {
      const result = getCountAdjustedAction(hand, dealer, rules, 5);
      expect(result.hasDeviation).toBe(true);
      expect(result.action).toBe('split');
    });
  });
  
  describe('Fab 4 Surrender Deviations', () => {
    it('should surrender 14 vs 10 at TC +3', () => {
      const hand = makeHand([['10', 'hearts'], ['4', 'diamonds']]);
      const result = getCountAdjustedAction(hand, makeCard('10'), rules, 3);
      
      expect(result.hasDeviation).toBe(true);
      expect(result.action).toBe('surrender');
    });
    
    it('should not surrender 14 vs 10 at TC +2', () => {
      const hand = makeHand([['10', 'hearts'], ['4', 'diamonds']]);
      const result = getCountAdjustedAction(hand, makeCard('10'), rules, 2);
      
      expect(result.hasDeviation).toBe(false);
      expect(result.action).toBe('hit');
    });
    
    it('should not include surrender deviations when surrender unavailable', () => {
      const noSurrenderRules = { ...rules, surrender: 'none' as const };
      const hand = makeHand([['10', 'hearts'], ['4', 'diamonds']]);
      const result = getCountAdjustedAction(hand, makeCard('10'), noSurrenderRules, 5);
      
      // Should not surrender even at high count
      expect(result.action).not.toBe('surrender');
    });
  });
});

describe('getOptimalActionWithCount', () => {
  const rules = VEGAS_STRIP_RULES;
  
  it('should return basic strategy when no count provided', () => {
    const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
    const resultNoCount = getOptimalActionWithCount(hand, makeCard('10'), rules);
    const basicResult = getOptimalAction(hand, makeCard('10'), rules);
    
    expect(resultNoCount.optimal).toBe(basicResult.optimal);
    expect(resultNoCount.isDeviation).toBeUndefined();
  });
  
  it('should flag deviations when count triggers them', () => {
    const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
    const result = getOptimalActionWithCount(hand, makeCard('10'), rules, 0);
    
    expect(result.optimal).toBe('stand');
    expect(result.isDeviation).toBe(true);
  });
  
  it('should return basic strategy action when count does not trigger deviation', () => {
    const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
    const result = getOptimalActionWithCount(hand, makeCard('10'), rules, -2);
    
    // Basic strategy for 16 vs 10 is surrender (Rh), not hit
    expect(result.optimal).toBe('surrender');
    expect(result.isDeviation).toBeFalsy();
  });
});

// ============================================================================
// Insurance Tests
// ============================================================================

describe('shouldTakeInsurance', () => {
  it('should return false for counts below +3', () => {
    expect(shouldTakeInsurance(-5)).toBe(false);
    expect(shouldTakeInsurance(0)).toBe(false);
    expect(shouldTakeInsurance(2)).toBe(false);
    expect(shouldTakeInsurance(2.9)).toBe(false);
  });
  
  it('should return true for counts at +3 and above', () => {
    expect(shouldTakeInsurance(3)).toBe(true);
    expect(shouldTakeInsurance(3.5)).toBe(true);
    expect(shouldTakeInsurance(5)).toBe(true);
    expect(shouldTakeInsurance(10)).toBe(true);
  });
});

// ============================================================================
// Bet Sizing Tests
// ============================================================================

describe('getBetMultiplier', () => {
  it('should return 1 for negative counts', () => {
    expect(getBetMultiplier(-5)).toBe(1);
    expect(getBetMultiplier(-1)).toBe(1);
  });
  
  it('should return 1 for zero count', () => {
    expect(getBetMultiplier(0)).toBe(1);
  });
  
  it('should scale with positive count', () => {
    expect(getBetMultiplier(1)).toBe(2);
    expect(getBetMultiplier(2)).toBe(4);
    expect(getBetMultiplier(3)).toBe(6);
    expect(getBetMultiplier(4)).toBe(8);
  });
  
  it('should respect max spread', () => {
    expect(getBetMultiplier(10, 8)).toBe(8);
    expect(getBetMultiplier(100, 8)).toBe(8);
    
    expect(getBetMultiplier(10, 12)).toBe(12);
  });
  
  it('should allow custom max spread', () => {
    expect(getBetMultiplier(5, 4)).toBe(4);
    expect(getBetMultiplier(5, 16)).toBe(10);
  });
});

describe('getBetRecommendation', () => {
  it('should return minimum bet for negative count', () => {
    const rec = getBetRecommendation(-3);
    expect(rec.multiplier).toBe(1);
    expect(rec.playerAdvantage).toBe(false);
    expect(rec.reason).toContain('minimum');
  });
  
  it('should indicate player advantage at positive count', () => {
    const rec = getBetRecommendation(3);
    expect(rec.playerAdvantage).toBe(true);
    expect(rec.multiplier).toBeGreaterThan(1);
  });
  
  it('should recommend maximum bet at high count', () => {
    const rec = getBetRecommendation(8);
    expect(rec.multiplier).toBe(8);
    expect(rec.reason).toContain('maximum');
  });
  
  it('should include true count in recommendation', () => {
    const rec = getBetRecommendation(4.5);
    expect(rec.trueCount).toBe(4.5);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  const rules = VEGAS_STRIP_RULES;
  
  it('should handle soft hands correctly (no hard total deviations)', () => {
    // A,5 = soft 16, should not trigger 16 vs 10 deviation
    const hand = makeHand([['A', 'hearts'], ['5', 'diamonds']]);
    const result = getCountAdjustedAction(hand, makeCard('10'), rules, 5);
    
    // Should follow soft total strategy, not hard 16 deviation
    expect(result.hasDeviation).toBe(false);
    expect(result.action).toBe('hit'); // Soft 16 vs 10 is always hit
  });
  
  it('should handle multi-card hands correctly', () => {
    // 7 + 4 + 5 = 16, same as 10 + 6
    const hand = makeHand([['7', 'hearts'], ['4', 'diamonds'], ['5', 'clubs']]);
    const result = getCountAdjustedAction(hand, makeCard('10'), rules, 0);
    
    expect(result.hasDeviation).toBe(true);
    expect(result.action).toBe('stand');
  });
  
  it('should handle pair hands as pairs not totals', () => {
    // 10,10 should match pair deviation, not hard 20
    const hand = makeHand([['10', 'hearts'], ['10', 'diamonds']]);
    
    // At high count, should trigger 10,10 vs 6 split
    const result = getCountAdjustedAction(hand, makeCard('6'), rules, 5);
    expect(result.hasDeviation).toBe(true);
    expect(result.action).toBe('split');
  });
});
