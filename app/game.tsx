/**
 * Game Screen
 * Main blackjack game interface with dealer area, player area, and action buttons.
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, useWindowDimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { colors, typography, spacing, cardDimensions, borderRadius } from '../src/theme';
import { useGameStore } from '../src/store/gameStore';
import { HandValue, ChipSelector, ActionButtons, ResultOverlay } from '../src/components/game';
import { Card as CardComponent } from '../src/components/Card';
import { isBlackjack, evaluateHand } from '../src/engine/hand';

export default function GameScreen() {
  const { width } = useWindowDimensions();
  
  // Game store
  const {
    gameContext,
    dealPhase,
    isDealing,
    showDealerHoleCard,
    pendingBet,
    selectedChipValue,
    initGame,
    addToBet,
    clearBet,
    setSelectedChip,
    deal,
    playerAction,
    newRound,
    getPlayerHand,
    getDealerHand,
    getPlayerHandValue,
    canHit,
    canStand,
    canDouble,
    canSplit,
    canSurrender,
    isPlayerTurn,
    isHandComplete,
    isBetting,
  } = useGameStore();
  
  // Initialize game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);
  
  // Get current state
  const playerHand = getPlayerHand();
  const dealerHand = getDealerHand();
  const playerValue = getPlayerHandValue();
  
  // Calculate dealer display value (only upcard if hole card is hidden)
  const dealerDisplayValue = useMemo(() => {
    if (!dealerHand || dealerHand.cards.length === 0) return null;
    if (showDealerHoleCard) {
      return evaluateHand(dealerHand);
    }
    // Only show upcard value
    const upcard = dealerHand.cards[0];
    if (!upcard) return null;
    return { value: upcard.value === 11 ? 11 : upcard.value, isSoft: upcard.rank === 'A' };
  }, [dealerHand, showDealerHoleCard]);
  
  // Deal position (top right of screen)
  const dealFrom = useMemo(() => ({
    x: width - cardDimensions.width - spacing.xl,
    y: -cardDimensions.height,
  }), [width]);
  
  // Determine which cards to show based on deal phase
  const getDealerCardsToShow = useCallback(() => {
    if (!dealerHand) return [];
    
    switch (dealPhase) {
      case 'idle':
        return [];
      case 'player-card-1':
        return [];
      case 'dealer-card-1':
        return dealerHand.cards.slice(0, 1);
      case 'player-card-2':
        return dealerHand.cards.slice(0, 1);
      case 'dealer-card-2':
      case 'complete':
        return dealerHand.cards;
      default:
        return dealerHand.cards;
    }
  }, [dealerHand, dealPhase]);
  
  const getPlayerCardsToShow = useCallback(() => {
    if (!playerHand) return [];
    
    switch (dealPhase) {
      case 'idle':
        return [];
      case 'player-card-1':
        return playerHand.cards.slice(0, 1);
      case 'dealer-card-1':
        return playerHand.cards.slice(0, 1);
      case 'player-card-2':
      case 'dealer-card-2':
      case 'complete':
        return playerHand.cards;
      default:
        return playerHand.cards;
    }
  }, [playerHand, dealPhase]);
  
  // Dealer face up states (hole card face down until revealed)
  const dealerFaceUp = useMemo(() => {
    const cards = getDealerCardsToShow();
    return cards.map((_, i) => {
      if (i === 1 && !showDealerHoleCard) return false;
      return true;
    });
  }, [getDealerCardsToShow, showDealerHoleCard]);
  
  if (!gameContext) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }
  
  const showBettingUI = isBetting() && !isDealing;
  const showActionButtons = isPlayerTurn() && dealPhase === 'complete';
  const showResult = isHandComplete() && gameContext.roundResult;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <View style={styles.bankrollContainer}>
          <Text style={styles.bankrollLabel}>Bank</Text>
          <Text style={styles.bankrollValue}>
            ${gameContext.bankroll + (pendingBet || 0)}
          </Text>
        </View>
      </View>
      
      {/* Dealer Area */}
      <View style={styles.dealerArea}>
        <Text style={styles.areaLabel}>DEALER</Text>
        
        {getDealerCardsToShow().length > 0 && (
          <Animated.View entering={FadeIn.duration(200)}>
            <View style={styles.handContainer}>
              {getDealerCardsToShow().map((card, index) => (
                <View
                  key={`dealer-${card.rank}-${card.suit}-${index}`}
                  style={[styles.cardSlot, { left: index * 24 }]}
                >
                  <CardComponent
                    card={card}
                    faceUp={dealerFaceUp[index]}
                    dealFrom={dealFrom}
                    dealTo={{ x: 0, y: 0 }}
                    delay={index === 0 ? 200 : 600}
                  />
                </View>
              ))}
            </View>
            
            {dealerDisplayValue && dealPhase === 'complete' && (
              <View style={styles.valueContainer}>
                <HandValue
                  value={dealerDisplayValue.value}
                  isSoft={dealerDisplayValue.isSoft && !showDealerHoleCard}
                  isBlackjack={showDealerHoleCard && dealerHand ? isBlackjack(dealerHand) : false}
                  size="md"
                />
              </View>
            )}
          </Animated.View>
        )}
      </View>
      
      {/* Player Area */}
      <View style={styles.playerArea}>
        <Text style={styles.areaLabel}>PLAYER</Text>
        
        {getPlayerCardsToShow().length > 0 && (
          <Animated.View entering={FadeIn.duration(200)}>
            <View style={styles.handContainer}>
              {getPlayerCardsToShow().map((card, index) => (
                <View
                  key={`player-${card.rank}-${card.suit}-${index}`}
                  style={[styles.cardSlot, { left: index * 24 }]}
                >
                  <CardComponent
                    card={card}
                    faceUp={true}
                    dealFrom={dealFrom}
                    dealTo={{ x: 0, y: 0 }}
                    delay={index === 0 ? 0 : 400}
                  />
                </View>
              ))}
            </View>
            
            {playerValue && dealPhase === 'complete' && (
              <View style={styles.valueContainer}>
                <HandValue
                  value={playerValue.value}
                  isSoft={playerValue.isSoft}
                  isBlackjack={playerHand ? isBlackjack(playerHand) : false}
                  isBusted={playerValue.value > 21}
                  size="md"
                />
              </View>
            )}
          </Animated.View>
        )}
        
        {/* Current bet display during play */}
        {!showBettingUI && gameContext.currentBet > 0 && (
          <View style={styles.currentBetDisplay}>
            <Text style={styles.currentBetText}>
              Bet: ${gameContext.currentBet}
            </Text>
          </View>
        )}
      </View>
      
      {/* Bottom Area */}
      <View style={styles.bottomArea}>
        {showBettingUI && (
          <ChipSelector
            selectedChip={selectedChipValue}
            onSelectChip={setSelectedChip}
            onAddBet={addToBet}
            currentBet={pendingBet}
            bankroll={gameContext.bankroll}
            onClearBet={clearBet}
            onDeal={deal}
          />
        )}
        
        {showActionButtons && (
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
        )}
      </View>
      
      {/* Result Overlay */}
      {showResult && gameContext.roundResult && (
        <ResultOverlay
          result={gameContext.roundResult}
          onNewHand={newRound}
        />
      )}
    </SafeAreaView>
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
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
  },
  bankrollContainer: {
    alignItems: 'flex-end',
  },
  bankrollLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bankrollValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  dealerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  playerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  areaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  handContainer: {
    flexDirection: 'row',
    position: 'relative',
    height: cardDimensions.height,
    minWidth: cardDimensions.width + 48, // Space for 3 cards with offset
  },
  cardSlot: {
    position: 'absolute',
    top: 0,
  },
  valueContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  currentBetDisplay: {
    marginTop: spacing.md,
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  currentBetText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono,
    color: colors.text.secondary,
  },
  bottomArea: {
    minHeight: 200,
  },
});
