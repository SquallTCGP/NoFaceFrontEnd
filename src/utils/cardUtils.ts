import { RARITY_MAP } from '../config';

/**
 * Calculate card desirability based on rarity
 * @param {number} rarity - The card's rarity value
 * @returns {number} - The desirability value
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
 * @param {boolean} owned - Whether the card is owned
 * @param {boolean} wanted - Whether the card is wanted
 * @returns {string} - CSS class for status icon
 */
export const getCardStatusClass = (owned: boolean, wanted: boolean): string => {
  if (owned) return 'card-owned';
  if (wanted) return 'card-wanted';
  return '';
}; 