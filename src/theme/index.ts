/**
 * Design System - Single Source of Truth
 *
 * All colors, typography, spacing, and other design tokens should be
 * imported from this file. Do not hardcode values in components.
 */

// Colors derived from mockup analysis and PRD Section 8.4
export const colors = {
  background: {
    primary: '#0D0D0F', // Main app background (near black)
    secondary: '#1A1A1D', // Cards, containers
    elevated: '#252528', // Modals, sheets
    card: '#2A2A2D', // Card containers
  },
  card: {
    face: '#FAFAF8', // Cream white card face
    back: '#1E3A5F', // Deep navy card back
    border: 'rgba(0,0,0,0.0625)', // Card border color
  },
  accent: {
    primary: '#4ECDC4', // Teal - primary buttons
    success: '#00E676', // Green - positive feedback
    warning: '#FFB74D', // Orange - caution
    danger: '#FF5252', // Red - errors, reset
  },
  text: {
    primary: '#FAFAF8', // Headings, important text
    secondary: '#A0A0A8', // Body text
    muted: '#6B6B78', // Hints, labels
    inverse: '#0D0D0F', // Text on light backgrounds
  },
  suit: {
    red: '#E63946', // Hearts, diamonds
    black: '#1D1D1F', // Clubs, spades
  },
  actions: {
    hit: '#4ADE80', // Green
    stand: '#FACC15', // Yellow
    double: '#60A5FA', // Blue
    split: '#F472B6', // Pink
    surrender: '#A78BFA', // Purple
  },
  feedback: {
    success: '#22C55E', // Green
    warning: '#EAB308', // Yellow
    error: '#EF4444', // Red
    info: '#3B82F6', // Blue
  },
} as const;

// Typography scale
export const typography = {
  fontFamily: {
    base: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// Spacing scale (4px base)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// Border radius scale
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// Card dimensions
export const cardDimensions = {
  width: 70,
  height: 100,
  borderRadius: 8,
  borderWidth: 1,
} as const;

// Animation timing (ms)
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  // Flip animation phases (150ms each, 300ms total)
  flip: {
    duration: 300,
    phaseHalf: 150,
  },
  // Spring configs
  spring: {
    deal: {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    },
    flip: {
      damping: 15,
      stiffness: 200,
    },
    hit: {
      damping: 18,
      stiffness: 280,
    },
  },
  // Stagger timing
  stagger: {
    card: 150,
    button: 50,
  },
} as const;

// Easing functions for use with react-native-reanimated
// easeInOutCubic: cubic-bezier(0.65, 0, 0.35, 1)
export const easings = {
  // For withTiming, use Easing.bezier(0.65, 0, 0.35, 1) from reanimated
  inOutCubic: [0.65, 0, 0.35, 1] as const,
} as const;

// Re-export everything as a single theme object for convenience
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  cardDimensions,
  animation,
  easings,
} as const;

export default theme;
