import React, { useState, useEffect } from "react";
import { ProcessedPack, RARITY_MAP } from "../utils/cardUtils";
import { getSetIconUrl } from "../utils/setIcons";

/**
 * Props for the PackAccordionContent component.
 */
interface PackAccordionContentProps {
  /** List of processed packs to display */
  packs: ProcessedPack[];
  /** Set of selected pack IDs */
  selectedPacks: Set<string>;
  /** Flag indicating if a share action is in progress */
  isSharing: boolean;
  /** Callback when a pack selection is toggled */
  onToggleSelection: (packId: string) => void;
  /** Callback when a pack is shared */
  onSharePack: (packId: string) => void;
  /** Optional flag to indicate if this section is for expired packs */
  isExpiredSection?: boolean;
}

/**
 * Interface for cards in the local pokedex.
 */
interface PokedexCard {
  card_name: string;
  card_owned: boolean;
  card_set_base_name: string;
  card_rarity: number;
  [key: string]: any;
}

/**
 * Renders the accordion content for a list of card packs. Displays packs in a grid,
 * allows toggling selection and sharing of packs, and marks owned cards based on
 * local pokedex data.
 *
 * @component
 * @param {PackAccordionContentProps} props - The component props.
 */
const PackAccordionContent: React.FC<PackAccordionContentProps> = ({
  packs,
  selectedPacks,
  isSharing,
  onToggleSelection,
  onSharePack,
  isExpiredSection = false,
}) => {
  const [pokedex, setPokedex] = useState<Record<string, PokedexCard> | null>(null);

  /**
   * Loads pokedex data from localStorage on component mount.
   */
  useEffect(() => {
    const storedPokedex = localStorage.getItem("cardsDatabase");
    if (storedPokedex) {
      try {
        setPokedex(JSON.parse(storedPokedex));
      } catch (error) {
        console.error("Error parsing pokedex from localStorage:", error);
      }
    }
  }, []);

  /**
   * Determines whether a card is owned by the user based on local pokedex data.
   *
   * @param {string} cardName - The name of the card.
   * @param {string} setBaseName - The base name of the card's set.
   * @param {number} cardRarity - The rarity level of the card.
   * @returns {boolean} Whether the card is marked as owned.
   */
  const isCardOwned = (
    cardName: string,
    setBaseName: string,
    cardRarity: number
  ): boolean => {
    if (!pokedex) return false;

    const searchName = cardName.toLowerCase();

    const card = Object.values(pokedex).find((card) => {
      const pokedexCardName = card.card_name.toLowerCase();
      const nameMatches =
        pokedexCardName.includes(searchName) || searchName.includes(pokedexCardName);
      return (
        nameMatches &&
        card.card_set_base_name === setBaseName &&
        card.card_rarity === cardRarity
      );
    });

    return card?.card_owned || false;
  };

  /**
   * Formats the time since a pack was last shared, for display in expired sections.
   *
   * @param {number} timestamp - The UNIX timestamp of the last share time.
   * @returns {string} A human-readable time difference string.
   */
  const formatExpiredTime = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = now - timestamp;
    const days = Math.floor(diffSeconds / (24 * 60 * 60));
    const hours = Math.floor((diffSeconds % (24 * 60 * 60)) / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);

    if (days > 0) {
      return hours === 0 && minutes === 0 ? `${days}d` : `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="accordion-content">
      <div className="packs-grid">
        {packs.length > 0 ? (
          packs.map((pack) => (
            <div key={pack.id} className="pack-row">
              <div className="pack-checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedPacks.has(pack.id)}
                  onChange={() => onToggleSelection(pack.id)}
                />
              </div>

              <div className="pack-info-col">
                <div className="pack-meta-icon">
                  <img
                    src={getSetIconUrl(pack.set_base_name, pack.set_name)}
                    alt={`${pack.set_base_name} ${pack.set_name}`}
                    className="set-icon"
                  />
                </div>
                <div className="pack-details">
                  <div className="nickname">{pack.nickname}</div>
                  <div className="friend-id">{pack.friend_id}</div>
                </div>
                <div className="pack-details-buttons">
                  <button
                    className={`share-pack-button ${isExpiredSection ? "expired" : ""}`}
                    onClick={() => !isExpiredSection && onSharePack(pack.id)}
                    disabled={isSharing || isExpiredSection}
                  >
                    {isExpiredSection
                      ? formatExpiredTime(pack.last_shared_timestamp)
                      : "Share Pack"}
                  </button>
                </div>
              </div>

              <div className="cards-display-col">
                {pack.cards.map((card, i) => (
                  <div key={i} className="card-wrapper">
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className={
                        !isCardOwned(card.name, pack.set_base_name, card.rarity)
                          ? "not-owned"
                          : ""
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">No packs available</div>
        )}
      </div>
    </div>
  );
};

export default PackAccordionContent;
