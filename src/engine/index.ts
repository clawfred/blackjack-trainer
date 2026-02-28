/**
 * Blackjack Game Engine
 * 
 * Pure TypeScript modules for blackjack game logic.
 * No UI dependencies - can be used in any environment.
 */

// Shoe management
export {
  type Shoe,
  createDeck,
  createShoe,
  shuffleShoe,
  shuffleShoeWithRng,
  dealCard,
  placeCutCard,
  needsShuffle,
  burnCard,
  cardsRemaining,
  cardsDealt,
  getRunningCount,
  getTrueCount,
  resetShoe,
  initializeShoe,
} from './shoe';

// Hand evaluation
export {
  type Hand,
  type HandEvaluation,
  type HandType,
  createHand,
  addCardToHand,
  evaluateHand,
  isBusted,
  isBlackjack,
  isPair,
  getHandType,
  canSplit,
  canDouble,
  canSurrender,
  canHit,
  canStand,
  standHand,
  doubleHand,
  surrenderHand,
  splitHand,
  handToString,
  getDealerUpCardValue,
} from './hand';

// Rules configuration
export {
  type RulesConfig,
  type RulePresetName,
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
} from './rules';

// Payout calculations
export {
  type HandOutcome,
  type PayoutResult,
  getBlackjackMultiplier,
  calculatePayout,
  calculateTotalPayout,
  calculateInsurancePayout,
  isWin,
  isLoss,
  isPush,
  getOriginalBet,
} from './payout';

// Game state machine
export {
  GameState,
  type RoundResult,
  type GameContext,
  type PlayerAction,
  initializeGame,
  placeBet,
  dealInitialCards,
  handleInsurance,
  playerHit,
  playerStand,
  playerDouble,
  playerSplit,
  playerSurrender,
  dealerPlay,
  resolveHand,
  startNewRound,
  getAvailableActions,
  executeAction,
  playRound,
} from './game';
