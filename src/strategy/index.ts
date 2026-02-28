/**
 * Strategy Module
 * 
 * Exports all strategy-related functionality including:
 * - Basic strategy lookups
 * - Card counting deviations (Illustrious 18 + Fab 4)
 * - Betting recommendations
 */

// Basic Strategy exports
export {
  // Types
  type Action,
  type StrategyCode,
  type DealerUpcard,
  type AvailableActions,
  type StrategyResult,
  
  // Core functions
  getOptimalAction,
  getStrategyCode,
  isOptimalAction,
  getActionsByPreference,
  
  // Helper functions
  getDealerUpcardValue,
  
  // Matrix exports (for UI display)
  getHardTotalsMatrix,
  getSoftTotalsMatrix,
  getPairsMatrix,
  STRATEGY_CODE_DESCRIPTIONS,
} from './basicStrategy';

// Deviation exports
export {
  // Types
  type Deviation,
  type DeviationResult,
  type BetRecommendation,
  
  // Core deviation functions
  getCountAdjustedAction,
  getOptimalActionWithCount,
  shouldTakeInsurance,
  
  // Deviation data
  ILLUSTRIOUS_18,
  FAB_4_SURRENDERS,
  ALL_DEVIATIONS,
  getIllustrious18,
  getFab4Surrenders,
  getApplicableDeviations,
  getDeviationById,
  
  // Betting recommendations
  getBetMultiplier,
  getBetRecommendation,
} from './deviations';
