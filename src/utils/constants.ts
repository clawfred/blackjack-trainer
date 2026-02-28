// Color constants from PRD Section 8.4
export const COLORS = {
  background: {
    primary: '#0D0D0F',     // near black
    secondary: '#1A1A1D',   // cards, containers
    elevated: '#252528',    // modals, sheets
  },
  text: {
    primary: '#FFFFFF',     // headings
    secondary: '#A0A0A5',   // body
    muted: '#606065',       // hints
  },
  card: {
    face: '#FAFAF8',        // cream white
    back: '#1E3A5F',        // deep navy
    hearts: '#E63946',      // red
    diamonds: '#E63946',    // red
    clubs: '#1D1D1F',       // black
    spades: '#1D1D1F',      // black
  },
  actions: {
    hit: '#4ADE80',         // green
    stand: '#FACC15',       // yellow
    double: '#60A5FA',      // blue
    split: '#F472B6',       // pink
    surrender: '#A78BFA',   // purple
  },
  feedback: {
    success: '#22C55E',     // green
    warning: '#EAB308',     // yellow
    error: '#EF4444',       // red
    info: '#3B82F6',        // blue
  },
  accents: {
    primary: '#6366F1',     // indigo
    gold: '#F59E0B',        // achievements
  },
} as const;

// Card dimensions from PRD Section 8.6
export const CARD_DIMENSIONS = {
  width: 70,
  height: 100,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.0625)', // #00000010
} as const;

// Animation specs from PRD Section 9.2
export const ANIMATION = {
  deal: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  flip: {
    duration: 300,
  },
  hit: {
    damping: 18,
    stiffness: 280,
  },
} as const;

// Timing for staggered card deals
export const DEAL_STAGGER_MS = 150;

// Shadow for active cards
export const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
} as const;
