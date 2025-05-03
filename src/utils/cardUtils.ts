/**
 * Pokemon TCG Card Database Utilities
 * Provides functions and configuration for working with card data
 */

/**
 * List of available card sets in the game
 */
export const CARD_SETS = [
  'Genetic Apex',
  'Mythical Island',
  'Space-Time Smackdown',
  'Triumphant Light',
  'Shining Revelry',
  'Celestial Guardians',
]; 

/**
 * Rarity Mapping - Maps rarity codes to numeric values
 * @type {Record<string, number>}
 */
export const RARITY_MAP = {
  "C": 1,      // Normal / 1 Diamonds
  "U": 2,      // Normal / 2 Diamonds
  "R": 3,      // Normal / 3 Diamonds
  "RR": 4,     // EX / 4 Diamonds
  "AR": 5,     // 1 Star
  "SR": 6,     // 2 Star
  "SAR": 7,    // Rainbow 2 Star
  "IM": 8,     // Immersive / 3 Star
  "UR": 9,     // Crown Rare
  "S": 10,     // Shiny
  "SSR": 11,   // Double Shiny
  "IR": 12,    // Immersive / Triple Shiny
};

/**
 * Calculate card desirability based on rarity
 * Higher rarity cards have higher desirability values
 * 
 * @param {number} rarity - The card's rarity value (1-12)
 * @returns {number} - The desirability value (0-4)
 */
export const calculateDesirabilityFromRarity = (rarity: number): number => {
  // Map rarity values to desirability values
  // "C", "U" (Common - 1 Diamonds / Uncommon - 2 Diamonds) -> desirability 1
  // "R" (Rare - 3 Diamonds) -> desirability 2
  // "RR", "AR" (EX - 4 Diamonds/1 Star) -> desirability 3
  // "SR", "SAR" (Super Rare - 2 Stars / Super Art Rare - Rainbow 2 Star) -> desirability 4
  
  switch (rarity) {
    case 1: return 1;  // Common - 1 Diamonds
    case 2: return 1;  // Uncommon - 2 Diamonds
    case 3: return 2;  // Rare - 3 Diamonds
    case 4: return 3;  // EX- 4 Diamonds
    case 5: return 3;  // 1 Star
    case 6: return 4;  // Super Rare - 2 Stars
    case 7: return 4;  // Super Art Rare - Rainbow 2 Star
    default: 
      return 0;  // Default for unknown rarities
  }
};

/**
 * Get icon class for card status in gallery
 * 
 * @param {boolean} owned - Whether the card is owned
 * @param {boolean} wanted - Whether the card is wanted
 * @returns {string} - CSS class for status icon
 */
export const getCardStatusClass = (owned: boolean, wanted: boolean): string => {
  if (owned) return 'card-owned';
  if (wanted) return 'card-wanted';
  return '';
}; 