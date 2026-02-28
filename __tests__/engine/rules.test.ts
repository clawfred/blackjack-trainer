import { describe, it, expect } from 'vitest';
import {
  VEGAS_STRIP_RULES,
  DOWNTOWN_VEGAS_RULES,
  SINGLE_DECK_RULES,
  ATLANTIC_CITY_RULES,
  EUROPEAN_RULES,
  RULE_PRESETS,
  getDefaultRules,
  getRulesByPreset,
  createCustomRules,
  validateRules,
} from '../../src/engine/rules';

describe('Rule Presets', () => {
  describe('VEGAS_STRIP_RULES', () => {
    it('has correct configuration', () => {
      expect(VEGAS_STRIP_RULES.numDecks).toBe(6);
      expect(VEGAS_STRIP_RULES.dealerHitsSoft17).toBe(false); // S17
      expect(VEGAS_STRIP_RULES.doubleDownOn).toBe('any');
      expect(VEGAS_STRIP_RULES.doubleAfterSplit).toBe(true);
      expect(VEGAS_STRIP_RULES.surrender).toBe('late');
      expect(VEGAS_STRIP_RULES.blackjackPays).toBe('3:2');
    });
  });

  describe('DOWNTOWN_VEGAS_RULES', () => {
    it('has correct configuration', () => {
      expect(DOWNTOWN_VEGAS_RULES.numDecks).toBe(2);
      expect(DOWNTOWN_VEGAS_RULES.dealerHitsSoft17).toBe(true); // H17
      expect(DOWNTOWN_VEGAS_RULES.surrender).toBe('none');
    });
  });

  describe('SINGLE_DECK_RULES', () => {
    it('has correct configuration', () => {
      expect(SINGLE_DECK_RULES.numDecks).toBe(1);
      expect(SINGLE_DECK_RULES.blackjackPays).toBe('6:5');
      expect(SINGLE_DECK_RULES.doubleAfterSplit).toBe(false);
    });
  });

  describe('ATLANTIC_CITY_RULES', () => {
    it('has correct configuration', () => {
      expect(ATLANTIC_CITY_RULES.numDecks).toBe(8);
      expect(ATLANTIC_CITY_RULES.dealerHitsSoft17).toBe(false); // S17
      expect(ATLANTIC_CITY_RULES.surrender).toBe('late');
    });
  });

  describe('EUROPEAN_RULES', () => {
    it('has correct configuration', () => {
      expect(EUROPEAN_RULES.numDecks).toBe(6);
      expect(EUROPEAN_RULES.doubleDownOn).toBe('9-11');
      expect(EUROPEAN_RULES.doubleAfterSplit).toBe(false);
      expect(EUROPEAN_RULES.insuranceOffered).toBe(false);
    });
  });
});

describe('getDefaultRules', () => {
  it('returns Vegas Strip rules', () => {
    const rules = getDefaultRules();
    expect(rules.numDecks).toBe(6);
    expect(rules.dealerHitsSoft17).toBe(false);
  });

  it('returns a copy (not reference)', () => {
    const rules1 = getDefaultRules();
    const rules2 = getDefaultRules();
    
    rules1.numDecks = 8;
    expect(rules2.numDecks).toBe(6);
  });
});

describe('getRulesByPreset', () => {
  it('returns correct preset', () => {
    const rules = getRulesByPreset('singleDeck');
    expect(rules.numDecks).toBe(1);
    expect(rules.blackjackPays).toBe('6:5');
  });

  it('returns a copy', () => {
    const rules1 = getRulesByPreset('vegasStrip');
    const rules2 = getRulesByPreset('vegasStrip');
    
    rules1.numDecks = 8;
    expect(rules2.numDecks).toBe(6);
  });

  it('covers all presets', () => {
    expect(getRulesByPreset('vegasStrip')).toBeDefined();
    expect(getRulesByPreset('downtownVegas')).toBeDefined();
    expect(getRulesByPreset('singleDeck')).toBeDefined();
    expect(getRulesByPreset('atlanticCity')).toBeDefined();
    expect(getRulesByPreset('european')).toBeDefined();
  });
});

describe('createCustomRules', () => {
  it('merges overrides with base', () => {
    const custom = createCustomRules(VEGAS_STRIP_RULES, {
      dealerHitsSoft17: true,
      blackjackPays: '6:5',
    });

    expect(custom.dealerHitsSoft17).toBe(true);
    expect(custom.blackjackPays).toBe('6:5');
    expect(custom.numDecks).toBe(6); // Unchanged
  });

  it('does not modify original', () => {
    createCustomRules(VEGAS_STRIP_RULES, {
      numDecks: 8,
    });

    expect(VEGAS_STRIP_RULES.numDecks).toBe(6);
  });
});

describe('validateRules', () => {
  it('validates correct rules', () => {
    const result = validateRules(VEGAS_STRIP_RULES);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('catches invalid penetration', () => {
    const rules = { ...VEGAS_STRIP_RULES, penetration: 0.1 };
    const result = validateRules(rules);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Penetration'))).toBe(true);
  });

  it('catches high penetration', () => {
    const rules = { ...VEGAS_STRIP_RULES, penetration: 0.99 };
    const result = validateRules(rules);
    
    expect(result.valid).toBe(false);
  });

  it('catches invalid resplit limit', () => {
    const rules = { ...VEGAS_STRIP_RULES, resplitLimit: 5 as any };
    const result = validateRules(rules);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Resplit'))).toBe(true);
  });

  it('catches conflicting ace rules', () => {
    const rules = { ...VEGAS_STRIP_RULES, resplitLimit: 0, resplitAces: true } as any;
    const result = validateRules(rules);
    
    expect(result.valid).toBe(false);
  });

  it('validates all presets', () => {
    for (const preset of Object.values(RULE_PRESETS)) {
      const result = validateRules(preset);
      expect(result.valid).toBe(true);
    }
  });
});
