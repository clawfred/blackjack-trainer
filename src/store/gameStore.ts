/**
 * Game State Store
 * Manages all game state using Zustand for the Blackjack Trainer.
 */

import { create } from 'zustand';
import {
  GameContext,
  GameState,
  PlayerAction,
  initializeGame,
  placeBet,
  dealInitialCards,
  executeAction,
  dealerPlay,
  resolveHand,
  startNewRound,
  getAvailableActions,
} from '../engine/game';
import { RulesConfig, getDefaultRules } from '../engine/rules';
import { Card } from '../types';
import { Hand, evaluateHand } from '../engine/hand';

export type DealPhase = 
  | 'idle'
  | 'player-card-1'
  | 'dealer-card-1'
  | 'player-card-2'
  | 'dealer-card-2'
  | 'complete';

export interface GameStore {
  // Core game context
  gameContext: GameContext | null;
  
  // UI-specific state
  dealPhase: DealPhase;
  isDealing: boolean;
  showDealerHoleCard: boolean;
  pendingBet: number;
  
  // Chip selection
  selectedChipValue: number;
  
  // Actions
  initGame: (rules?: RulesConfig, bankroll?: number) => void;
  setBet: (amount: number) => void;
  addToBet: (amount: number) => void;
  clearBet: () => void;
  setSelectedChip: (value: number) => void;
  deal: () => Promise<void>;
  playerAction: (action: PlayerAction) => void;
  playDealerTurn: () => void;
  resolveAndComplete: () => void;
  newRound: () => void;
  
  // Computed getters
  getPlayerHand: () => Hand | null;
  getDealerHand: () => Hand | null;
  getDealerUpcard: () => Card | null;
  getPlayerHandValue: () => { value: number; isSoft: boolean } | null;
  getDealerHandValue: () => { value: number; isSoft: boolean } | null;
  canHit: () => boolean;
  canStand: () => boolean;
  canDouble: () => boolean;
  canSplit: () => boolean;
  canSurrender: () => boolean;
  isPlayerTurn: () => boolean;
  isDealerTurn: () => boolean;
  isHandComplete: () => boolean;
  isBetting: () => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameContext: null,
  dealPhase: 'idle',
  isDealing: false,
  showDealerHoleCard: false,
  pendingBet: 0,
  selectedChipValue: 25,
  
  // Initialize game
  initGame: (rules = getDefaultRules(), bankroll = 1000) => {
    const ctx = initializeGame(rules, bankroll);
    set({ 
      gameContext: ctx,
      dealPhase: 'idle',
      isDealing: false,
      showDealerHoleCard: false,
      pendingBet: 0,
    });
  },
  
  // Set bet amount directly
  setBet: (amount: number) => {
    const { gameContext } = get();
    if (!gameContext || gameContext.state !== GameState.BETTING) return;
    
    const clampedBet = Math.min(amount, gameContext.bankroll);
    set({ pendingBet: clampedBet });
  },
  
  // Add to current bet
  addToBet: (amount: number) => {
    const { gameContext, pendingBet } = get();
    if (!gameContext || gameContext.state !== GameState.BETTING) return;
    
    const newBet = Math.min(pendingBet + amount, gameContext.bankroll);
    set({ pendingBet: newBet });
  },
  
  // Clear bet
  clearBet: () => {
    set({ pendingBet: 0 });
  },
  
  // Set selected chip
  setSelectedChip: (value: number) => {
    set({ selectedChipValue: value });
  },
  
  // Deal cards with staggered animation phases
  deal: async () => {
    const { gameContext, pendingBet } = get();
    if (!gameContext || gameContext.state !== GameState.BETTING) return;
    if (pendingBet <= 0) return;
    
    set({ isDealing: true });
    
    // Place bet and transition to dealing
    let ctx = placeBet(gameContext, pendingBet);
    
    // Deal initial cards
    ctx = dealInitialCards(ctx);
    
    // Set the game context but animate the cards appearing
    set({ 
      gameContext: ctx,
      dealPhase: 'player-card-1',
      pendingBet: 0,
    });
    
    // Stagger the card reveal phases
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    await delay(200);
    set({ dealPhase: 'dealer-card-1' });
    
    await delay(200);
    set({ dealPhase: 'player-card-2' });
    
    await delay(200);
    set({ dealPhase: 'dealer-card-2' });
    
    await delay(200);
    set({ dealPhase: 'complete', isDealing: false });
    
    // If we need to go straight to payout (blackjack), handle it
    const { gameContext: updatedCtx } = get();
    if (updatedCtx && updatedCtx.state === GameState.PAYOUT) {
      set({ showDealerHoleCard: true });
      // Auto resolve after a brief pause
      await delay(500);
      get().resolveAndComplete();
    }
  },
  
