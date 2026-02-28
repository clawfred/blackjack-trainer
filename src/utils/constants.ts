/**
 * Constants - Re-exports from theme for backwards compatibility
 *
 * New code should import directly from '../../theme' instead.
 * This file exists for compatibility with existing imports.
 */

import {
  colors,
  cardDimensions,
  animation,
  shadows,
} from '../theme';

// Legacy color structure mapping
export const COLORS = {
  background: colors.background,
  text: {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    muted: colors.text.muted,
  },
  card: {
    face: colors.card.face,
    back: colors.card.back,
    hearts: colors.suit.red,
    diamonds: colors.suit.red,
    clubs: colors.suit.black,
    spades: colors.suit.black,
  },
  actions: colors.actions,
  feedback: colors.feedback,
  accents: {
    primary: colors.accent.primary,
    gold: '#F59E0B',
  },
} as const;

// Re-export card dimensions with legacy border color
export const CARD_DIMENSIONS = {
  ...cardDimensions,
  borderColor: colors.card.border,
} as const;

// Re-export animation configs
export const ANIMATION = {
  deal: animation.spring.deal,
  flip: {
    duration: animation.flip.duration,
  },
  hit: animation.spring.hit,
} as const;

// Stagger timing
export const DEAL_STAGGER_MS = animation.stagger.card;

// Card shadow
export const CARD_SHADOW = shadows.card;
