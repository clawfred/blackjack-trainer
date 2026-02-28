import { describe, it, expect } from 'vitest';
import {
  calculatePayout,
  calculateTotalPayout,
  calculateInsurancePayout,
  getBlackjackMultiplier,
  isWin,
  isLoss,
  isPush,
} from '../../src/engine/payout';
import {
  createHand,
  addCardToHand,
  surrenderHand,
} from '../../src/engine/hand';
import { createCard, Card } from '../../src/types';
import { VEGAS_STRIP_RULES, SINGLE_DECK_RULES } from '../../src/engine/rules';

// Helper to create cards quickly
const card = (rank: string, suit: string = 'hearts'): Card =>
  createCard(rank as any, suit as any);

// Helper to create hand with cards
const makeHand = (cards: string[], bet: number = 100) => {
  let hand = createHand(bet);
  for (const c of cards) {
    hand = addCardToHand(hand, card(c));
  }
  return hand;
};

describe('getBlackjackMultiplier', () => {
  it('returns 1.5 for 3:2 rules', () => {
    expect(getBlackjackMultiplier(VEGAS_STRIP_RULES)).toBe(1.5);
  });

  it('returns 1.2 for 6:5 rules', () => {
    expect(getBlackjackMultiplier(SINGLE_DECK_RULES)).toBe(1.2);
  });
});

