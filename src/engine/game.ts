/**
 * Game State Machine Module
 * Manages the complete game flow: betting, dealing, player actions, dealer play, and payout.
 */

import { Card } from '../types';
import {
  Shoe,
  createShoe,
  shuffleShoe,
  placeCutCard,
  dealCard,
  burnCard,
  needsShuffle as shoeNeedsShuffle,
} from './shoe';
import {
  Hand,
  createHand,
  addCardToHand,
  evaluateHand,
  isBlackjack,
  isBusted,
  canHit,
  canDouble,
  canSplit,
  canSurrender,
  standHand,
  doubleHand,
  surrenderHand,
  splitHand,
} from './hand';
import { RulesConfig, getDefaultRules } from './rules';
import { calculateTotalPayout, PayoutResult } from './payout';

export enum GameState {
  BETTING = 'BETTING',
  DEALING = 'DEALING',
  INSURANCE_OFFERED = 'INSURANCE_OFFERED',
  PLAYER_TURN = 'PLAYER_TURN',
  DEALER_TURN = 'DEALER_TURN',
  PAYOUT = 'PAYOUT',
  HAND_COMPLETE = 'HAND_COMPLETE',
}

export interface RoundResult {
  /** Outcome for each player hand */
  playerOutcomes: PayoutResult[];
  /** Total net payout across all hands */
  totalPayout: number;
  /** Dealer's final hand */
  dealerFinalValue: number;
  /** Whether dealer busted */
  dealerBusted: boolean;
}

export interface GameContext {
  /** Current game state */
  state: GameState;
  /** The shoe containing cards */
  shoe: Shoe;
  /** Player's hands (array for splits) */
  playerHands: Hand[];
  /** Which hand is currently being played (for splits) */
  activeHandIndex: number;
  /** Dealer's hand */
  dealerHand: Hand;
  /** Current bet amount (for new hands) */
  currentBet: number;
  /** Player's bankroll */
  bankroll: number;
  /** Rules configuration */
  rules: RulesConfig;
  /** Result of the round (set after payout) */
  roundResult: RoundResult | null;
  /** Number of times current hand has been split */
  splitCount: number;
  /** Insurance bet amount (if taken) */
  insuranceBet: number;
  /** Whether insurance was offered this round */
  insuranceOffered: boolean;
}

export type PlayerAction =
  | 'hit'
  | 'stand'
  | 'double'
  | 'split'
  | 'surrender'
  | 'insurance'
  | 'no_insurance';

/**
 * Initialize a new game context
 */
export function initializeGame(
  rules: RulesConfig = getDefaultRules(),
  initialBankroll: number = 1000
): GameContext {
  let shoe = createShoe(rules.numDecks);
  shoe = placeCutCard(shoe, rules.penetration);
  shoe = shuffleShoe(shoe);
  shoe = burnCard(shoe);

  return {
    state: GameState.BETTING,
    shoe,
    playerHands: [],
    activeHandIndex: 0,
    dealerHand: createHand(),
    currentBet: 0,
    bankroll: initialBankroll,
    rules,
    roundResult: null,
    splitCount: 0,
    insuranceBet: 0,
    insuranceOffered: false,
  };
}

/**
 * Place a bet and transition to dealing state
 */
export function placeBet(ctx: GameContext, amount: number): GameContext {
  if (ctx.state !== GameState.BETTING) {
    throw new Error(`Cannot place bet in state: ${ctx.state}`);
  }
  if (amount <= 0) {
    throw new Error('Bet must be positive');
  }
  if (amount > ctx.bankroll) {
    throw new Error('Insufficient bankroll');
  }

  // Check if shoe needs shuffle before new round
  let shoe = ctx.shoe;
  if (shoeNeedsShuffle(shoe)) {
    shoe = shuffleShoe(shoe);
    shoe = burnCard(shoe);
  }

  return {
    ...ctx,
    shoe,
    state: GameState.DEALING,
    currentBet: amount,
    bankroll: ctx.bankroll - amount, // Deduct bet from bankroll
    playerHands: [createHand(amount)],
    dealerHand: createHand(),
    roundResult: null,
    splitCount: 0,
    insuranceBet: 0,
    insuranceOffered: false,
  };
}

