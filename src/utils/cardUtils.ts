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
export const RARITY_MAP: Record<string, number> = {
  '♢': 1,     // 1 Diamond
  '♢♢': 2,    // 2 Diamonds
  '♢♢♢': 3,   // 3 Diamonds
  '♢♢♢♢': 4,  // 4 Diamonds
  '☆': 5,     // 1-star
  '☆☆': 6,    // 2-star
  '★★': 7     // Rainbow 2-star
};

/**
 * Calculate card desirability based on rarity
 * Higher rarity cards have higher desirability values
 * 
 * @param {string | number} rarity - The card's rarity value (1-12 or string)
 * @returns {number} - The desirability value (0-4)
 */
export const calculateDesirabilityFromRarity = (rarity: string | number): number => {
  // Convert string rarity to number if needed
  const rarityValue = typeof rarity === 'string' 
    ? parseInt(rarity, 10) || 0  // Try to parse the string as a number, default to 0 if NaN
    : rarity;
  
  // Map rarity values to desirability values
  // "C", "U" (Common - 1 Diamonds / Uncommon - 2 Diamonds) -> desirability 1
  // "R" (Rare - 3 Diamonds) -> desirability 2
  // "RR", "AR" (EX - 4 Diamonds/1 Star) -> desirability 3
  // "SR", "SAR" (Super Rare - 2 Stars / Super Art Rare - Rainbow 2 Star) -> desirability 4
  
  switch (rarityValue) {
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

interface CardInfo {
  name: string;
  rarity: number;
  image_url: string;
}

export interface ProcessedPack {
  id: string;
  set_base_name: string;
  set_name: string;
  cards: CardInfo[];
  pack: string;
  average_desirability: number;
  godpack: boolean;
  opened_timestamp: number;
  user: string;
  pwd: string;
  last_shared_timestamp: number;
  friend_id: string;
  nickname: string;
  rarity_score: number;
}

/**
 * Finds card data in pokedex by name, set and rarity
 */
const findCardInPokedex = (
  name: string, 
  setBaseName: string, 
  setName: string, 
  rarity: number,
  pokedex: Record<string, any>
): string | null => {
  // Convert search terms to lowercase
  const searchName = name.toLowerCase();
  const searchSetBase = setBaseName.toLowerCase();
  
  for (const [_, card] of Object.entries(pokedex)) {
    // Convert card data to lowercase for comparison
    const cardName = card.card_name.toLowerCase();
    const cardSetBase = card.card_set_base_name.toLowerCase();
    
    if (cardName.includes(searchName) && 
        cardSetBase === searchSetBase && 
        card.card_rarity === rarity) {
      return card.card_image_url;
    }
  }
  return null;
};

/**
 * Processes a saved pack to extract full card information
 * @param pack The saved pack data
 * @param pokedex The full pokedex data
 */
export const processSavedPack = (
  pack: any, 
  pokedex: Record<string, any>
): ProcessedPack | null => {
  // Split pack name into base name and set name
  const [setBaseName, setName] = pack.pack.split(' - ');
  console.log('Processing pack:', { setBaseName, setName, pack });
  
  // Process each card
  const processedCards: CardInfo[] = [];
  
  for (const cardStr of pack.cards) {
    console.log('Processing card string:', cardStr);
    const extracted = extractCardNameAndRarity(cardStr);
    console.log('Extracted name and rarity:', extracted);
    
    if (!extracted) continue;
    
    const [cardName, rarity] = extracted;
    const imageUrl = findCardInPokedex(cardName, setBaseName, setName, rarity, pokedex);
    console.log('Found image URL:', imageUrl);
    
    if (imageUrl) {
      processedCards.push({
        name: cardName,
        rarity: rarity,
        image_url: imageUrl
      });
    }
  }

  console.log('Processed cards:', processedCards);

  // Return null if we couldn't process any cards
  if (processedCards.length === 0) {
    console.log('No cards were processed successfully');
    return null;
  }

  return {
    id: pack.id,
    set_base_name: setBaseName,
    set_name: setName,
    cards: processedCards,
    pack: pack.pack,
    average_desirability: pack.average_desirability,
    godpack: pack.godpack,
    opened_timestamp: pack.opened_timestamp,
    user: pack.user,
    pwd: pack.pwd,
    last_shared_timestamp: pack.last_shared_timestamp,
    friend_id: pack.friend_id,
    nickname: pack.nickname,
    rarity_score: pack.rarity_score
  };
};

/**
 * Extracts card name and rarity from card string
 * @param cardStr Card string in format "Name [Stars]"
 */
const extractCardNameAndRarity = (cardStr: string): [string, number] | null => {
  const match = cardStr.match(/^(.*?)\s+\[(☆+|★+|♢+)\]$/);
  if (!match) return null;
  
  const [_, name, symbol] = match;
  const rarityValue = RARITY_MAP[symbol] || 1; // Default to common if not found
  console.log('Extracted rarity:', { symbol, rarityValue });
  return [name, rarityValue];
}; 