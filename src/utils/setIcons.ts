/**
 * Represents the icon data for a card set.
 */
interface SetIcon {
  /**
   * The base set name (e.g., "Genetic Apex").
   */
  baseSet: string;

  /**
   * Optional mapping of sub-set names to their respective image URLs.
   */
  subSet?: Record<string, string>;

  /**
   * URL to the image representing the base set.
   */
  baseSetImageUrl?: string;
}

/**
 * A mapping of base set names to their icon data including sub-sets and images.
 */
export const SET_ICONS: Record<string, SetIcon> = {
  "Genetic Apex": {
    baseSet: "Genetic Apex",
    baseSetImageUrl:
      "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A1_100040_theme_en_US.webp",
    subSet: {
      Charizard:
        "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A1_100020_LIZARDON_en_US.webp",
      Pikachu:
        "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A1_100030_PIKACHU_en_US.webp",
      Mewtwo:
        "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A1_100010_MEWTWO_en_US.webp",
    },
  },
  "Mythical Island": {
    baseSet: "Mythical Island",
    baseSetImageUrl:
      "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A1_100040_theme_en_US.webp",
  },
  "Space-Time Smackdown": {
    baseSet: "Space-Time Smackdown",
    subSet: {
      Dialga:
        "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A2_100050_DIALGA_en_US.webp",
      Palkia:
        "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A2_100060_PALKIA_en_US.webp",
    },
  },
  "Triumphant Light": {
    baseSet: "Triumphant Light",
    baseSetImageUrl:
      "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A2a_100070_TRIUMPHAN_en_US.webp",
  },
  "Shining Revelry": {
    baseSet: "Shining Revelry",
    baseSetImageUrl:
      "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A2b_100080_SHINING_en_US.webp",
  },
  "Celestial Guardians": {
    baseSet: "Celestial Guardians",
    subSet: {
      Lunala:
        "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A3_100100_LUNALA_en_US.webp",
      Solgaleo:
        "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A3_100090_SOLGALEO_en_US.webp",
    },
  },
  "Extradimensional Crisis": {
    baseSet: "Extradimensional Crisis",
    baseSetImageUrl:
      "https://assets.pokemon-zone.com/game-assets/UI/Textures/System/PackSku/EXPANSION_PACK_A3a_100110_CRISIS_en_US.webp",
  },
};

/**
 * Retrieves the appropriate image URL for a given set.
 *
 * @param setBaseName - The name of the base set (e.g., "Genetic Apex").
 * @param setName - (Optional) The specific sub-set name (e.g., "Charizard").
 * @returns The image URL associated with the base set or sub-set, or an empty string if not found.
 *
 * @example
 * getSetIconUrl("Genetic Apex", "Pikachu");
 * // returns Pikachu sub-set image URL
 *
 * getSetIconUrl("Shining Revelry");
 * // returns base set image URL
 */
export const getSetIconUrl = (
  setBaseName: string,
  setName?: string
): string => {
  const setData = SET_ICONS[setBaseName];
  if (!setData) return "";

  // Check if a sub-set exists and a match for the provided setName
  if (setName && "subSet" in setData && setData.subSet?.[setName]) {
    return setData.subSet[setName];
  }

  // Fallback to base set image
  return setData.baseSetImageUrl || "";
};