/**
 * Deal initial cards (2 to player, 2 to dealer)
 * Player cards face up, dealer has one up and one down
 */
export function dealInitialCards(ctx: GameContext): GameContext {
  if (ctx.state !== GameState.DEALING) {
    throw new Error(`Cannot deal in state: ${ctx.state}`);
  }

  let shoe = ctx.shoe;
  let playerHand = ctx.playerHands[0];
  let dealerHand = ctx.dealerHand;

  // Deal alternating: player, dealer, player, dealer
  let card: Card;

  [card, shoe] = dealCard(shoe);
  playerHand = addCardToHand(playerHand, card);

  [card, shoe] = dealCard(shoe);
  dealerHand = addCardToHand(dealerHand, card);

  [card, shoe] = dealCard(shoe);
  playerHand = addCardToHand(playerHand, card);

  [card, shoe] = dealCard(shoe);
  dealerHand = addCardToHand(dealerHand, card);

  // Determine next state
  let nextState: GameState;

  // Check for player blackjack
  const playerHasBJ = isBlackjack(playerHand);
  const dealerShowsAce = dealerHand.cards[0]?.rank === 'A';
  const dealerHasBJ = isBlackjack(dealerHand);

  if (playerHasBJ && dealerHasBJ) {
    // Both have blackjack - immediate payout (push)
    nextState = GameState.PAYOUT;
  } else if (playerHasBJ) {
    // Player has blackjack - skip to payout (unless dealer shows ace for insurance)
    if (dealerShowsAce && ctx.rules.insuranceOffered) {
      nextState = GameState.INSURANCE_OFFERED;
    } else {
      nextState = GameState.PAYOUT;
    }
  } else if (dealerShowsAce && ctx.rules.insuranceOffered) {
    // Offer insurance when dealer shows ace
    nextState = GameState.INSURANCE_OFFERED;
  } else if (dealerHasBJ) {
    // Dealer blackjack, no insurance offered - immediate loss
    nextState = GameState.PAYOUT;
  } else {
    nextState = GameState.PLAYER_TURN;
  }

  return {
    ...ctx,
    shoe,
    playerHands: [playerHand],
    dealerHand,
    state: nextState,
    insuranceOffered: dealerShowsAce && ctx.rules.insuranceOffered,
  };
}

/**
 * Handle insurance decision
 */
export function handleInsurance(ctx: GameContext, takeInsurance: boolean): GameContext {
  if (ctx.state !== GameState.INSURANCE_OFFERED) {
    throw new Error(`Cannot handle insurance in state: ${ctx.state}`);
  }

  const insuranceBet = takeInsurance ? ctx.currentBet / 2 : 0;
  
  // Deduct insurance bet from bankroll
  const newBankroll = ctx.bankroll - insuranceBet;
  
  // Check for dealer blackjack
  const dealerHasBJ = isBlackjack(ctx.dealerHand);
  const playerHasBJ = isBlackjack(ctx.playerHands[0]);

  // Determine next state
  let nextState: GameState;
  if (dealerHasBJ || playerHasBJ) {
    // Either has blackjack - go to payout
    nextState = GameState.PAYOUT;
  } else {
    // Continue to player turn
    nextState = GameState.PLAYER_TURN;
  }

  return {
    ...ctx,
    insuranceBet,
    bankroll: newBankroll,
    state: nextState,
  };
}

/**
 * Player hits - take another card
 */
