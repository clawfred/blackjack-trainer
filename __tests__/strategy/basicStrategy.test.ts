/**
 * Basic Strategy Engine Tests
 * 
 * Tests for strategy lookups across all hand types:
 * - Hard totals
 * - Soft totals
 * - Pairs
 * - Rule variations (S17 vs H17, DAS vs no DAS, surrender)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOptimalAction,
  getStrategyCode,
  isOptimalAction,
  getDealerUpcardValue,
  getHardTotalsMatrix,
  getSoftTotalsMatrix,
  getPairsMatrix,
  Action,
  StrategyCode,
} from '../../src/strategy/basicStrategy';
import { Hand, createHand, addCardToHand } from '../../src/engine/hand';
import { RulesConfig, VEGAS_STRIP_RULES, DOWNTOWN_VEGAS_RULES, SINGLE_DECK_RULES } from '../../src/engine/rules';
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
// Hard Totals Tests
// ============================================================================

describe('Hard Totals Strategy', () => {
  const rules = { ...VEGAS_STRIP_RULES }; // S17, DAS, Late Surrender
  
  describe('Stiff hands (12-16) vs dealer low cards (2-6)', () => {
    it('should stand on 13 vs 2-6', () => {
      const hand = makeHand([['10', 'hearts'], ['3', 'diamonds']]);
      
      for (const dealerRank of ['2', '3', '4', '5', '6'] as Rank[]) {
        const dealer = makeCard(dealerRank);
        const result = getOptimalAction(hand, dealer, rules);
        expect(result.optimal).toBe('stand');
      }
    });
    
    it('should stand on 14 vs 2-6', () => {
      const hand = makeHand([['10', 'hearts'], ['4', 'diamonds']]);
      
      for (const dealerRank of ['2', '3', '4', '5', '6'] as Rank[]) {
        const dealer = makeCard(dealerRank);
        const result = getOptimalAction(hand, dealer, rules);
        expect(result.optimal).toBe('stand');
      }
    });
    
    it('should hit on 12 vs 2-3', () => {
      const hand = makeHand([['10', 'hearts'], ['2', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('2'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('3'), rules).optimal).toBe('hit');
    });
    
    it('should stand on 12 vs 4-6', () => {
      const hand = makeHand([['10', 'hearts'], ['2', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('4'), rules).optimal).toBe('stand');
      expect(getOptimalAction(hand, makeCard('5'), rules).optimal).toBe('stand');
      expect(getOptimalAction(hand, makeCard('6'), rules).optimal).toBe('stand');
    });
  });
  
  describe('Stiff hands (12-16) vs dealer high cards (7-A)', () => {
    it('should hit on 12-14 vs 7-9', () => {
      for (const total of [12, 13, 14]) {
        const smallCard = (total - 10).toString() as Rank;
        const hand = makeHand([['10', 'hearts'], [smallCard, 'diamonds']]);
        
        for (const dealerRank of ['7', '8', '9'] as Rank[]) {
          const result = getOptimalAction(hand, makeCard(dealerRank), rules);
          expect(result.optimal).toBe('hit');
        }
      }
    });
    
    it('should hit on 15-16 vs 7-8', () => {
      for (const total of [15, 16]) {
        const smallCard = (total - 10).toString() as Rank;
        const hand = makeHand([['10', 'hearts'], [smallCard, 'diamonds']]);
        
        for (const dealerRank of ['7', '8'] as Rank[]) {
          const result = getOptimalAction(hand, makeCard(dealerRank), rules);
          expect(result.optimal).toBe('hit');
        }
      }
    });
    
    it('should surrender 16 vs 9 (with late surrender)', () => {
      const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
      expect(getOptimalAction(hand, makeCard('9'), rules).optimal).toBe('surrender');
    });
  });
  
  describe('Doubling situations', () => {
    it('should double 11 vs all dealer cards except nothing (always double)', () => {
      const hand = makeHand([['5', 'hearts'], ['6', 'diamonds']]);
      
      for (const dealerRank of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as Rank[]) {
        const result = getOptimalAction(hand, makeCard(dealerRank), rules);
        expect(result.optimal).toBe('double');
      }
    });
    
    it('should double 10 vs 2-9', () => {
      const hand = makeHand([['4', 'hearts'], ['6', 'diamonds']]);
      
      for (const dealerRank of ['2', '3', '4', '5', '6', '7', '8', '9'] as Rank[]) {
        const result = getOptimalAction(hand, makeCard(dealerRank), rules);
        expect(result.optimal).toBe('double');
      }
    });
    
    it('should hit 10 vs 10 and A', () => {
      const hand = makeHand([['4', 'hearts'], ['6', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('10'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('A'), rules).optimal).toBe('hit');
    });
    
    it('should double 9 vs 3-6', () => {
      const hand = makeHand([['4', 'hearts'], ['5', 'diamonds']]);
      
      for (const dealerRank of ['3', '4', '5', '6'] as Rank[]) {
        const result = getOptimalAction(hand, makeCard(dealerRank), rules);
        expect(result.optimal).toBe('double');
      }
    });
    
    it('should hit 9 vs 2 and 7+', () => {
      const hand = makeHand([['4', 'hearts'], ['5', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('2'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('7'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('10'), rules).optimal).toBe('hit');
    });
  });
  
  describe('Strong hands (17+)', () => {
    it('should stand on 18-20 vs all', () => {
      for (const total of [18, 19, 20]) {
        const smallCard = (total - 10).toString() as Rank;
        const hand = makeHand([['10', 'hearts'], [smallCard, 'diamonds']]);
        
        for (const dealerRank of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as Rank[]) {
          const result = getOptimalAction(hand, makeCard(dealerRank), rules);
          expect(result.optimal).toBe('stand');
        }
      }
    });
    
    it('should stand on 17 vs 2-10', () => {
      const hand = makeHand([['10', 'hearts'], ['7', 'diamonds']]);
      
      for (const dealerRank of ['2', '3', '4', '5', '6', '7', '8', '9', '10'] as Rank[]) {
        const result = getOptimalAction(hand, makeCard(dealerRank), rules);
        expect(result.optimal).toBe('stand');
      }
    });
    
    it('should surrender 17 vs A (with late surrender)', () => {
      const hand = makeHand([['10', 'hearts'], ['7', 'diamonds']]);
      // 17 vs A: Rs (surrender if allowed, else stand)
      expect(getOptimalAction(hand, makeCard('A'), rules).optimal).toBe('surrender');
    });
  });
  
  describe('Surrender situations', () => {
    it('should surrender 16 vs 9, 10, A (when available)', () => {
      const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('9'), rules).optimal).toBe('surrender');
      expect(getOptimalAction(hand, makeCard('10'), rules).optimal).toBe('surrender');
      expect(getOptimalAction(hand, makeCard('A'), rules).optimal).toBe('surrender');
    });
    
    it('should surrender 15 vs 10, A (when available)', () => {
      const hand = makeHand([['10', 'hearts'], ['5', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('10'), rules).optimal).toBe('surrender');
      expect(getOptimalAction(hand, makeCard('A'), rules).optimal).toBe('surrender');
    });
    
    it('should hit instead of surrender when surrender unavailable', () => {
      const noSurrenderRules = { ...rules, surrender: 'none' as const };
      const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('10'), noSurrenderRules).optimal).toBe('hit');
    });
  });
});

// ============================================================================
// Soft Totals Tests
// ============================================================================

describe('Soft Totals Strategy', () => {
  const rules = { ...VEGAS_STRIP_RULES };
  
  describe('A,2 and A,3 (soft 13-14)', () => {
    it('should hit A,2 vs 2-4 and 7+', () => {
      const hand = makeHand([['A', 'hearts'], ['2', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('2'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('3'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('4'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('7'), rules).optimal).toBe('hit');
    });
    
    it('should double A,2 vs 5-6', () => {
      const hand = makeHand([['A', 'hearts'], ['2', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('5'), rules).optimal).toBe('double');
      expect(getOptimalAction(hand, makeCard('6'), rules).optimal).toBe('double');
    });
  });
  
  describe('A,4 and A,5 (soft 15-16)', () => {
    it('should double A,4 vs 4-6', () => {
      const hand = makeHand([['A', 'hearts'], ['4', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('4'), rules).optimal).toBe('double');
      expect(getOptimalAction(hand, makeCard('5'), rules).optimal).toBe('double');
      expect(getOptimalAction(hand, makeCard('6'), rules).optimal).toBe('double');
    });
    
    it('should hit A,5 vs 2-3 and 7+', () => {
      const hand = makeHand([['A', 'hearts'], ['5', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('2'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('3'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('7'), rules).optimal).toBe('hit');
    });
  });
  
  describe('A,6 (soft 17)', () => {
    it('should double A,6 vs 3-6', () => {
      const hand = makeHand([['A', 'hearts'], ['6', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('3'), rules).optimal).toBe('double');
      expect(getOptimalAction(hand, makeCard('4'), rules).optimal).toBe('double');
      expect(getOptimalAction(hand, makeCard('5'), rules).optimal).toBe('double');
      expect(getOptimalAction(hand, makeCard('6'), rules).optimal).toBe('double');
    });
    
    it('should hit A,6 vs 2 and 7+', () => {
      const hand = makeHand([['A', 'hearts'], ['6', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('2'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('7'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('10'), rules).optimal).toBe('hit');
    });
  });
  
  describe('A,7 (soft 18)', () => {
    it('should double A,7 vs 2-6 (if allowed, else stand for 2-6)', () => {
      const hand = makeHand([['A', 'hearts'], ['7', 'diamonds']]);
      
      // With double available
      expect(getOptimalAction(hand, makeCard('2'), rules).optimal).toBe('double');
      expect(getOptimalAction(hand, makeCard('6'), rules).optimal).toBe('double');
    });
    
    it('should stand A,7 vs 7-8', () => {
      const hand = makeHand([['A', 'hearts'], ['7', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('7'), rules).optimal).toBe('stand');
      expect(getOptimalAction(hand, makeCard('8'), rules).optimal).toBe('stand');
    });
    
    it('should hit A,7 vs 9, 10, A', () => {
      const hand = makeHand([['A', 'hearts'], ['7', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('9'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('10'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('A'), rules).optimal).toBe('hit');
    });
  });
  
  describe('A,8 and A,9 (soft 19-20)', () => {
    it('should stand A,8 vs all except double vs 6', () => {
      const hand = makeHand([['A', 'hearts'], ['8', 'diamonds']]);
      
      // Should double vs 6 if allowed, otherwise stand
      expect(getOptimalAction(hand, makeCard('6'), rules).optimal).toBe('double');
      expect(getOptimalAction(hand, makeCard('2'), rules).optimal).toBe('stand');
      expect(getOptimalAction(hand, makeCard('10'), rules).optimal).toBe('stand');
    });
    
    it('should always stand on A,9', () => {
      const hand = makeHand([['A', 'hearts'], ['9', 'diamonds']]);
      
      for (const dealerRank of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as Rank[]) {
        const result = getOptimalAction(hand, makeCard(dealerRank), rules);
        expect(result.optimal).toBe('stand');
      }
    });
  });
});

// ============================================================================
// Pairs Tests
// ============================================================================

describe('Pairs Strategy', () => {
  const rules = { ...VEGAS_STRIP_RULES }; // DAS allowed
  
  describe('Always split', () => {
    it('should always split Aces', () => {
      const hand = makeHand([['A', 'hearts'], ['A', 'diamonds']]);
      
      for (const dealerRank of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as Rank[]) {
        const result = getOptimalAction(hand, makeCard(dealerRank), rules);
        expect(result.optimal).toBe('split');
      }
    });
    
    it('should always split 8s (except surrender vs A)', () => {
      const hand = makeHand([['8', 'hearts'], ['8', 'diamonds']]);
      
      for (const dealerRank of ['2', '3', '4', '5', '6', '7', '8', '9', '10'] as Rank[]) {
        const result = getOptimalAction(hand, makeCard(dealerRank), rules);
        expect(result.optimal).toBe('split');
      }
      
      // 8,8 vs A: surrender if available, else split
      const vsAce = getOptimalAction(hand, makeCard('A'), rules);
      expect(vsAce.optimal).toBe('surrender');
    });
  });
  
  describe('Never split', () => {
    it('should never split 10s', () => {
      const hand = makeHand([['10', 'hearts'], ['10', 'diamonds']]);
      
      for (const dealerRank of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as Rank[]) {
        const result = getOptimalAction(hand, makeCard(dealerRank), rules);
        expect(result.optimal).toBe('stand');
      }
    });
    
    it('should never split 5s (treat as hard 10)', () => {
      const hand = makeHand([['5', 'hearts'], ['5', 'diamonds']]);
      
      // Should double vs 2-9, hit vs 10/A
      expect(getOptimalAction(hand, makeCard('5'), rules).optimal).toBe('double');
      expect(getOptimalAction(hand, makeCard('10'), rules).optimal).toBe('hit');
    });
  });
  
  describe('Split vs specific dealer cards', () => {
    it('should split 2,2 vs 2-7 with DAS, split vs 4-7 without DAS', () => {
      const hand = makeHand([['2', 'hearts'], ['2', 'diamonds']]);
      
      // With DAS
      expect(getOptimalAction(hand, makeCard('2'), rules).optimal).toBe('split');
      expect(getOptimalAction(hand, makeCard('3'), rules).optimal).toBe('split');
      expect(getOptimalAction(hand, makeCard('7'), rules).optimal).toBe('split');
      expect(getOptimalAction(hand, makeCard('8'), rules).optimal).toBe('hit');
      
      // Without DAS
      const noDasRules = { ...rules, doubleAfterSplit: false };
      expect(getOptimalAction(hand, makeCard('2'), noDasRules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('4'), noDasRules).optimal).toBe('split');
    });
    
    it('should split 9,9 vs 2-6 and 8-9, stand vs 7, 10, A', () => {
      const hand = makeHand([['9', 'hearts'], ['9', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('2'), rules).optimal).toBe('split');
      expect(getOptimalAction(hand, makeCard('6'), rules).optimal).toBe('split');
      expect(getOptimalAction(hand, makeCard('7'), rules).optimal).toBe('stand');
      expect(getOptimalAction(hand, makeCard('8'), rules).optimal).toBe('split');
      expect(getOptimalAction(hand, makeCard('9'), rules).optimal).toBe('split');
      expect(getOptimalAction(hand, makeCard('10'), rules).optimal).toBe('stand');
      expect(getOptimalAction(hand, makeCard('A'), rules).optimal).toBe('stand');
    });
    
    it('should split 4,4 only vs 5-6 with DAS', () => {
      const hand = makeHand([['4', 'hearts'], ['4', 'diamonds']]);
      
      expect(getOptimalAction(hand, makeCard('4'), rules).optimal).toBe('hit');
      expect(getOptimalAction(hand, makeCard('5'), rules).optimal).toBe('split');
      expect(getOptimalAction(hand, makeCard('6'), rules).optimal).toBe('split');
      expect(getOptimalAction(hand, makeCard('7'), rules).optimal).toBe('hit');
      
      // Without DAS, never split 4s
      const noDasRules = { ...rules, doubleAfterSplit: false };
      expect(getOptimalAction(hand, makeCard('5'), noDasRules).optimal).toBe('hit');
    });
  });
});

// ============================================================================
// Rule Variation Tests
// ============================================================================

describe('Rule Variations', () => {
  describe('H17 vs S17', () => {
    it('should have same strategy for most situations', () => {
      const s17Rules = { ...VEGAS_STRIP_RULES }; // S17
      const h17Rules = { ...VEGAS_STRIP_RULES, dealerHitsSoft17: true }; // H17
      
      // Most hard total decisions are the same
      const hand16 = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
      expect(getOptimalAction(hand16, makeCard('5'), s17Rules).optimal)
        .toBe(getOptimalAction(hand16, makeCard('5'), h17Rules).optimal);
    });
  });
  
  describe('Surrender availability', () => {
    it('should hit instead of surrender when surrender not available', () => {
      const noSurrender = { ...VEGAS_STRIP_RULES, surrender: 'none' as const };
      const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
      
      // Without surrender, 16 vs 10 should hit
      expect(getOptimalAction(hand, makeCard('10'), noSurrender).optimal).toBe('hit');
      
      // With late surrender, 16 vs 10 should surrender
      expect(getOptimalAction(hand, makeCard('10'), VEGAS_STRIP_RULES).optimal).toBe('surrender');
    });
  });
  
  describe('Double restrictions', () => {
    it('should hit when double not available but recommended', () => {
      const hand11 = makeHand([['5', 'hearts'], ['6', 'diamonds']]);
      
      // Normal rules: double 11 vs 5
      expect(getOptimalAction(hand11, makeCard('5'), VEGAS_STRIP_RULES).optimal).toBe('double');
      
      // After 3+ cards, can't double
      const threeCardHand = makeHand([['3', 'hearts'], ['3', 'diamonds'], ['5', 'clubs']]);
      const result = getOptimalAction(threeCardHand, makeCard('5'), VEGAS_STRIP_RULES, {
        canHit: true,
        canStand: true,
        canDouble: false, // Can't double after hitting
        canSplit: false,
        canSurrender: false,
      });
      expect(result.optimal).toBe('hit');
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('Helper Functions', () => {
  describe('getDealerUpcardValue', () => {
    it('should return 11 for Ace', () => {
      expect(getDealerUpcardValue(makeCard('A'))).toBe(11);
    });
    
    it('should return 10 for face cards and 10', () => {
      expect(getDealerUpcardValue(makeCard('K'))).toBe(10);
      expect(getDealerUpcardValue(makeCard('Q'))).toBe(10);
      expect(getDealerUpcardValue(makeCard('J'))).toBe(10);
      expect(getDealerUpcardValue(makeCard('10'))).toBe(10);
    });
    
    it('should return numeric value for number cards', () => {
      expect(getDealerUpcardValue(makeCard('2'))).toBe(2);
      expect(getDealerUpcardValue(makeCard('5'))).toBe(5);
      expect(getDealerUpcardValue(makeCard('9'))).toBe(9);
    });
  });
  
  describe('isOptimalAction', () => {
    const rules = VEGAS_STRIP_RULES;
    
    it('should return true for optimal action', () => {
      const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
      // 16 vs 5 should stand
      expect(isOptimalAction('stand', hand, makeCard('5'), rules)).toBe(true);
    });
    
    it('should return false for suboptimal action', () => {
      const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
      // Hitting 16 vs 5 is wrong
      expect(isOptimalAction('hit', hand, makeCard('5'), rules)).toBe(false);
    });
  });
  
  describe('getStrategyCode', () => {
    const rules = VEGAS_STRIP_RULES;
    
    it('should return raw strategy code', () => {
      const hand = makeHand([['10', 'hearts'], ['6', 'diamonds']]);
      
      // 16 vs 9: Rh (surrender or hit)
      expect(getStrategyCode(hand, makeCard('9'), rules)).toBe('Rh');
      
      // 16 vs 5: S (stand)
      expect(getStrategyCode(hand, makeCard('5'), rules)).toBe('S');
    });
  });
});

// ============================================================================
// Matrix Export Tests
// ============================================================================

describe('Matrix Exports', () => {
  it('should export hard totals matrix', () => {
    const matrix = getHardTotalsMatrix(VEGAS_STRIP_RULES);
    
    // Check matrix has all rows (4-20)
    expect(Object.keys(matrix).length).toBeGreaterThanOrEqual(17);
    
    // Check a known value
    expect(matrix[16][10]).toBe('Rh'); // 16 vs 10: surrender or hit
  });
  
  it('should export soft totals matrix', () => {
    const matrix = getSoftTotalsMatrix(VEGAS_STRIP_RULES);
    
    // Check matrix has rows 13-20
    expect(matrix[13]).toBeDefined();
    expect(matrix[20]).toBeDefined();
    
    // Check a known value
    expect(matrix[18][5]).toBe('Ds'); // A,7 vs 5: double or stand
  });
  
  it('should export pairs matrix', () => {
    const matrix = getPairsMatrix(VEGAS_STRIP_RULES);
    
    // Check matrix has all pair values
    expect(matrix[2]).toBeDefined();  // 2,2
    expect(matrix[11]).toBeDefined(); // A,A
    
    // Check a known value
    expect(matrix[8][8]).toBe('P'); // 8,8 vs 8: split
  });
  
  it('should return different matrices for different rules', () => {
    const dasMatrix = getPairsMatrix({ ...VEGAS_STRIP_RULES, doubleAfterSplit: true });
    const noDasMatrix = getPairsMatrix({ ...VEGAS_STRIP_RULES, doubleAfterSplit: false });
    
    // 2,2 vs 2: Ph with DAS, H without DAS
    expect(dasMatrix[2][2]).toBe('Ph');
    expect(noDasMatrix[2][2]).toBe('H');
  });
});
