/**
 * GameScreen Component
 * Main game screen that composes all game components into a playable blackjack game.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useGameStore } from '../store/gameStore';
import { Hand } from '../components/game/Hand';
import { HandValue } from '../components/game/HandValue';
import { ChipSelector } from '../components/game/ChipSelector';
import { ActionButtons } from '../components/game/ActionButtons';
import { ResultOverlay } from '../components/game/ResultOverlay';
import { GameState } from '../engine/game';
import { evaluateHand, isBlackjack, isBusted } from '../engine/hand';
import { colors, typography, spacing, borderRadius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Deal animation starting point (top of screen, center)
const DEAL_FROM = { x: SCREEN_WIDTH / 2 - 35, y: -150 };

export function GameScreen() {
  const {
    gameContext,
    pendingBet,
    selectedChipValue,
    showDealerHoleCard,
    dealPhase,
    isDealing,
    initGame,
    addToBet,
    clearBet,
    setSelectedChip,
    deal,
    playerAction,
    newRound,
    canHit,
    canStand,
    canDouble,
    canSplit,
    canSurrender,
  } = useGameStore();

  // Initialize game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Early return if game not initialized
  if (!gameContext) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const { state, playerHands, dealerHand, bankroll, activeHandIndex, roundResult } = gameContext;

  // Calculate dealer hand display
  const dealerCards = dealerHand.cards;
  const dealerFaceUp = showDealerHoleCard
    ? true
    : dealerCards.map((_, i) => i === 0); // Only first card face up initially

  // Evaluate dealer's visible value
  let dealerValue: { value: number; isSoft: boolean } | null = null;
  if (dealerCards.length > 0) {
    if (showDealerHoleCard) {
      dealerValue = evaluateHand(dealerHand);
    } else {
      // Only show upcard value
      const upcard = dealerCards[0];
      dealerValue = { value: upcard.value === 1 ? 11 : upcard.value, isSoft: upcard.rank === 'A' };
    }
  }

  // Check dealer blackjack/bust for display
  const dealerHasBJ = dealerCards.length === 2 && isBlackjack(dealerHand) && showDealerHoleCard;
  const dealerIsBusted = showDealerHoleCard && dealerValue !== null && dealerValue.value > 21;

  // Determine which cards to show based on deal phase
  const getDealerVisibleCards = () => {
    if (dealPhase === 'idle') return [];
    if (dealPhase === 'player-card-1') return [];
    if (dealPhase === 'dealer-card-1') return dealerCards.slice(0, 1);
    return dealerCards;
  };

  const getPlayerVisibleCards = (handIndex: number) => {
    if (dealPhase === 'idle') return [];
    const hand = playerHands[handIndex];
    if (!hand) return [];
    
    // During initial deal, show cards progressively
    if (dealPhase === 'player-card-1') return hand.cards.slice(0, 1);
    if (dealPhase === 'dealer-card-1') return hand.cards.slice(0, 1);
    if (dealPhase === 'player-card-2') return hand.cards.slice(0, 2);
    return hand.cards;
  };

  // Render bottom panel based on game state
  const renderBottomPanel = () => {
    if (state === GameState.BETTING) {
      return (
        <ChipSelector
          selectedChip={selectedChipValue}
          onSelectChip={setSelectedChip}
          onAddBet={addToBet}
          currentBet={pendingBet}
          bankroll={bankroll}
          onClearBet={clearBet}
          onDeal={deal}
        />
      );
    }

    if (state === GameState.PLAYER_TURN) {
      return (
        <ActionButtons
          onHit={() => playerAction('hit')}
          onStand={() => playerAction('stand')}
          onDouble={() => playerAction('double')}
          onSplit={() => playerAction('split')}
          onSurrender={() => playerAction('surrender')}
          canHit={canHit()}
          canStand={canStand()}
          canDouble={canDouble()}
          canSplit={canSplit()}
          canSurrender={canSurrender()}
          disabled={isDealing}
        />
      );
    }

    if (state === GameState.DEALING || state === GameState.DEALER_TURN) {
      return (
        <Animated.View
          style={styles.dealerPlayingContainer}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <Text style={styles.dealerPlayingText}>
            {state === GameState.DEALING ? 'Dealing...' : 'Dealer playing...'}
          </Text>
        </Animated.View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Top Bar: Bankroll */}
      <View style={styles.topBar}>
        <View style={styles.bankrollContainer}>
          <Text style={styles.bankrollLabel}>BANKROLL</Text>
          <Text style={styles.bankrollAmount}>${bankroll}</Text>
        </View>
      </View>

      {/* Game Table Area */}
      <View style={styles.tableArea}>
        {/* Dealer Area */}
        <View style={styles.dealerArea}>
          <Text style={styles.playerLabel}>DEALER</Text>
          {dealerCards.length > 0 && dealPhase !== 'idle' && (
            <>
              <Hand
                cards={getDealerVisibleCards()}
                faceUp={dealerFaceUp}
                animate={true}
                dealFrom={DEAL_FROM}
                cardOffset={25}
              />
              {dealPhase === 'complete' && dealerValue && (
                <HandValue
                  value={dealerValue.value}
                  isSoft={dealerValue.isSoft}
                  isBlackjack={dealerHasBJ}
                  isBusted={dealerIsBusted}
                  size="md"
                />
              )}
            </>
          )}
        </View>

        {/* Player Area */}
        <View style={styles.playerArea}>
          <Text style={styles.playerLabel}>PLAYER</Text>
          {playerHands.map((hand, index) => {
            const visibleCards = getPlayerVisibleCards(index);
            const handEval = hand.cards.length > 0 ? evaluateHand(hand) : null;
            const isActive = activeHandIndex === index && state === GameState.PLAYER_TURN;
            const hasMultipleHands = playerHands.length > 1;

            return (
              <View 
                key={`hand-${index}`} 
                style={[
                  styles.handContainer,
                  hasMultipleHands && styles.splitHandContainer,
                  isActive && hasMultipleHands && styles.activeHandContainer,
                ]}
              >
                {hasMultipleHands && (
                  <Text style={[styles.handLabel, isActive && styles.activeHandLabel]}>
                    Hand {index + 1} {isActive ? '(Active)' : ''}
                  </Text>
                )}
                {visibleCards.length > 0 && (
                  <>
                    <Hand
                      cards={visibleCards}
                      faceUp={true}
                      animate={true}
                      dealFrom={DEAL_FROM}
                      cardOffset={25}
                      isActive={isActive}
                    />
                    {dealPhase === 'complete' && handEval && (
                      <HandValue
                        value={handEval.value}
                        isSoft={handEval.isSoft}
                        isBlackjack={isBlackjack(hand)}
                        isBusted={isBusted(hand)}
                        size="md"
                      />
                    )}
                  </>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {renderBottomPanel()}
      </View>

      {/* Result Overlay */}
      {state === GameState.HAND_COMPLETE && roundResult && (
        <ResultOverlay
          result={roundResult}
          onNewHand={newRound}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    marginTop: 100,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
  },
  bankrollContainer: {
    alignItems: 'flex-start',
  },
  bankrollLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bankrollAmount: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.primary,
  },
  tableArea: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  dealerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  handContainer: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  splitHandContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xs,
  },
  activeHandContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  handLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  activeHandLabel: {
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.bold,
  },
  bottomPanel: {
    minHeight: 180,
  },
  dealerPlayingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  dealerPlayingText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
});

export default GameScreen;