export function playerHit(ctx: GameContext): GameContext {
  if (ctx.state !== GameState.PLAYER_TURN) {
    throw new Error(`Cannot hit in state: ${ctx.state}`);
  }

  const activeHand = ctx.playerHands[ctx.activeHandIndex];
  if (!canHit(activeHand, ctx.rules)) {
    throw new Error('Cannot hit this hand');
  }

  let shoe = ctx.shoe;
  let [card, newShoe] = dealCard(shoe);
  const newHand = addCardToHand(activeHand, card);

  const newHands = [...ctx.playerHands];
  newHands[ctx.activeHandIndex] = newHand;

  // Check if busted or if this completes the hand (split aces)
  let newCtx = {
    ...ctx,
    shoe: newShoe,
    playerHands: newHands,
  };

  // Auto-stand if busted or split aces (only get one card)
  if (isBusted(newHand) || (newHand.isSplitAce && !ctx.rules.hitSplitAces)) {
    newCtx = advanceToNextHand(newCtx);
  }

  return newCtx;
}

/**
 * Player stands
 */
export function playerStand(ctx: GameContext): GameContext {
  if (ctx.state !== GameState.PLAYER_TURN) {
    throw new Error(`Cannot stand in state: ${ctx.state}`);
  }

  const activeHand = ctx.playerHands[ctx.activeHandIndex];
  const newHand = standHand(activeHand);

  const newHands = [...ctx.playerHands];
  newHands[ctx.activeHandIndex] = newHand;

  return advanceToNextHand({
    ...ctx,
    playerHands: newHands,
  });
}

/**
 * Player doubles down
 */
export function playerDouble(ctx: GameContext): GameContext {
  if (ctx.state !== GameState.PLAYER_TURN) {
    throw new Error(`Cannot double in state: ${ctx.state}`);
  }

  const activeHand = ctx.playerHands[ctx.activeHandIndex];
  if (!canDouble(activeHand, ctx.rules)) {
    throw new Error('Cannot double this hand');
  }

  // Deduct additional bet
  const additionalBet = activeHand.bet;
  if (additionalBet > ctx.bankroll) {
    throw new Error('Insufficient bankroll to double');
  }

  // Double the bet and deal one card
  let doubledHand = doubleHand(activeHand);
  
  let [card, newShoe] = dealCard(ctx.shoe);
  doubledHand = addCardToHand(doubledHand, card);
  
  // Auto-stand after double
  doubledHand = standHand(doubledHand);

  const newHands = [...ctx.playerHands];
  newHands[ctx.activeHandIndex] = doubledHand;

  return advanceToNextHand({
    ...ctx,
    shoe: newShoe,
    playerHands: newHands,
    bankroll: ctx.bankroll - additionalBet,
  });
}

/**
 * Player splits
 */
export function playerSplit(ctx: GameContext): GameContext {
  if (ctx.state !== GameState.PLAYER_TURN) {
    throw new Error(`Cannot split in state: ${ctx.state}`);
  }

  const activeHand = ctx.playerHands[ctx.activeHandIndex];
  if (!canSplit(activeHand, ctx.rules, ctx.splitCount)) {
    throw new Error('Cannot split this hand');
  }

  // Deduct additional bet for second hand
  const additionalBet = activeHand.bet;
  if (additionalBet > ctx.bankroll) {
    throw new Error('Insufficient bankroll to split');
  }

  const [hand1, hand2] = splitHand(activeHand);

  // Deal one card to each split hand
  let shoe = ctx.shoe;
  let card: Card;

  [card, shoe] = dealCard(shoe);
  const newHand1 = addCardToHand(hand1, card);

  [card, shoe] = dealCard(shoe);
  const newHand2 = addCardToHand(hand2, card);

  // Insert split hands, replacing the original
  const newHands = [...ctx.playerHands];
  newHands.splice(ctx.activeHandIndex, 1, newHand1, newHand2);

  let newCtx: GameContext = {
    ...ctx,
    shoe,
    playerHands: newHands,
    bankroll: ctx.bankroll - additionalBet,
    splitCount: ctx.splitCount + 1,
  };

  // If split aces and can't hit, auto-stand both hands
  if (newHand1.isSplitAce && !ctx.rules.hitSplitAces) {
    // Stand both hands immediately
    newHands[ctx.activeHandIndex] = standHand(newHand1);
    newHands[ctx.activeHandIndex + 1] = standHand(newHand2);
    newCtx = {
      ...newCtx,
      playerHands: newHands,
    };
    // Skip to dealer turn since both hands are stood
    return advanceToNextHand(advanceToNextHand(newCtx));
  }

  return newCtx;
}

