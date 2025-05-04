/**
 * Core application types module
 */

/**
 * Represents a card in the collection
 * 
 * Contains all properties from the database JSON including
 * card details, status information, and image URLs
 */
export interface Card {
  /** The card's number within the set */
  card_number: string;
  /** The name of the card */
  card_name: string;
  /** The rarity level (can be numeric or string format) */
  card_rarity: string | number;
  /** Short code for the card set */
  card_set: string;
  /** Display name for the card set */
  card_set_name: string;
  /** Base name for the card set used for filtering */
  card_set_base_name: string;
  /** ID for the expansion the card belongs to */
  expansion_id: string;
  /** Numeric value representing how desirable the card is (0 if not wanted) */
  card_desirability: number;
  /** Whether the card is desirable for trading */
  card_trade_desirability: boolean;
  /** Whether the card can be traded */
  card_tradable: boolean;
  /** Whether the card can be obtained */
  card_obtainable: boolean;
  /** Whether the card is owned by the user */
  card_owned: boolean;
  /** URL to the card image (from JSON) */
  card_image_url?: string;
  /** Legacy field for image URL (for backward compatibility) */
  image_url?: string; // Keeping for backward compatibility
  /** Card type information (optional, for backward compatibility) */
  card_type?: string; // Keep optional for backward compatibility
}

/**
 * Extends the Card interface with additional properties
 * needed for display and identification in the UI
 */
export interface CardWithKey extends Card {
  /** Unique identifier for the card */
  key: string;
  /** Resolved URL for the card image (prioritizes card_image_url) */
  imageUrl: string | null;
}

/**
 * Type representing the entire card database
 * where keys are card IDs and values are Card objects
 */
export type CardsDatabase = Record<string, Card>; 