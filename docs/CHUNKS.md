# Blackjack Trainer — Build Chunks

## Chunk Overview

| Chunk | Name | Goal |
|-------|------|------|
| 1 | **Project Scaffold + Card Primitives** | Expo project setup with card components and basic animations |
| 2 | Core Game Engine | Shoe, hand evaluation, game state machine |
| 3 | Basic Strategy Engine | Strategy lookup, optimal action calculation |
| 4 | Game Screen UI | Playable game with action buttons, betting flow |
| 5 | Training Mode | Strategy overlay, hints, real-time feedback |
| 6 | Live Mode + Session Scoring | Clean play mode with post-session review |
| 7 | Stats & Persistence | Lifetime stats, session history, Zustand + MMKV |
| 8 | Home Dashboard + Navigation | Tab navigation, dashboard, settings screen |
| 9 | Polish & Ads | Haptics, transitions, AdMob integration |
| 10 | App Store Prep | Icons, screenshots, metadata, TestFlight build |

---

## Chunk 1: Project Scaffold + Card Primitives

**Status:** Ready for development  
**Goal:** Set up the Expo project with TypeScript, install core dependencies, and build the foundational Card component with dealing/flip animations.  
**Depends on:** Nothing (first chunk)

### Scope

- [ ] Initialize Expo project (SDK 52+, TypeScript template)
- [ ] Configure ESLint + Prettier
- [ ] Install core dependencies (Reanimated 3, Gesture Handler 2, Expo Haptics, MMKV, Zustand)
- [ ] Set up folder structure per PRD Section 10.8
- [ ] Define TypeScript types for Card, Suit, Rank (from PRD Section 2.3)
- [ ] Build `Card` component with:
  - [ ] Card face rendering (rank + suit, proper layout)
  - [ ] Card back rendering (solid navy)
  - [ ] Flip animation (3D Y-axis rotation, 300ms)
  - [ ] Basic styling matching PRD Section 8.6 (70×100pt, corner radius 8pt)
- [ ] Build `CardStack` component (offset rendering for multiple cards)
- [ ] Create a test screen to demo dealing animation (card slides in from top-right)
- [ ] Add haptic feedback on card deal (`impactAsync('light')`)

### Technical details

**Project initialization:**
```bash
npx create-expo-app blackjack-trainer --template expo-template-blank-typescript
```

**Key dependencies to install:**
```json
{
  "react-native-reanimated": "~3.x",
  "react-native-gesture-handler": "~2.x",
  "expo-haptics": "~13.x",
  "react-native-mmkv": "^2.x",
  "zustand": "^4.x",
  "react-native-svg": "~15.x"
}
```

**Folder structure to create:**
```
blackjack-trainer/
├── app/
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   └── Card/
│   │       ├── Card.tsx
│   │       ├── CardBack.tsx
│   │       └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── constants.ts
│   └── hooks/
│       └── useHaptics.ts
└── assets/
```

**Type definitions (src/types/index.ts):**
```typescript
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  rank: Rank;
  suit: Suit;
  value: number;        // 1-11 for Ace, 2-10 for numerics, 10 for face cards
  countValue: number;   // Hi-Lo: +1 (2-6), 0 (7-9), -1 (10-A)
}
```

**Color constants (from PRD Section 8.4):**
```typescript
export const COLORS = {
  background: {
    primary: '#0D0D0F',
    secondary: '#1A1A1D',
    elevated: '#252528',
  },
  card: {
    face: '#FAFAF8',
    back: '#1E3A5F',
    hearts: '#E63946',
    diamonds: '#E63946',
    clubs: '#1D1D1F',
    spades: '#1D1D1F',
  },
};
```

**Animation specs (from PRD Section 9.2):**
- Deal animation: spring with damping 20, stiffness 300, mass 0.8
- Flip animation: 300ms, easeInOutCubic, rotateY 0→90→90→0

### Acceptance criteria

- [ ] `npx expo start` launches without errors
- [ ] ESLint passes with no warnings
- [ ] Card component renders correctly with any rank/suit combination
- [ ] Card flip animation works smoothly (face ↔ back)
- [ ] Deal animation slides card from top-right to center with spring physics
- [ ] Haptic fires on card deal
- [ ] Test screen demonstrates 2-3 cards being "dealt" with staggered timing
- [ ] All colors match PRD design spec

### NOT in scope

- Game logic (shoe, shuffling, hand evaluation)
- Chip component
- Action buttons (Hit/Stand/Double/Split)
- Navigation / tab structure
- Persistent state
- Strategy engine
- Any game modes (Training/Live)