/**
 * Player surrenders
 */
export function playerSurrender(ctx: GameContext): GameContext {
  if (ctx.state !== GameState.PLAYER_TURN) {
    throw new Error(`Cannot surrender in state: ${ctx.state}`);
  }

  const activeHand = ctx.playerHands[ctx.activeHandIndex];
  if (!canSurrender(activeHand, ctx.rules)) {
    throw new Error('Cannot surrender this hand');
  }

  const newHand = surrenderHand(activeHand);
  const newHands = [...ctx.playerHands];
  newHands[ctx.activeHandIndex] = newHand;

  // Surrender immediately ends player action
  return advanceToNextHand({
    ...ctx,
    playerHands: newHands,
  });
}

/**
 * Advance to next hand or dealer turn
 */
function advanceToNextHand(ctx: GameContext): GameContext {
  const nextIndex = ctx.activeHandIndex + 1;

  // Check if there are more hands to play
  if (nextIndex < ctx.playerHands.length) {
    const nextHand = ctx.playerHands[nextIndex];
    // Skip if hand is already complete (busted, stood, surrendered)
    if (nextHand.isBusted || nextHand.isStood || nextHand.isSurrendered) {
      return advanceToNextHand({
        ...ctx,
        activeHandIndex: nextIndex,
      });
    }
    return {
      ...ctx,
      activeHandIndex: nextIndex,
    };
  }

  // All player hands complete, check if dealer needs to play
  const allBustedOrSurrendered = ctx.playerHands.every(
    h => h.isBusted || h.isSurrendered
  );

  if (allBustedOrSurrendered) {
    // Skip dealer turn, go straight to payout
    return {
      ...ctx,
      state: GameState.PAYOUT,
    };
  }

  // Dealer needs to play
  return {
    ...ctx,
    state: GameState.DEALER_TURN,
  };
}

/**
 * Dealer plays out their hand according to rules
 */
export function dealerPlay(ctx: GameContext): GameContext {
  if (ctx.state !== GameState.DEALER_TURN) {
    throw new Error(`Cannot play dealer in state: ${ctx.state}`);
  }

  let shoe = ctx.shoe;
  let dealerHand = ctx.dealerHand;

  // Dealer draws until reaching stand threshold
  while (shouldDealerHit(dealerHand, ctx.rules)) {
    let card: Card;
    [card, shoe] = dealCard(shoe);
    dealerHand = addCardToHand(dealerHand, card);
  }

  return {
    ...ctx,
    shoe,
    dealerHand: standHand(dealerHand),
    state: GameState.PAYOUT,
  };
}

/**
 * Determine if dealer should hit based on rules
 */
function shouldDealerHit(hand: Hand, rules: RulesConfig): boolean {
  const { value, isSoft } = evaluateHand(hand);

  // Dealer always stands on 17+ (hard) or 18+ (soft)
  if (value > 17) return false;
  if (value < 17) return true;

  // Value is exactly 17
  if (isSoft) {
    // H17: hit soft 17, S17: stand on soft 17
    return rules.dealerHitsSoft17;
  }

  // Hard 17 - always stand
  return false;
}

/**
 * Resolve the hand and calculate payouts
 */
