/**
 * Rules Configuration Module
 * Defines configurable rule options and preset configurations for various casino variants.
 */

export interface RulesConfig {
  /** Number of decks in the shoe */
  numDecks: 1 | 2 | 4 | 6 | 8;
  /** Dealer hits on soft 17 (H17 = true, S17 = false) */
  dealerHitsSoft17: boolean;
  /** What hands can double down on */
  doubleDownOn: 'any' | '9-11' | '10-11';
  /** Can double after split */
  doubleAfterSplit: boolean;
  /** Maximum number of times a hand can be split (0 = no resplit) */
  resplitLimit: 0 | 1 | 2 | 3 | 4;
  /** Can resplit aces */
  resplitAces: boolean;
  /** Can hit split aces */
  hitSplitAces: boolean;
  /** Surrender option */
  surrender: 'none' | 'late' | 'early';
  /** Blackjack payout ratio */
  blackjackPays: '3:2' | '6:5';
  /** Insurance is offered when dealer shows ace */
  insuranceOffered: boolean;
  /** Penetration (0.5 to 0.9) - how deep into shoe before shuffle */
  penetration: number;
}

/**
 * Vegas Strip rules - most common 6-deck shoe game
 * Player-friendly: S17, DAS, 3:2 BJ, late surrender
 */
export const VEGAS_STRIP_RULES: RulesConfig = {
  numDecks: 6,
  dealerHitsSoft17: false, // S17
  doubleDownOn: 'any',
  doubleAfterSplit: true,
  resplitLimit: 3,
  resplitAces: false,
  hitSplitAces: false,
  surrender: 'late',
  blackjackPays: '3:2',
  insuranceOffered: true,
  penetration: 0.75,
};

/**
 * Downtown Vegas rules - typically more restrictive
 * H17, often 6:5 on single deck games
 */
export const DOWNTOWN_VEGAS_RULES: RulesConfig = {
  numDecks: 2,
  dealerHitsSoft17: true, // H17
  doubleDownOn: 'any',
  doubleAfterSplit: true,
  resplitLimit: 2,
  resplitAces: false,
  hitSplitAces: false,
  surrender: 'none',
  blackjackPays: '3:2',
  insuranceOffered: true,
  penetration: 0.65,
};

/**
 * Single deck rules - favorable but often 6:5 payout
 */
export const SINGLE_DECK_RULES: RulesConfig = {
  numDecks: 1,
  dealerHitsSoft17: true, // H17
  doubleDownOn: 'any',
  doubleAfterSplit: false,
  resplitLimit: 0,
  resplitAces: false,
  hitSplitAces: false,
  surrender: 'none',
  blackjackPays: '6:5', // Commonly 6:5 for single deck
  insuranceOffered: true,
  penetration: 0.5,
};

/**
 * Atlantic City rules - standardized, player-friendly
 */
export const ATLANTIC_CITY_RULES: RulesConfig = {
  numDecks: 8,
  dealerHitsSoft17: false, // S17
  doubleDownOn: 'any',
  doubleAfterSplit: true,
  resplitLimit: 3,
  resplitAces: false,
  hitSplitAces: false,
  surrender: 'late',
  blackjackPays: '3:2',
  insuranceOffered: true,
  penetration: 0.8,
};

/**
 * European rules - no hole card, more restrictions
 */
export const EUROPEAN_RULES: RulesConfig = {
  numDecks: 6,
  dealerHitsSoft17: false, // S17
  doubleDownOn: '9-11',
  doubleAfterSplit: false,
  resplitLimit: 0,
  resplitAces: false,
  hitSplitAces: false,
  surrender: 'none',
  blackjackPays: '3:2',
  insuranceOffered: false,
  penetration: 0.7,
};

/** Rule presets for easy selection */
export const RULE_PRESETS = {
  vegasStrip: VEGAS_STRIP_RULES,
  downtownVegas: DOWNTOWN_VEGAS_RULES,
  singleDeck: SINGLE_DECK_RULES,
  atlanticCity: ATLANTIC_CITY_RULES,
  european: EUROPEAN_RULES,
} as const;

export type RulePresetName = keyof typeof RULE_PRESETS;

/**
 * Get the default rules configuration (Vegas Strip)
 */
export function getDefaultRules(): RulesConfig {
  return { ...VEGAS_STRIP_RULES };
}

/**
 * Get rules by preset name
 */
export function getRulesByPreset(preset: RulePresetName): RulesConfig {
  return { ...RULE_PRESETS[preset] };
}

/**
 * Create custom rules by merging with a base preset
 */
export function createCustomRules(
  base: RulesConfig,
  overrides: Partial<RulesConfig>
): RulesConfig {
  return { ...base, ...overrides };
}

/**
 * Validate rules configuration
 */
export function validateRules(rules: RulesConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (rules.penetration < 0.3 || rules.penetration > 0.95) {
    errors.push('Penetration must be between 0.3 and 0.95');
  }

  if (rules.resplitLimit < 0 || rules.resplitLimit > 4) {
    errors.push('Resplit limit must be between 0 and 4');
  }

  if (rules.resplitAces && rules.resplitLimit === 0) {
    errors.push('Cannot resplit aces when resplit limit is 0');
  }

  if (rules.hitSplitAces && !rules.resplitAces && rules.resplitLimit === 0) {
    // This is actually fine - hit split aces refers to hitting after initial split
    // Only warn if it's an unusual config
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