  // Execute player action
  playerAction: (action: PlayerAction) => {
    const { gameContext } = get();
    if (!gameContext) return;
    
    try {
      let ctx = executeAction(gameContext, action);
      set({ gameContext: ctx });
      
      // Check if we need to go to dealer turn
      if (ctx.state === GameState.DEALER_TURN) {
        set({ showDealerHoleCard: true });
        // Auto play dealer after brief delay
        setTimeout(() => get().playDealerTurn(), 500);
      }
      
      // Check if we go straight to payout (all hands busted)
      if (ctx.state === GameState.PAYOUT) {
        get().resolveAndComplete();
      }
    } catch (error) {
      console.error('Player action error:', error);
    }
  },
  
  // Play out dealer turn
  playDealerTurn: () => {
    const { gameContext } = get();
    if (!gameContext || gameContext.state !== GameState.DEALER_TURN) return;
    
    const ctx = dealerPlay(gameContext);
    set({ gameContext: ctx });
    
    // Auto resolve
    setTimeout(() => get().resolveAndComplete(), 500);
  },
  
  // Resolve hand and calculate payouts
  resolveAndComplete: () => {
    const { gameContext } = get();
    if (!gameContext || gameContext.state !== GameState.PAYOUT) return;
    
    const ctx = resolveHand(gameContext);
    set({ gameContext: ctx, showDealerHoleCard: true });
  },
  
  // Start new round
  newRound: () => {
    const { gameContext } = get();
    if (!gameContext || gameContext.state !== GameState.HAND_COMPLETE) return;
    
    const ctx = startNewRound(gameContext);
    set({ 
      gameContext: ctx,
      dealPhase: 'idle',
      showDealerHoleCard: false,
    });
  },
  
  // Computed getters
  getPlayerHand: () => {
    const { gameContext } = get();
    if (!gameContext || gameContext.playerHands.length === 0) return null;
    return gameContext.playerHands[gameContext.activeHandIndex];
  },
  
  getDealerHand: () => {
    const { gameContext } = get();
    if (!gameContext) return null;
    return gameContext.dealerHand;
  },
  
  getDealerUpcard: () => {
    const { gameContext } = get();
    if (!gameContext || gameContext.dealerHand.cards.length === 0) return null;
    return gameContext.dealerHand.cards[0];
  },
  
  getPlayerHandValue: () => {
    const hand = get().getPlayerHand();
    if (!hand || hand.cards.length === 0) return null;
    return evaluateHand(hand);
  },
  
  getDealerHandValue: () => {
    const hand = get().getDealerHand();
    if (!hand || hand.cards.length === 0) return null;
    return evaluateHand(hand);
  },
  
  canHit: () => {
    const { gameContext } = get();
    if (!gameContext) return false;
    return getAvailableActions(gameContext).includes('hit');
  },
  
  canStand: () => {
    const { gameContext } = get();
    if (!gameContext) return false;
    return getAvailableActions(gameContext).includes('stand');
  },
  
  canDouble: () => {
    const { gameContext } = get();
    if (!gameContext) return false;
    return getAvailableActions(gameContext).includes('double');
  },
  
  canSplit: () => {
    const { gameContext } = get();
    if (!gameContext) return false;
    return getAvailableActions(gameContext).includes('split');
  },
  
  canSurrender: () => {
    const { gameContext } = get();
    if (!gameContext) return false;
    return getAvailableActions(gameContext).includes('surrender');
  },
  
  isPlayerTurn: () => {
    const { gameContext } = get();
    return gameContext?.state === GameState.PLAYER_TURN;
  },
  
  isDealerTurn: () => {
    const { gameContext } = get();
    return gameContext?.state === GameState.DEALER_TURN;
  },
  
  isHandComplete: () => {
    const { gameContext } = get();
    return gameContext?.state === GameState.HAND_COMPLETE;
  },
  
  isBetting: () => {
    const { gameContext } = get();
    return gameContext?.state === GameState.BETTING;
  },
}));
