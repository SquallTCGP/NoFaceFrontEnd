export interface Card {
  card_number: string;
  card_name: string;
  card_rarity: number;
  card_set: string;
  card_set_name: string;
  card_set_base_name: string;
  expansion_id: string;
  card_desirability: number;
  card_trade_desirability: boolean;
  card_tradable: boolean;
  card_obtainable: boolean;
  card_owned: boolean;
}

export interface CardWithKey extends Card {
  key: string;
  imageUrl: string | null;
}

export interface CardsDatabase {
  [key: string]: Card;
} 