describe('calculatePayout', () => {
  describe('surrendered hands', () => {
    it('returns half bet loss on surrender', () => {
      let playerHand = makeHand(['10', '6'], 100);
      playerHand = surrenderHand(playerHand);
      const dealerHand = makeHand(['10', '7']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('surrender');
      expect(result.payout).toBe(-50);
      expect(result.originalBet).toBe(100);
    });
  });

  describe('busted hands', () => {
    it('returns full bet loss on bust', () => {
      const playerHand = makeHand(['K', 'Q', '5'], 100);
      const dealerHand = makeHand(['7', '10']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('bust');
      expect(result.payout).toBe(-100);
    });
  });

  describe('blackjack hands', () => {
    it('pays 1.5x for blackjack with 3:2 rules', () => {
      const playerHand = makeHand(['A', 'K'], 100);
      const dealerHand = makeHand(['7', '10']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('blackjack');
      expect(result.payout).toBe(150);
    });

    it('pays 1.2x for blackjack with 6:5 rules', () => {
      const playerHand = makeHand(['A', 'K'], 100);
      const dealerHand = makeHand(['7', '10']);

      const result = calculatePayout(playerHand, dealerHand, SINGLE_DECK_RULES);

      expect(result.outcome).toBe('blackjack');
      expect(result.payout).toBe(120);
    });

    it('pushes when both have blackjack', () => {
      const playerHand = makeHand(['A', 'K'], 100);
      const dealerHand = makeHand(['A', 'Q']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('push');
      expect(result.payout).toBe(0);
    });

    it('loses to dealer blackjack', () => {
      const playerHand = makeHand(['10', '10'], 100);
      const dealerHand = makeHand(['A', 'K']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('dealer_blackjack');
      expect(result.payout).toBe(-100);
    });
  });

  describe('standard outcomes', () => {
    it('wins when dealer busts', () => {
      const playerHand = makeHand(['10', '5'], 100);
      const dealerHand = makeHand(['10', '6', 'K']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('win');
      expect(result.payout).toBe(100);
    });

    it('wins with higher total', () => {
      const playerHand = makeHand(['10', '10'], 100);
      const dealerHand = makeHand(['10', '9']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('win');
      expect(result.payout).toBe(100);
    });

    it('loses with lower total', () => {
      const playerHand = makeHand(['10', '6'], 100);
      const dealerHand = makeHand(['10', '8']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('lose');
      expect(result.payout).toBe(-100);
    });

    it('pushes on equal totals', () => {
      const playerHand = makeHand(['10', '8'], 100);
      const dealerHand = makeHand(['9', '9']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('push');
      expect(result.payout).toBe(0);
    });
  });

  describe('doubled hands', () => {
    it('pays doubled bet on win', () => {
      let playerHand = makeHand(['5', '6'], 100);
      playerHand = { ...playerHand, bet: 200, isDoubled: true };
      playerHand = addCardToHand(playerHand, card('10')); // 21
      const dealerHand = makeHand(['10', '9']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('win');
      expect(result.payout).toBe(200); // Doubled bet
    });

    it('loses doubled bet on loss', () => {
      let playerHand = makeHand(['5', '6'], 100);
      playerHand = { ...playerHand, bet: 200, isDoubled: true };
      playerHand = addCardToHand(playerHand, card('5')); // 16
      const dealerHand = makeHand(['10', '7']);

      const result = calculatePayout(playerHand, dealerHand, VEGAS_STRIP_RULES);

      expect(result.outcome).toBe('lose');
      expect(result.payout).toBe(-200);
    });
  });
});

describe('calculateTotalPayout', () => {
  it('sums payouts for multiple hands', () => {
    const hand1 = makeHand(['10', '10'], 100); // 20 - wins
    const hand2 = makeHand(['10', '6'], 100); // 16 - loses
    const dealerHand = makeHand(['10', '7']); // 17

    const { results, totalPayout } = calculateTotalPayout(
      [hand1, hand2],
      dealerHand,
      VEGAS_STRIP_RULES
    );

    expect(results).toHaveLength(2);
    expect(results[0].outcome).toBe('win');
    expect(results[1].outcome).toBe('lose');
    expect(totalPayout).toBe(0); // +100 - 100 = 0
  });

  it('handles all wins', () => {
    const hand1 = makeHand(['10', '10'], 100);
    const hand2 = makeHand(['10', '10'], 100);
    const dealerHand = makeHand(['10', '9']);

    const { totalPayout } = calculateTotalPayout(
      [hand1, hand2],
      dealerHand,
      VEGAS_STRIP_RULES
    );

    expect(totalPayout).toBe(200);
  });

  it('handles all losses', () => {
    const hand1 = makeHand(['10', '6'], 100);
    const hand2 = makeHand(['10', '6'], 100);
    const dealerHand = makeHand(['10', '10']);

    const { totalPayout } = calculateTotalPayout(
      [hand1, hand2],
      dealerHand,
      VEGAS_STRIP_RULES
    );

    expect(totalPayout).toBe(-200);
  });
});

describe('calculateInsurancePayout', () => {
  it('pays 2:1 when dealer has blackjack', () => {
    const dealerHand = makeHand(['A', 'K']);

    const result = calculateInsurancePayout(50, dealerHand);

    expect(result.payout).toBe(100); // 2:1
  });

  it('loses insurance when dealer does not have blackjack', () => {
    const dealerHand = makeHand(['A', '9']);

    const result = calculateInsurancePayout(50, dealerHand);

    expect(result.payout).toBe(-50);
  });
});

describe('outcome helpers', () => {
  describe('isWin', () => {
    it('returns true for blackjack and win', () => {
      expect(isWin('blackjack')).toBe(true);
      expect(isWin('win')).toBe(true);
    });

    it('returns false for other outcomes', () => {
      expect(isWin('lose')).toBe(false);
      expect(isWin('push')).toBe(false);
      expect(isWin('bust')).toBe(false);
      expect(isWin('surrender')).toBe(false);
    });
  });

  describe('isLoss', () => {
    it('returns true for lose, bust, dealer_blackjack', () => {
      expect(isLoss('lose')).toBe(true);
      expect(isLoss('bust')).toBe(true);
      expect(isLoss('dealer_blackjack')).toBe(true);
    });

    it('returns false for other outcomes', () => {
      expect(isLoss('win')).toBe(false);
      expect(isLoss('blackjack')).toBe(false);
      expect(isLoss('push')).toBe(false);
    });
  });

  describe('isPush', () => {
    it('returns true for push', () => {
      expect(isPush('push')).toBe(true);
    });

    it('returns false for other outcomes', () => {
      expect(isPush('win')).toBe(false);
      expect(isPush('lose')).toBe(false);
    });
  });
});
