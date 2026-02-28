# Blackjack Trainer — Product Requirements Document

**Version:** 1.0  
**Last Updated:** February 27, 2026  
**Author:** Product Manager  
**Status:** Draft for Review

---

## Table of Contents

1. [Vision & Target Users](#1-vision--target-users)
2. [Game Engine Spec](#2-game-engine-spec)
3. [Basic Strategy Engine](#3-basic-strategy-engine)
4. [Scoring System](#4-scoring-system)
5. [Training Mode](#5-training-mode)
6. [Live Mode](#6-live-mode)
7. [Screen Flow & Navigation](#7-screen-flow--navigation)
8. [Design Direction](#8-design-direction)
9. [Animation Spec](#9-animation-spec)
10. [Tech Stack](#10-tech-stack)
11. [Monetization](#11-monetization)
12. [App Store Strategy](#12-app-store-strategy)
13. [MVP Scope & Roadmap](#13-mvp-scope--roadmap)

---

## 1. Vision & Target Users

### 1.1 Product Vision

**Blackjack Trainer** is a premium mobile app that teaches optimal blackjack play through deliberate practice. Unlike casino apps designed to entertain (and often encourage bad habits), this app is a training tool — think "Duolingo for blackjack strategy."

The app transforms blackjack from a game of chance into a skill to be mastered. Users develop muscle memory for basic strategy through repetition, track their improvement over time, and eventually graduate to card counting fundamentals.

### 1.2 Target Users

#### Primary: The Aspiring Advantage Player (70%)
- **Demographics:** 25-45, predominantly male, above-average income
- **Motivation:** Planning Vegas/casino trips, wants to play "correctly" and minimize house edge
- **Behavior:** Researches strategy online, watches YouTube videos, may have printed strategy cards
- **Pain points:** 
  - Existing apps are ugly/cheesy or filled with predatory monetization
  - Hard to practice without risking money
  - No good way to measure improvement
- **Willingness to pay:** Medium-high (values quality tools)

#### Secondary: The Casual Optimizer (20%)
- **Demographics:** 30-50, enjoys card games, occasional casino visitor
- **Motivation:** Wants to not look foolish at the blackjack table, curious about "correct" play
- **Behavior:** Plays blackjack apps casually, may have watched a video or two on strategy
- **Pain points:** Doesn't want to memorize a chart, wants learning to feel like playing
- **Willingness to pay:** Low-medium

#### Tertiary: The Card Counter Trainee (10%)
- **Demographics:** 18-35, mathematically inclined, competitive
- **Motivation:** Wants to gain an actual edge, fascinated by the "beat the casino" narrative
- **Behavior:** Has read books (Beat the Dealer, Blackjack Attack), practices counting
- **Pain points:** Counting practice tools are basic or desktop-only
- **Willingness to pay:** High (serious about the craft)

### 1.3 Competitive Landscape

| App | Strengths | Weaknesses |
|-----|-----------|------------|
| **Blackjack Apprenticeship** | Good training content, counting drills | Dated UI, expensive subscription, overwhelming |
| **Blackjack 21** (various) | Free, popular | Casino-style design, encourages bad play for "fun," no real training |
| **Casino Verite** | Comprehensive, professional | Desktop-only, ugly, steep learning curve |
| **Card Counter Lite** | Basic counting practice | Minimal features, no full game mode |

**Our Opportunity:**
- No app combines beautiful design + serious training + modern mobile UX
- Existing trainers feel like tools, not experiences
- The "premium training app" category (Monkeytype, Chess.com) is unoccupied in blackjack

### 1.4 Success Metrics

| Metric | Target (6mo) |
|--------|--------------|
| Downloads | 50,000 |
| D7 Retention | 25% |
| D30 Retention | 10% |
| App Store Rating | 4.7+ |
| Sessions/DAU | 2.5 |
| Premium Conversion | 5% |

---

## 2. Game Engine Spec

### 2.1 Core Architecture

The game engine runs entirely client-side with no server dependency. All game state, randomness, and logic are computed locally.

```
┌─────────────────────────────────────────────────┐
│                   Game Engine                    │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │    Shoe     │  │   Hand      │  │ Scoring  │ │
│  │  Manager    │  │  Evaluator  │  │  Engine  │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │   Rules     │  │  Strategy   │  │ Counting │ │
│  │   Config    │  │   Oracle    │  │  Tracker │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────┘
```

### 2.2 Configurable Rules

All rules are configurable in Settings. Defaults match most common Vegas Strip rules.

| Rule | Options | Default |
|------|---------|---------|
| Number of decks | 1, 2, 4, 6, 8 | 6 |
| Dealer soft 17 | Hits (H17) / Stands (S17) | S17 |
| Double down | Any two cards / 9-11 only / 10-11 only | Any two |
| Double after split (DAS) | Yes / No | Yes |
| Resplit | No / Up to 2 / Up to 3 / Up to 4 | Up to 3 |
| Resplit Aces | Yes / No | No |
| Hit split Aces | Yes / No | No |
| Surrender | None / Late / Early | Late |
| Blackjack pays | 3:2 / 6:5 | 3:2 |
| Insurance | Offered / Not offered | Offered |
| Penetration | 50% - 90% (slider) | 75% |

**Rule Presets:**
- "Vegas Strip" (6D, S17, DAS, Late Surrender, 3:2)
- "Downtown Vegas" (2D, H17, DAS, Late Surrender, 3:2)  
- "6:5 Trap" (6D, H17, 6:5 — teaches users to avoid these tables)
- "Single Deck" (1D, H17, No DAS, No Surrender, 3:2)
- "Custom" (full control)

### 2.3 Card & Deck Representation

```typescript
type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  rank: Rank;
  suit: Suit;
  value: number;        // 1-11 for Ace, 2-10 for numerics, 10 for face cards
  countValue: number;   // Hi-Lo: +1 (2-6), 0 (7-9), -1 (10-A)
}

interface Shoe {
  cards: Card[];
  dealtCards: Card[];
  cutCardPosition: number;
  needsShuffle: boolean;
}
```

### 2.4 Shoe Management

- **Initialization:** Generate `numDecks × 52` cards, shuffle using Fisher-Yates
- **Cut card:** Placed at `penetration%` depth (e.g., 75% of 312 cards = card 234)
- **Shuffle trigger:** When cut card is reached, complete current round, then shuffle
- **Burn card:** First card burned after shuffle (not shown to player)
- **Card counting:** Running count and true count updated after each card dealt

```typescript
function calculateTrueCount(runningCount: number, shoe: Shoe): number {
  const remainingCards = shoe.cards.length;
  const remainingDecks = remainingCards / 52;
  return runningCount / remainingDecks;
}
```

### 2.5 Hand Evaluation

```typescript
interface Hand {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isSplit: boolean;
  isSurrendered: boolean;
  isBlackjack: boolean;
  isBusted: boolean;
  isStood: boolean;
}

function evaluateHand(hand: Hand): { value: number; isSoft: boolean } {
  let value = 0;
  let aces = 0;
  
  for (const card of hand.cards) {
    if (card.rank === 'A') {
      aces++;
      value += 11;
    } else {
      value += card.value;
    }
  }
  
  // Reduce aces from 11 to 1 as needed
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return {
    value,
    isSoft: aces > 0 && value <= 21
  };
}
```

### 2.6 Game Flow State Machine

```
BETTING → DEALING → PLAYER_TURN → DEALER_TURN → PAYOUT → BETTING
                          ↓
                    (if split)
                    SPLIT_HAND
```

**Detailed States:**

1. **BETTING**: Player selects bet amount, shoe shuffled if needed
2. **DEALING**: Two cards to player, two to dealer (one face down)
3. **INSURANCE_OFFERED**: If dealer shows Ace (optional based on settings)
4. **PLAYER_TURN**: Player makes decisions (Hit/Stand/Double/Split/Surrender)
5. **SPLIT_HAND**: If split, play each hand sequentially
6. **DEALER_TURN**: Dealer reveals hole card, hits until 17+ (or soft 17 based on rules)
7. **PAYOUT**: Calculate results, update bankroll, record decision accuracy
8. **HAND_COMPLETE**: Show results, transition to next hand

### 2.7 Payout Logic

| Outcome | Payout |
|---------|--------|
| Player Blackjack | 3:2 (or 6:5 if configured) |
| Player Wins | 1:1 |
| Push | 0 (bet returned) |
| Player Loses | -1 (bet lost) |
| Player Surrenders | -0.5 (half bet returned) |
| Insurance (dealer BJ) | 2:1 on insurance bet |
| Insurance (no dealer BJ) | Insurance bet lost |
| Doubled hand wins | 2:1 (on doubled bet) |

---

## 3. Basic Strategy Engine

### 3.1 Strategy Matrix

The strategy engine stores the mathematically optimal decision for every possible combination of:
- Player hand type (hard total, soft total, or pair)
- Player hand value
- Dealer upcard

**Encoding:**
- `H` = Hit
- `S` = Stand  
- `D` = Double (if allowed, else Hit)
- `Ds` = Double (if allowed, else Stand)
- `P` = Split
- `Ph` = Split if DAS allowed, else Hit
- `Rh` = Surrender if allowed, else Hit
- `Rs` = Surrender if allowed, else Stand
- `Rp` = Surrender if allowed, else Split

### 3.2 Hard Totals (Default S17, DAS)

| Player | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | A |
|--------|---|---|---|---|---|---|---|---|-----|---|
| 5-8 | H | H | H | H | H | H | H | H | H | H |
| 9 | H | D | D | D | D | H | H | H | H | H |
| 10 | D | D | D | D | D | D | D | D | H | H |
| 11 | D | D | D | D | D | D | D | D | D | D |
| 12 | H | H | S | S | S | H | H | H | H | H |
| 13 | S | S | S | S | S | H | H | H | H | H |
| 14 | S | S | S | S | S | H | H | H | H | H |
| 15 | S | S | S | S | S | H | H | H | Rh | Rh |
| 16 | S | S | S | S | S | H | H | Rh | Rh | Rh |
| 17+ | S | S | S | S | S | S | S | S | S | Rs |

### 3.3 Soft Totals

| Player | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | A |
|--------|---|---|---|---|---|---|---|---|-----|---|
| A,2 | H | H | H | D | D | H | H | H | H | H |
| A,3 | H | H | H | D | D | H | H | H | H | H |
| A,4 | H | H | D | D | D | H | H | H | H | H |
| A,5 | H | H | D | D | D | H | H | H | H | H |
| A,6 | H | D | D | D | D | H | H | H | H | H |
| A,7 | Ds| Ds| Ds| Ds| Ds| S | S | H | H | H |
| A,8 | S | S | S | S | Ds| S | S | S | S | S |
| A,9 | S | S | S | S | S | S | S | S | S | S |

### 3.4 Pairs

| Player | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | A |
|--------|---|---|---|---|---|---|---|---|-----|---|
| 2,2 | Ph| Ph| P | P | P | P | H | H | H | H |
| 3,3 | Ph| Ph| P | P | P | P | H | H | H | H |
| 4,4 | H | H | H | Ph| Ph| H | H | H | H | H |
| 5,5 | D | D | D | D | D | D | D | D | H | H |
| 6,6 | Ph| P | P | P | P | H | H | H | H | H |
| 7,7 | P | P | P | P | P | P | H | H | H | H |
| 8,8 | P | P | P | P | P | P | P | P | P | Rp |
| 9,9 | P | P | P | P | P | S | P | P | S | S |
| 10,10| S | S | S | S | S | S | S | S | S | S |
| A,A | P | P | P | P | P | P | P | P | P | P |

### 3.5 Strategy Lookup

```typescript
interface StrategyLookup {
  getOptimalAction(
    playerHand: Hand,
    dealerUpcard: Card,
    rules: RulesConfig,
    availableActions: Action[]
  ): {
    optimal: Action;
    ev: Record<Action, number>;  // EV for each possible action
  };
}
```

The strategy engine adjusts recommendations based on:
- Current rules configuration (H17 vs S17 changes some decisions)
- Available actions (can't double if not offered, can't split non-pairs)
- Number of decks (minor adjustments for single deck)

### 3.6 EV Calculation

For Training Mode, each decision shows expected value:

```typescript
// Example: Player 11 vs Dealer 6
{
  Double: +0.67,  // Best action (67% expected profit)
  Hit: +0.54,
  Stand: +0.29
}
```

EV data is pre-computed and stored for common scenarios, with real-time calculation for edge cases.

### 3.7 Deviation Index (Card Counting)

For advanced users, track index plays — situations where the true count changes the optimal decision:

| Situation | Basic Strategy | Deviation | True Count Threshold |
|-----------|---------------|-----------|---------------------|
| 16 vs 10 | Hit | Stand | +0 or higher |
| 15 vs 10 | Hit | Stand | +4 or higher |
| 12 vs 3 | Hit | Stand | +2 or higher |
| 12 vs 2 | Hit | Stand | +3 or higher |
| 10 vs 10 | Hit | Double | +4 or higher |
| Insurance | Never | Take | +3 or higher |

These are shown in advanced Training Mode only.

---

## 4. Scoring System

### 4.1 Per-Decision Scoring

Every player decision is evaluated against the optimal strategy:

| Rating | Criteria | Points Impact |
|--------|----------|---------------|
| ✅ **Optimal** | Matches basic strategy exactly | +10 |
| ⚠️ **Suboptimal** | Second-best EV choice (within 5% of optimal) | +5 |
| ❌ **Mistake** | Significantly worse EV (>5% suboptimal) | +0 |
| 💀 **Critical Error** | Catastrophic decision (standing on 8, hitting hard 19) | -5 |

**Severity Weighting:**
Some mistakes matter more than others. The scoring accounts for EV cost:

```typescript
function calculateDecisionScore(
  playerAction: Action,
  optimalAction: Action,
  evMap: Record<Action, number>
): { rating: Rating; points: number; evCost: number } {
  const optimalEV = evMap[optimalAction];
  const actualEV = evMap[playerAction];
  const evCost = optimalEV - actualEV;
  
  if (playerAction === optimalAction) {
    return { rating: 'optimal', points: 10, evCost: 0 };
  } else if (evCost < 0.05) {
    return { rating: 'suboptimal', points: 5, evCost };
  } else if (evCost < 0.20) {
    return { rating: 'mistake', points: 0, evCost };
  } else {
    return { rating: 'critical', points: -5, evCost };
  }
}
```

### 4.2 Session Scoring

After each session, calculate:

| Metric | Calculation |
|--------|-------------|
| **Accuracy %** | (Optimal decisions / Total decisions) × 100 |
| **Score** | Sum of all decision points |
| **Chip P&L** | Ending bankroll - Starting bankroll |
| **EV Cost** | Sum of all EV lost to mistakes |
| **Hands Played** | Total number of hands |
| **Decisions Made** | Total decisions (can be >1 per hand with splits) |

**Session Grades:**
- **A+ (95-100%):** Perfect or near-perfect play
- **A (90-94%):** Excellent, minor slips
- **B (80-89%):** Good, room to improve
- **C (70-79%):** Needs practice
- **D (60-69%):** Significant mistakes
- **F (<60%):** Back to basics

### 4.3 Lifetime Stats

Persistent statistics tracked across all sessions:

```typescript
interface LifetimeStats {
  // Volume
  totalHands: number;
  totalSessions: number;
  totalPlayTime: number;  // minutes
  
  // Accuracy
  overallAccuracy: number;
  accuracyByCategory: {
    hardTotals: number;
    softTotals: number;
    pairs: number;
    doubles: number;
    splits: number;
    surrenders: number;
  };
  
  // Trends
  accuracyHistory: { date: string; accuracy: number }[];  // Last 30 days
  currentStreak: number;  // Consecutive optimal decisions
  bestStreak: number;
  
  // Bankroll
  totalChipsWon: number;
  totalChipsLost: number;
  biggestWin: number;
  biggestLoss: number;
  
  // Milestones
  milestonesUnlocked: Milestone[];
  currentRating: Rating;
}
```

### 4.4 Rating System

Progressive skill ratings based on lifetime performance:

| Rating | Icon | Requirements |
|--------|------|--------------|
| **Beginner** | 🃏 | Default starting rank |
| **Bronze** | 🥉 | 500+ hands, 70%+ accuracy |
| **Silver** | 🥈 | 2,000+ hands, 80%+ accuracy |
| **Gold** | 🥇 | 5,000+ hands, 90%+ accuracy |
| **Diamond** | 💎 | 10,000+ hands, 95%+ accuracy |
| **Card Counter** | 🧠 | 20,000+ hands, 97%+ accuracy, counting mode completed |

### 4.5 Milestones & Achievements

Gamification through meaningful achievements:

| Milestone | Criteria |
|-----------|----------|
| First Steps | Complete your first session |
| Century | Play 100 hands |
| Perfect Session | 100% accuracy in a 20+ hand session |
| Hard Totals Mastery | 95%+ accuracy on hard totals over 500 hands |
| Double Down Expert | 95%+ accuracy on double decisions over 200 decisions |
| Split Personality | 95%+ accuracy on split decisions over 200 decisions |
| Soft Touch | 95%+ accuracy on soft totals over 300 hands |
| On a Roll | 50 consecutive optimal decisions |
| Marathon | Play for 2 hours in a single day |
| Consistent | Play at least one session for 7 consecutive days |
| High Roller | Win 10,000 virtual chips in one session |
| Comeback Kid | Recover from -5,000 chips to positive in one session |

### 4.6 Home Screen Dashboard

The home screen shows a personalized progress dashboard:

```
┌─────────────────────────────────────────┐
│  Good evening, Player                   │
│  Rating: 🥈 Silver                      │
├─────────────────────────────────────────┤
│  TODAY'S PROGRESS                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  124    │  │  87%    │  │ +2,450  │  │
│  │  hands  │  │ accuracy│  │  chips  │  │
│  └─────────┘  └─────────┘  └─────────┘  │
├─────────────────────────────────────────┤
│  ACCURACY TREND (7 days)                │
│  ▁▂▄▅▆▇█ ← Getting better!             │
├─────────────────────────────────────────┤
│  AREAS TO IMPROVE                       │
│  ⚠️ Soft 17 vs dealer 2 (60% accuracy) │
│  ⚠️ Pair splitting decisions (72%)     │
├─────────────────────────────────────────┤
│  [🎯 Training Mode]  [🎰 Live Mode]     │
└─────────────────────────────────────────┘
```

---

## 5. Training Mode

### 5.1 Overview

Training Mode is the core learning experience. It provides real-time guidance to build muscle memory for basic strategy. Every setting is independently configurable.

### 5.2 Training Features

#### Strategy Chart Overlay
- **Toggle:** On/Off
- **Behavior:** Shows a mini strategy chart in the corner of the screen
- **Highlights:** Current situation is highlighted on the chart
- **Tap to expand:** Full chart view with detailed legend

#### Recommended Action
- **Toggle:** On/Off
- **Behavior:** Displays the optimal action before player decides
- **Display:** "Recommended: DOUBLE" with action button highlighted
- **Can be set to:** Show immediately / Show after 3 seconds / Show on tap

#### EV Breakdown
- **Toggle:** On/Off
- **Behavior:** Shows expected value for each available action
- **Display:** 
  ```
  Hit: +0.23  |  Stand: -0.12  |  Double: +0.45 ✓
  ```
- **Color coding:** Best action in green, worst in red

#### Mistake Explanation
- **Toggle:** On/Off (default On)
- **Behavior:** When player makes suboptimal decision, shows why it was wrong
- **Display:** "Standing here loses 0.18 more on average. Hitting is better because..."

#### Card Counting Trainer
- **Toggle:** On/Off
- **When on, shows:**
  - Running count (updates with each card)
  - True count (running count / decks remaining)
  - Suggested bet size based on count
  - Deviation alerts when count changes optimal play

### 5.3 Card Counting Sub-Features

```
┌─────────────────────────────────────────┐
│  Running Count: +7                      │
│  True Count: +3.5                       │
│  Decks Remaining: 2.0                   │
├─────────────────────────────────────────┤
│  Bet Suggestion: 4 units (high count)   │
├─────────────────────────────────────────┤
│  ⚡ Deviation Alert!                    │
│  Insurance is +EV at this count         │
└─────────────────────────────────────────┘
```

**Counting Display Modes:**
1. **Full display:** All counting info visible (for learning)
2. **Count only:** Just the running count (practice keeping count)
3. **Hidden count:** User must track count mentally, shown on reveal

**Counting Practice Drill:**
- Flash cards rapidly (0.5s each)
- Player inputs running count
- Feedback on accuracy

### 5.4 Progressive Difficulty

New players start with simplified training that unlocks complexity over time:

| Level | Unlocked Features | Unlock Criteria |
|-------|------------------|-----------------|
| 1. Basics | Hard totals only (12-16 vs low/high) | Start |
| 2. Expand | All hard totals | 100 hands, 75%+ accuracy |
| 3. Soft | Soft totals introduced | 200 hands, 80%+ accuracy |
| 4. Pairs | Splitting decisions | 400 hands, 80%+ accuracy |
| 5. Double | Doubling strategy focus | 600 hands, 85%+ accuracy |
| 6. Surrender | Late surrender situations | 800 hands, 85%+ accuracy |
| 7. Counting | Card counting mode unlocked | 1,000 hands, 90%+ accuracy |
| 8. Master | Index plays and deviations | Complete counting fundamentals |

**Skip option:** Users can unlock all levels immediately in Settings if they prefer.

### 5.5 Practice Drills

Focused practice on specific scenarios:

- **Hard Totals Drill:** Only hard total situations
- **Soft Totals Drill:** Only soft hands
- **Pair Drill:** Only pair splitting decisions
- **Dealer Ace Drill:** Only dealer Ace upcard situations
- **Stiff Hands Drill:** Only 12-16 vs dealer 7-A (hardest decisions)
- **Counting Drill:** Rapid card flashing for count practice

Each drill tracks separate accuracy stats.

---

## 6. Live Mode

### 6.1 Overview

Live Mode is the test. No hints, no guidance — just you against the dealer. Make your decisions, and get a detailed breakdown after each session.

### 6.2 During Gameplay

- Clean, uncluttered interface
- No strategy hints
- No EV display
- No count display (even if normally trained with counting)
- Standard betting and action buttons only
- Session stats minimized (hands played, current bankroll only)

### 6.3 Post-Session Review

After ending a Live Mode session, users see a comprehensive review:

```
┌─────────────────────────────────────────┐
│  SESSION COMPLETE                       │
│                                         │
│  Grade: B+ (84% accuracy)               │
│  Hands: 47  |  P&L: +1,250 chips        │
│  Time: 18 minutes                       │
├─────────────────────────────────────────┤
│  DECISION BREAKDOWN                     │
│  ✅ 38 Optimal                          │
│  ⚠️ 5 Suboptimal                        │
│  ❌ 4 Mistakes                          │
├─────────────────────────────────────────┤
│  [View All Hands] [Share] [Play Again]  │
└─────────────────────────────────────────┘
```

### 6.4 Hand-by-Hand Breakdown

Tapping "View All Hands" shows:

```
┌─────────────────────────────────────────┐
│  Hand #23                               │
│                                         │
│  Your hand: 9♠ 7♥ (16)                  │
│  Dealer: 10♦                            │
│                                         │
│  Your decision: Stand  ❌               │
│  Optimal play: Hit                      │
│                                         │
│  Why: Against a dealer 10, standing on  │
│  16 loses 54% of the time. Hitting      │
│  loses 53%. Small edge, but it adds up. │
│  EV cost: -0.01                         │
├─────────────────────────────────────────┤
│  [← Previous]  Hand 23/47  [Next →]     │
└─────────────────────────────────────────┘
```

**Color coding:**
- 🟢 Green border: Optimal decision
- 🟡 Yellow border: Suboptimal (minor)
- 🔴 Red border: Mistake

**Filter options:**
- All hands
- Mistakes only
- Suboptimal + Mistakes
- By hand type (hard/soft/pairs)

### 6.5 Session History

All Live Mode sessions are saved and reviewable:

```
┌─────────────────────────────────────────┐
│  SESSION HISTORY                        │
├─────────────────────────────────────────┤
│  Today                                  │
│  └─ 2:34 PM — 47 hands, 84%, +1,250     │
│                                         │
│  Yesterday                              │
│  └─ 8:12 PM — 93 hands, 91%, +4,200     │
│  └─ 6:45 PM — 31 hands, 77%, -2,100     │
│                                         │
│  Feb 25                                 │
│  └─ 10:01 PM — 112 hands, 89%, +3,400   │
└─────────────────────────────────────────┘
```

---

## 7. Screen Flow & Navigation

### 7.1 App Structure

```
┌─────────────────────────────────────────┐
│                                         │
│              HOME (Tab 1)               │
│         Dashboard + Play buttons        │
│                   │                     │
│       ┌───────────┴───────────┐         │
│       │                       │         │
│   Training Mode          Live Mode      │
│       │                       │         │
│   Game Screen            Game Screen    │
│       │                       │         │
│   Instant feedback       Clean play    │
│       │                       │         │
│   End Session            End Session    │
│       │                       │         │
│   Quick Stats            Full Review    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│              STATS (Tab 2)              │
│      Lifetime stats, history, trends    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│             LEARN (Tab 3)               │
│    Strategy charts, tutorials, drills   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│            SETTINGS (Tab 4)             │
│    Rules, training toggles, app config  │
│                                         │
└─────────────────────────────────────────┘
```

### 7.2 Tab Bar

Four main tabs, always visible:

| Tab | Icon | Screen |
|-----|------|--------|
| Home | 🏠 | Dashboard, quick play access |
| Stats | 📊 | Lifetime stats, session history, trends |
| Learn | 📖 | Strategy charts, tutorials, drills |
| Settings | ⚙️ | Rules config, training toggles, app settings |

### 7.3 Navigation Flow

**Happy Path (Training):**
```
Home → Tap "Training Mode" → Configure (optional) → Game → 
→ Play hands (with feedback) → End Session → Quick Stats → Home
```

**Happy Path (Live):**
```
Home → Tap "Live Mode" → Game → Play hands → End Session → 
→ Review Screen → Hand-by-Hand (optional) → Home
```

**Settings:**
```
Settings Tab → Rules Config → Save → Back
Settings Tab → Training Toggles → Toggle options → Back
Settings Tab → Theme/Preferences → Adjust → Back
```

### 7.4 Key Screens

1. **Home Dashboard** — Personalized stats, quick play buttons, daily challenge
2. **Game Screen** — Main gameplay interface (cards, chips, action buttons)
3. **Training Config** — Toggle overlay/hints before starting (slide-up sheet)
4. **Live Review** — Post-session breakdown with hand-by-hand access
5. **Stats Overview** — Charts, trends, lifetime numbers
6. **Session Detail** — Individual session drill-down
7. **Learn Hub** — Strategy charts, tutorials, practice drills
8. **Settings** — All configuration options

---

## 8. Design Direction

### 8.1 Design Philosophy

**The app should feel like a premium training tool, not a casino.**

Think: the difference between a chess training app and a "fun casino slots" app. We're the former.

**Key principles:**
- **Minimal:** Every element earns its place
- **Dark:** Easy on the eyes, feels focused
- **Premium:** Quality interactions, no cheap animations
- **Tactile:** Haptics and physics make it feel real
- **Readable:** Clear typography, accessibility-first

### 8.2 Anti-Patterns (What We're NOT)

❌ Neon glows and Vegas lights
❌ Skeuomorphic felt tables with wood grain
❌ Flashy "YOU WIN!" celebrations
❌ Slot machine energy
❌ Cheesy casino sound effects
❌ Cluttered interfaces
❌ Banner ads during gameplay
❌ Aggressive monetization popups

### 8.3 Reference Apps

| App | What to Learn |
|-----|---------------|
| **Monkeytype** | Dark minimal UI, focus mode, clean stats |
| **Chess.com (mobile)** | Clean dark theme, card-based layouts, gamification without cheese |
| **Duolingo** | Progressive learning, streaks, satisfying feedback (but less playful) |
| **Things 3** | Premium feel, attention to detail, haptics |
| **Linear** | Clean dark UI, typography, whitespace |

### 8.4 Color Palette

```
Background:
- Primary: #0D0D0F (near black)
- Secondary: #1A1A1D (cards, containers)
- Elevated: #252528 (modals, sheets)

Text:
- Primary: #FFFFFF (headings)
- Secondary: #A0A0A5 (body)
- Muted: #606065 (hints)

Cards:
- Card face: #FAFAF8 (cream white)
- Card back: #1E3A5F (deep navy)
- Suits: #E63946 (hearts/diamonds), #1D1D1F (clubs/spades)

Actions:
- Hit: #4ADE80 (green)
- Stand: #FACC15 (yellow)
- Double: #60A5FA (blue)
- Split: #F472B6 (pink)
- Surrender: #A78BFA (purple)

Feedback:
- Success: #22C55E (green)
- Warning: #EAB308 (yellow)
- Error: #EF4444 (red)
- Info: #3B82F6 (blue)

Accents:
- Primary accent: #6366F1 (indigo)
- Gold: #F59E0B (achievements)
```

### 8.5 Typography

```
Font Family: SF Pro (iOS system font)

Headers:
- H1: SF Pro Display Bold, 32px
- H2: SF Pro Display Semibold, 24px  
- H3: SF Pro Text Semibold, 20px

Body:
- Body: SF Pro Text Regular, 16px
- Body Small: SF Pro Text Regular, 14px
- Caption: SF Pro Text Regular, 12px

Numbers:
- Large stats: SF Pro Rounded Bold, 48px
- Medium stats: SF Pro Rounded Semibold, 24px
- Card values: SF Pro Rounded Bold, 28px

Spacing:
- Letter spacing: Default (slightly tighter for headers)
- Line height: 1.5 for body, 1.2 for headers
```

### 8.6 Cards Design

```
Card dimensions: 70 × 100 pt (2.5:3.5 ratio)
Corner radius: 8pt
Border: 1pt stroke, #00000010

Face:
- White/cream background (#FAFAF8)
- Rank: top-left and bottom-right corners
- Suit: colored pips centered
- Large center pip for visual clarity

Back:
- Solid deep navy (#1E3A5F)
- Subtle geometric pattern (optional)
- Centered logo/icon

Shadows:
- Active cards: 0 4px 12px rgba(0,0,0,0.4)
- Stack depth: Each card offset 1pt down, 1pt right
```

### 8.7 Chips Design

```
Chip dimensions: 44pt diameter
Colors (by value):
- $1: White (#FFFFFF)
- $5: Red (#E63946)
- $25: Green (#22C55E)
- $100: Black (#1D1D1F)
- $500: Purple (#7C3AED)

Design:
- Flat, clean circles
- Subtle edge detail (thin stroke)
- Value text centered
- No 3D bevel or heavy texture

Stack rendering:
- Chips stack with 4pt vertical offset
- Maximum visible stack: 10 chips
- Above 10: show count label
```

### 8.8 Layout Guidelines

```
Screen margins: 16pt (compact), 24pt (standard)
Card spacing: 12pt between elements
Section spacing: 32pt between major sections
Button height: 52pt (primary), 44pt (secondary)
Button corner radius: 12pt
Touch targets: Minimum 44pt × 44pt
```

---

## 9. Animation Spec

### 9.1 Core Principles

- **60 FPS always.** No dropped frames.
- **Physics-based.** Spring animations feel natural.
- **Meaningful.** Animations convey information, not decoration.
- **Consistent.** Same animation for same action everywhere.
- **Interruptible.** User can always act; animations don't block.

### 9.2 Card Animations

#### Dealing
```typescript
// Card slides from shoe (top-right) to position
const dealAnimation = {
  type: 'spring',
  damping: 20,
  stiffness: 300,
  mass: 0.8,
  // Path: slight arc, not straight line
  // Duration: ~250ms
};

// Sequence: 
// 1. Player card 1 (0ms)
// 2. Dealer card 1 (150ms delay)
// 3. Player card 2 (300ms delay)
// 4. Dealer card 2 face-down (450ms delay)
```

#### Card Flip (Reveal)
```typescript
// 3D Y-axis rotation
const flipAnimation = {
  rotateY: [0, 90, 90, 0],  // Flip to edge, swap content, flip to face
  duration: 300,
  easing: 'easeInOutCubic',
  // Back face shows during first half
  // Front face shows during second half
};
```

#### Hit Animation
```typescript
// New card slides in from shoe to hand
const hitAnimation = {
  type: 'spring',
  damping: 18,
  stiffness: 280,
  // Slight overshoot, settles into position
  // Duration: ~200ms
};
```

### 9.3 Chip Animations

#### Placing Bet
```typescript
// Chip drops from stack to betting circle
const chipPlaceAnimation = {
  // Vertical drop with slight bounce
  translateY: [0, betCircleY, betCircleY - 8, betCircleY],
  scale: [1, 1, 1.05, 1],
  duration: 250,
  easing: 'easeOutBounce',
};
// Haptic: light impact on land
```

#### Chip Stacking
```typescript
// When adding to existing stack
const chipStackAnimation = {
  // Slide horizontally, then drop
  translateX: { to: stackX, duration: 100 },
  translateY: { 
    to: stackY, 
    delay: 100,
    duration: 150,
    easing: 'easeOutQuad' 
  },
};
```

#### Winning Payout
```typescript
// Chips slide from dealer to player stack
const payoutAnimation = {
  // Staggered: each chip 50ms apart
  type: 'spring',
  damping: 15,
  stiffness: 200,
  // Path: arc from dealer chip area to player stack
  // Haptic: medium impact per chip
};
```

#### Losing Chips
```typescript
// Chips slide toward dealer, fade out
const loseAnimation = {
  translateY: -100,
  opacity: 0,
  duration: 400,
  easing: 'easeInCubic',
};
```

### 9.4 Hand Result Animations

#### Win
```typescript
// Subtle pulse/glow on winning hand
const winAnimation = {
  scale: [1, 1.02, 1],
  shadowOpacity: [0.3, 0.6, 0.3],
  duration: 600,
  loop: false,
};
// Border: brief green glow
// Haptic: success pattern
```

#### Lose
```typescript
// Slight fade and shrink
const loseAnimation = {
  scale: [1, 0.98],
  opacity: [1, 0.6],
  duration: 400,
};
// Haptic: error pattern (two short taps)
```

#### Push
```typescript
// Slight shake (no win, no loss)
const pushAnimation = {
  translateX: [0, -4, 4, -4, 0],
  duration: 300,
};
// Haptic: single light tap
```

#### Blackjack
```typescript
// Special celebration: cards fan slightly, glow
const blackjackAnimation = {
  cards: { rotation: [-5, 5], scale: 1.05 },
  glow: { color: '#F59E0B', opacity: 0.4 },
  duration: 800,
};
// Haptic: success pattern (stronger)
```

### 9.5 Screen Transitions

#### Mode Selection → Game
```typescript
// Shared element: selected button expands to fill screen
const gameTransition = {
  type: 'shared-element',
  element: 'mode-button',
  duration: 350,
  easing: 'easeInOutCubic',
};
```

#### Game → Results
```typescript
// Cards and chips slide down and fade
// Results card slides up from bottom
const resultsTransition = {
  gameElements: { translateY: 100, opacity: 0, duration: 300 },
  resultsCard: { 
    translateY: { from: 500, to: 0 },
    delay: 200,
    duration: 400,
    type: 'spring',
  },
};
```

#### Tab Switching
```typescript
// Smooth cross-fade between tab content
const tabTransition = {
  type: 'fade',
  duration: 200,
};
```

### 9.6 Haptic Feedback

Using Expo Haptics:

| Action | Haptic Type |
|--------|-------------|
| Card dealt | `impactAsync('light')` |
| Action button tap | `impactAsync('medium')` |
| Chip placed | `impactAsync('light')` |
| Win | `notificationAsync('success')` |
| Lose | `notificationAsync('error')` |
| Blackjack | `notificationAsync('success')` × 2 |
| Push | `impactAsync('light')` |
| Correct decision (Training) | `impactAsync('light')` |
| Mistake (Training) | `notificationAsync('warning')` |
| Achievement unlocked | `notificationAsync('success')` |
| Button long press | `impactAsync('heavy')` |

### 9.7 Performance Requirements

- All animations must run at 60 FPS
- Use `react-native-reanimated` worklets (run on UI thread)
- Avoid layout animations during gesture handling
- Pre-compute complex paths
- Use `useNativeDriver: true` equivalent (Reanimated handles this)
- Test on iPhone SE (lowest target device) for performance

---

## 10. Tech Stack

### 10.1 Core Framework

| Technology | Purpose |
|------------|---------|
| **Expo SDK 52+** | Development framework, build tooling |
| **React Native 0.76+** | Cross-platform runtime |
| **TypeScript** | Type safety |
| **Expo Router v4** | File-based navigation |

### 10.2 Animation & Gestures

| Technology | Purpose |
|------------|---------|
| **React Native Reanimated 3** | High-performance animations (UI thread) |
| **React Native Gesture Handler 2** | Touch gesture handling |
| **Expo Haptics** | Haptic feedback |

### 10.3 State & Persistence

| Technology | Purpose |
|------------|---------|
| **Zustand** | Global state management (simple, fast) |
| **MMKV** | Local storage (faster than AsyncStorage) |
| **Zod** | Runtime type validation for stored data |

### 10.4 UI Components

| Technology | Purpose |
|------------|---------|
| **Expo Vector Icons** | Icon library |
| **React Native SVG** | SVG rendering (cards, charts) |
| **React Native Safe Area Context** | Safe area handling |
| **Expo Linear Gradient** | Background gradients |

### 10.5 Analytics & Ads

| Technology | Purpose |
|------------|---------|
| **Expo Insights** | Basic analytics (free) |
| **React Native Google Mobile Ads** | AdMob integration |

### 10.6 Development

| Technology | Purpose |
|------------|---------|
| **ESLint + Prettier** | Code quality |
| **Jest + React Native Testing Library** | Unit/component tests |
| **Maestro** | E2E testing |

### 10.7 Not Used (Intentionally)

| Technology | Why Not |
|------------|---------|
| Firebase | No backend needed, adds complexity |
| Redux | Overkill for this app, Zustand is simpler |
| Styled Components | Stick with StyleSheet for performance |
| External UI library | Custom components for full control |
| Sentry | Add in v1.1 if needed |

### 10.8 Project Structure

```
blackjack-trainer/
├── app/                      # Expo Router screens
│   ├── (tabs)/               # Tab navigation
│   │   ├── index.tsx         # Home
│   │   ├── stats.tsx         # Stats
│   │   ├── learn.tsx         # Learn
│   │   └── settings.tsx      # Settings
│   ├── game/
│   │   ├── training.tsx      # Training mode game
│   │   └── live.tsx          # Live mode game
│   ├── review/
│   │   └── [sessionId].tsx   # Session review
│   └── _layout.tsx           # Root layout
│
├── src/
│   ├── components/
│   │   ├── Card/             # Card component + animations
│   │   ├── Chip/             # Chip component + animations
│   │   ├── Hand/             # Hand display
│   │   ├── ActionBar/        # Hit/Stand/Double/Split buttons
│   │   ├── StrategyOverlay/  # Training mode overlay
│   │   ├── CountDisplay/     # Card counting UI
│   │   └── ...
│   │
│   ├── engine/
│   │   ├── game.ts           # Game state machine
│   │   ├── shoe.ts           # Shoe/deck management
│   │   ├── hand.ts           # Hand evaluation
│   │   ├── strategy.ts       # Basic strategy engine
│   │   ├── counting.ts       # Card counting logic
│   │   └── scoring.ts        # Decision scoring
│   │
│   ├── store/
│   │   ├── gameStore.ts      # Current game state
│   │   ├── statsStore.ts     # Lifetime stats
│   │   └── settingsStore.ts  # User preferences
│   │
│   ├── hooks/
│   │   ├── useGame.ts        # Game logic hook
│   │   ├── useAnimations.ts  # Animation presets
│   │   └── useHaptics.ts     # Haptic feedback hook
│   │
│   ├── utils/
│   │   ├── constants.ts      # App constants
│   │   └── helpers.ts        # Utility functions
│   │
│   └── types/
│       └── index.ts          # TypeScript types
│
├── assets/                   # Images, fonts
├── app.json                  # Expo config
└── package.json
```

---

## 11. Monetization

### 11.1 Free Tier

The core app is free with ads:

**What's included:**
- Full Training Mode (all toggles)
- Full Live Mode with reviews
- Unlimited play
- Basic statistics
- 6-deck default rules

**Ads placement:**
- **Interstitial:** Between sessions (after session summary, before returning home)
- **Banner:** On Stats and Learn screens (NOT during gameplay)
- **Frequency cap:** Max 1 interstitial per 5 minutes

**What's NOT in free:**
- No ads during active gameplay
- No video ads required to continue
- No "watch ad for bonus chips"

### 11.2 Premium Tier ($4.99 one-time)

**Premium unlocks:**
- ✅ Ad-free experience
- ✅ Advanced statistics (EV tracking, hand category breakdowns)
- ✅ Card counting mode (full features)
- ✅ All rule configurations (1-8 decks, all variants)
- ✅ Session export (CSV for analysis)
- ✅ Index plays training
- ✅ Priority for new features

**Premium naming options:**
- "Blackjack Trainer Pro"
- "Card Counter" tier
- "Perfect Strategy" unlock

### 11.3 Revenue Projections

| Scenario | Downloads | Premium Conv. | Ad Revenue | Premium Revenue | Total |
|----------|-----------|---------------|------------|-----------------|-------|
| Conservative | 50K | 3% | $2,500 | $7,500 | $10,000 |
| Target | 100K | 5% | $7,500 | $25,000 | $32,500 |
| Optimistic | 250K | 7% | $25,000 | $87,500 | $112,500 |

*Based on $0.50 eCPM for interstitials, ~5 ad impressions/user, $4.99 premium*

### 11.4 Future Monetization (v2+)

Potential additions (not MVP):
- Subscription tier for live coaching/analysis
- One-time purchase for additional drill packs
- Tip jar / support the developer

---

## 12. App Store Strategy

### 12.1 App Name Options

| Name | Pros | Cons |
|------|------|------|
| **Blackjack Trainer** | Clear, searchable, descriptive | Generic |
| **21 Sharp** | Memorable, short, implies precision | Less searchable |
| **Basic Strategy** | Directly targets searchers | Too narrow |
| **Card Sense** | Premium feel, broader appeal | Less specific |
| **Perfect Play BJ** | Action-oriented, includes keyword | "BJ" is awkward |

**Recommendation:** "Blackjack Trainer" for clarity + ASO, with "21 Sharp" as backup

**Full App Store name:** `Blackjack Trainer — Learn 21 Strategy`

### 12.2 Category

**Primary:** Games > Card  
**Secondary:** Education

Rationale: Card games category has less competition than Casino. Education as secondary helps with "trainer" searches.

### 12.3 ASO Keywords

**Primary keywords (include in title/subtitle):**
- blackjack trainer
- blackjack strategy
- learn blackjack
- 21 trainer

**Secondary keywords (metadata):**
- basic strategy
- card counting
- blackjack practice
- casino trainer
- perfect blackjack
- blackjack tips
- 21 strategy
- blackjack coach
- optimal blackjack
- blackjack teacher

**Long-tail phrases:**
- "how to play blackjack"
- "blackjack cheat sheet"
- "when to hit or stand"
- "blackjack odds"

### 12.4 App Store Listing

**Subtitle:** Master Basic Strategy. Play Perfect Blackjack.

**Description (first paragraph):**
> Stop losing money to bad decisions. Blackjack Trainer teaches you mathematically perfect blackjack strategy through guided practice and real-time feedback. No guessing, no gimmicks — just the optimal play for every situation.

**Key features for listing:**
- ✓ Learn basic strategy through practice, not memorization
- ✓ Training mode with real-time hints and EV breakdown
- ✓ Live mode to test your skills with post-session review
- ✓ Track your improvement with detailed statistics
- ✓ Beautiful, minimal design (no cheesy casino vibes)
- ✓ Card counting practice for advanced players
- ✓ Configurable rules (1-8 decks, H17/S17, and more)
- ✓ 100% free, no real money gambling

### 12.5 Rating

**Age Rating:** 4+

Justification:
- No real money gambling
- Virtual chips only, no IAP for currency
- Educational purpose
- No mature content

### 12.6 Screenshots

5 screenshots needed (6.5" and 5.5" sizes):

1. **Hero:** Game screen with elegant card design, "Learn Perfect Blackjack" text
2. **Training Mode:** Strategy overlay visible, recommended action shown
3. **Live Mode Review:** Post-session breakdown with color-coded hands
4. **Statistics:** Beautiful stats dashboard showing improvement
5. **Customization:** Rules configuration screen, "Play your way" text

**Screenshot style:**
- Dark background matching app
- Device frames (iPhone 15 Pro)
- Minimal text overlays
- Clean, premium aesthetic

---

## 13. MVP Scope & Roadmap

### 13.1 MVP (v1.0)

**Target:** 8-10 weeks development

| Feature | Complexity | Priority |
|---------|------------|----------|
| Game engine (core blackjack logic) | High | P0 |
| Basic strategy engine | Medium | P0 |
| Training Mode (basic) | Medium | P0 |
| Live Mode (basic) | Medium | P0 |
| Card dealing animations | Medium | P0 |
| Chip animations | Medium | P0 |
| Session scoring | Medium | P0 |
| Basic statistics | Low | P0 |
| Home dashboard | Low | P0 |
| Settings (rules config) | Low | P0 |
| 6-deck default rules | Low | P0 |
| Haptic feedback | Low | P0 |
| AdMob integration (interstitials) | Low | P0 |

**NOT in MVP:**
- Card counting mode
- Progressive difficulty unlocks
- Detailed hand-by-hand review
- Achievement system
- Multiple rule presets
- Banner ads
- Premium unlock

### 13.2 v1.1 (4 weeks after MVP)

| Feature | Complexity |
|---------|------------|
| Hand-by-hand review (Live Mode) | Medium |
| Achievement system (10 achievements) | Medium |
| Multiple rule presets | Low |
| Accuracy trend charts | Medium |
| Session history | Low |
| Banner ads on Stats/Learn | Low |
| Bug fixes and polish | Ongoing |

### 13.3 v1.2 (4 weeks after v1.1)

| Feature | Complexity |
|---------|------------|
| Card counting mode | High |
| Premium unlock ($4.99) | Medium |
| Progressive difficulty | Medium |
| Practice drills | Medium |
| Index plays (deviations) | Medium |
| Remaining achievements | Low |
| All deck variants (1-8) | Low |

### 13.4 v2.0 (Future)

- Android release
- Social features (leaderboards)
- Weekly challenges
- Advanced counting systems (Omega II, etc.)
- Bankroll management training
- Localization (Spanish, Chinese)

### 13.5 Complexity Estimates

**Development team assumption:** 1 full-time developer

| Complexity | Estimated Time |
|------------|---------------|
| Low | 1-2 days |
| Medium | 3-5 days |
| High | 1-2 weeks |

**MVP total:** ~45-60 days of development
**v1.1:** ~20 days
**v1.2:** ~30 days

---

## Appendix A: Basic Strategy Charts (Complete Reference)

### Hard Totals (S17, DAS)

```
         2    3    4    5    6    7    8    9   10    A
  5     H    H    H    H    H    H    H    H    H    H
  6     H    H    H    H    H    H    H    H    H    H
  7     H    H    H    H    H    H    H    H    H    H
  8     H    H    H    H    H    H    H    H    H    H
  9     H    D    D    D    D    H    H    H    H    H
 10     D    D    D    D    D    D    D    D    H    H
 11     D    D    D    D    D    D    D    D    D    D
 12     H    H    S    S    S    H    H    H    H    H
 13     S    S    S    S    S    H    H    H    H    H
 14     S    S    S    S    S    H    H    H    H    H
 15     S    S    S    S    S    H    H    H    Rh   Rh
 16     S    S    S    S    S    H    H    Rh   Rh   Rh
 17     S    S    S    S    S    S    S    S    S    Rs
 18     S    S    S    S    S    S    S    S    S    S
 19     S    S    S    S    S    S    S    S    S    S
 20     S    S    S    S    S    S    S    S    S    S
 21     S    S    S    S    S    S    S    S    S    S
```

### Soft Totals (S17, DAS)

```
         2    3    4    5    6    7    8    9   10    A
 A,2    H    H    H    D    D    H    H    H    H    H
 A,3    H    H    H    D    D    H    H    H    H    H
 A,4    H    H    D    D    D    H    H    H    H    H
 A,5    H    H    D    D    D    H    H    H    H    H
 A,6    H    D    D    D    D    H    H    H    H    H
 A,7    Ds   Ds   Ds   Ds   Ds   S    S    H    H    H
 A,8    S    S    S    S    Ds   S    S    S    S    S
 A,9    S    S    S    S    S    S    S    S    S    S
```

### Pairs (S17, DAS)

```
         2    3    4    5    6    7    8    9   10    A
 2,2    Ph   Ph   P    P    P    P    H    H    H    H
 3,3    Ph   Ph   P    P    P    P    H    H    H    H
 4,4    H    H    H    Ph   Ph   H    H    H    H    H
 5,5    D    D    D    D    D    D    D    D    H    H
 6,6    Ph   P    P    P    P    H    H    H    H    H
 7,7    P    P    P    P    P    P    H    H    H    H
 8,8    P    P    P    P    P    P    P    P    P    Rp
 9,9    P    P    P    P    P    S    P    P    S    S
10,10   S    S    S    S    S    S    S    S    S    S
 A,A    P    P    P    P    P    P    P    P    P    P
```

**Legend:**
- H = Hit
- S = Stand
- D = Double if allowed, else Hit
- Ds = Double if allowed, else Stand
- P = Split
- Ph = Split if DAS allowed, else Hit
- Rh = Surrender if allowed, else Hit
- Rs = Surrender if allowed, else Stand
- Rp = Surrender if allowed, else Split

---

## Appendix B: Illustrious 18 Index Plays

For card counting mode, these are the most valuable deviations:

| # | Hand | Dealer | Basic | Deviation | Index |
|---|------|--------|-------|-----------|-------|
| 1 | Insurance | A | No | Yes | +3 |
| 2 | 16 | 10 | Hit | Stand | 0 |
| 3 | 15 | 10 | Hit | Stand | +4 |
| 4 | 10,10 | 5 | Stand | Split | +5 |
| 5 | 10,10 | 6 | Stand | Split | +4 |
| 6 | 10 | 10 | Hit | Double | +4 |
| 7 | 12 | 3 | Hit | Stand | +2 |
| 8 | 12 | 2 | Hit | Stand | +3 |
| 9 | 11 | A | Double | Hit | +1 |
| 10 | 9 | 2 | Hit | Double | +1 |
| 11 | 10 | A | Hit | Double | +4 |
| 12 | 9 | 7 | Hit | Double | +3 |
| 13 | 16 | 9 | Hit | Stand | +5 |
| 14 | 13 | 2 | Stand | Hit | -1 |
| 15 | 12 | 4 | Stand | Hit | 0 |
| 16 | 12 | 5 | Stand | Hit | -2 |
| 17 | 12 | 6 | Stand | Hit | -1 |
| 18 | 13 | 3 | Stand | Hit | -2 |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Basic Strategy** | Mathematically optimal play for every blackjack situation without counting |
| **DAS** | Double After Split — rule allowing doubling on split hands |
| **EV** | Expected Value — average outcome of a decision over many repetitions |
| **H17** | Dealer Hits soft 17 (worse for player) |
| **Hard Total** | Hand without an Ace counted as 11 |
| **Hi-Lo** | Most common card counting system (+1 for 2-6, 0 for 7-9, -1 for 10-A) |
| **Index Play** | Count-dependent deviation from basic strategy |
| **Penetration** | How deep into the shoe the dealer deals before shuffling |
| **Running Count** | Cumulative count of cards seen |
| **S17** | Dealer Stands on soft 17 (better for player) |
| **Shoe** | Card holder containing multiple decks |
| **Soft Total** | Hand with an Ace counted as 11 |
| **True Count** | Running count divided by decks remaining |

---

*End of PRD*