export function resolveHand(ctx: GameContext): GameContext {
  if (ctx.state !== GameState.PAYOUT) {
    throw new Error(`Cannot resolve in state: ${ctx.state}`);
  }

  const { results, totalPayout } = calculateTotalPayout(
    ctx.playerHands,
    ctx.dealerHand,
    ctx.rules
  );

  // Add insurance payout if applicable
  let insurancePayout = 0;
  if (ctx.insuranceBet > 0) {
    if (isBlackjack(ctx.dealerHand)) {
      insurancePayout = ctx.insuranceBet * 2; // 2:1 payout
    } else {
      insurancePayout = 0; // Already deducted when taking insurance
    }
  }

  const dealerValue = evaluateHand(ctx.dealerHand).value;
  const roundResult: RoundResult = {
    playerOutcomes: results,
    totalPayout: totalPayout + insurancePayout,
    dealerFinalValue: dealerValue,
    dealerBusted: dealerValue > 21,
  };

  // Update bankroll with winnings
  // Note: losses were already deducted when bet was placed
  // Payouts include the original bet back for wins
  const newBankroll = ctx.bankroll + totalPayout + insurancePayout + getTotalBets(ctx);

  return {
    ...ctx,
    bankroll: newBankroll,
    roundResult,
    state: GameState.HAND_COMPLETE,
  };
}

/**
 * Get total bets placed (for bankroll calculation)
 */
function getTotalBets(ctx: GameContext): number {
  return ctx.playerHands.reduce((sum, hand) => sum + hand.bet, 0);
}

/**
 * Start a new round (transition back to betting)
 */
export function startNewRound(ctx: GameContext): GameContext {
  if (ctx.state !== GameState.HAND_COMPLETE) {
    throw new Error(`Cannot start new round in state: ${ctx.state}`);
  }

  return {
    ...ctx,
    state: GameState.BETTING,
    playerHands: [],
    activeHandIndex: 0,
    dealerHand: createHand(),
    currentBet: 0,
    roundResult: null,
    splitCount: 0,
    insuranceBet: 0,
    insuranceOffered: false,
  };
}

/**
 * Get available actions for the current hand
 */
export function getAvailableActions(ctx: GameContext): PlayerAction[] {
  if (ctx.state === GameState.INSURANCE_OFFERED) {
    return ['insurance', 'no_insurance'];
  }

  if (ctx.state !== GameState.PLAYER_TURN) {
    return [];
  }

  const activeHand = ctx.playerHands[ctx.activeHandIndex];
  const actions: PlayerAction[] = [];

  if (canHit(activeHand, ctx.rules)) {
    actions.push('hit');
  }

  // Can always stand if not busted/surrendered
  if (!activeHand.isBusted && !activeHand.isSurrendered) {
    actions.push('stand');
  }

  if (canDouble(activeHand, ctx.rules) && activeHand.bet <= ctx.bankroll) {
    actions.push('double');
  }

  if (canSplit(activeHand, ctx.rules, ctx.splitCount) && activeHand.bet <= ctx.bankroll) {
    actions.push('split');
  }

  if (canSurrender(activeHand, ctx.rules)) {
    actions.push('surrender');
  }

  return actions;
}

/**
 * Execute a player action
 */
export function executeAction(ctx: GameContext, action: PlayerAction): GameContext {
  switch (action) {
    case 'hit':
      return playerHit(ctx);
    case 'stand':
      return playerStand(ctx);
    case 'double':
      return playerDouble(ctx);
    case 'split':
      return playerSplit(ctx);
    case 'surrender':
      return playerSurrender(ctx);
    case 'insurance':
      return handleInsurance(ctx, true);
    case 'no_insurance':
      return handleInsurance(ctx, false);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Play a complete round (for testing/simulation)
 */
export function playRound(
  ctx: GameContext,
  betAmount: number,
  decisionFn: (ctx: GameContext) => PlayerAction
): GameContext {
  // Place bet
  let game = placeBet(ctx, betAmount);
  
  // Deal cards
  game = dealInitialCards(game);
  
  // Handle insurance if offered
  if (game.state === GameState.INSURANCE_OFFERED) {
    const action = decisionFn(game);
    game = executeAction(game, action);
  }
  
  // Player decisions
  while (game.state === GameState.PLAYER_TURN) {
    const action = decisionFn(game);
    game = executeAction(game, action);
  }
  
  // Dealer plays
  if (game.state === GameState.DEALER_TURN) {
    game = dealerPlay(game);
  }
  
  // Resolve and payout
  if (game.state === GameState.PAYOUT) {
    game = resolveHand(game);
  }
  
  return game;
}
