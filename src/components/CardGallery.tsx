import React, { useState, useMemo, useEffect, useCallback } from "react";
import { calculateDesirabilityFromRarity } from "../utils/cardUtils";
import {
  loadDatabase,
  saveDatabase,
  downloadDatabaseAsFile,
  importDatabaseFromFile,
  databaseExists,
} from "../utils/dbUtils";
import { Card, CardWithKey, CardsDatabase } from "../types";
import { CARD_SETS, CARD_SETS_SUBSETS } from "../utils/cardUtils";
import NoDatabaseModal from "./NoDatabaseModal";
import "../assets/styles/CardGallery.scss";

// Define the type for the imported images
type ImageModule = { default: string };
type ImageModules = Record<string, ImageModule>;

// @ts-ignore - The glob import pattern is provided by Vite
const images = import.meta.glob<ImageModule>("../assets/card-images/*/*.png", {
  eager: true,
}) as ImageModules;
const SHARED_PACK_LABEL = "Core Pool";

// Create image cache for remote images
const imageCache = new Map<string, string>();

/**
 * CardGallery Component
 *
 * Displays a gallery of cards from various sets with filtering capabilities.
 * Allows users to mark cards as owned or wanted and save their collection.
 *
 * @returns {JSX.Element} The rendered CardGallery component
 */
const CardGallery: React.FC = () => {
  const [selectedSet, setSelectedSet] = useState<string>("none");
  const [modalCardKey, setModalCardKey] = useState<string | null>(null);
  const [cardsDatabase, setCardsDatabase] = useState<CardsDatabase | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChangingSet, setIsChangingSet] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasDatabaseError, setHasDatabaseError] = useState<boolean>(false);
  const [selectedPack, setSelectedPack] = useState<string>("all");
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);
  const [filterMissing, setFilterMissing] = useState<boolean>(false);
  const [filterOwned, setFilterOwned] = useState<boolean>(false);
  const [filterWanted, setFilterWanted] = useState<boolean>(false);
  const [filterTrade, setFilterTrade] = useState<boolean>(false);
  const [instructionsCollapsed, setInstructionsCollapsed] =
    useState<boolean>(true);
  const [nameFilter, setNameFilter] = useState<string>("");
  const [cardWidth, setCardWidth] = useState<number>(185);

  // Add temporary state variables for filters
  const [tempSelectedSet, setTempSelectedSet] = useState<string>(selectedSet);
  const [tempSelectedPack, setTempSelectedPack] =
    useState<string>(selectedPack);
  const [tempFilterMissing, setTempFilterMissing] =
    useState<boolean>(filterMissing);
  const [tempFilterOwned, setTempFilterOwned] = useState<boolean>(filterOwned);
  const [tempFilterWanted, setTempFilterWanted] =
    useState<boolean>(filterWanted);
  const [tempFilterTrade, setTempFilterTrade] = useState<boolean>(filterTrade);

  /**
   * Load database on component mount
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Check if a database exists in localStorage
      if (databaseExists()) {
        const db = await loadDatabase();
        setCardsDatabase(db);
        setHasDatabaseError(false);
      } else {
        // No database found, user will need to import one
        setCardsDatabase(null);
        setHasDatabaseError(true);
      }
    } catch (error) {
      console.error("Error loading database:", error);
      setHasDatabaseError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Handle database import
   * @param {CardsDatabase} database - The imported database
   */
  const handleDatabaseImported = (database: CardsDatabase) => {
    setCardsDatabase(database);
    setHasDatabaseError(false);
  };

  /**
   * Filter JSON entries by selected set and attach image URL
   * Apply owned/wanted filters if enabled
   */
  const cards = useMemo<CardWithKey[]>(() => {
    if (!cardsDatabase) return [];

    return Object.entries(cardsDatabase)
      .filter(([, card]) => {
        // Show no cards when 'none' is selected
        if (selectedSet === "none") return false;

        // Apply set filter for specific sets (skip for 'all')
        if (selectedSet !== "all" && card.card_set_base_name !== selectedSet)
          return false;

        // Apply pack filter for specific packs
        if (
          selectedPack !== "all" &&
          ((selectedPack === SHARED_PACK_LABEL &&
            card.card_set_name !== selectedSet.split(" ")[0]) || // match the short name
            (selectedPack !== SHARED_PACK_LABEL &&
              card.card_set_name !== selectedPack))
        ) {
          return false;
        }

        // Apply owned filter if enabled
        if (filterOwned && !card.card_owned) return false;

        // Apply wanted filter if enabled
        if (filterWanted && card.card_desirability <= 0) return false;

        // Apply missing filter if enabled
        if (filterMissing && card.card_owned) return false;

        // Apply trade filter if enabled
        if (filterTrade && !card.card_trade_desirability) return false;

        // Apply name filter if provided
        if (
          nameFilter &&
          !card.card_name.toLowerCase().includes(nameFilter.toLowerCase())
        )
          return false;

        return true;
      })
      .map(([key, card]) => {
        // Always try to get image from card_image_url first
        if (card.card_image_url) {
          return { key, ...card, imageUrl: card.card_image_url };
        }

        // Only fallback to other methods if card_image_url is not available
        if (card.image_url) {
          return { key, ...card, imageUrl: card.image_url };
        }

        // Last resort: fall back to local images
        const imageEntry = Object.entries(images).find(([path]) =>
          path.includes(`${card.card_set_base_name}/${"c" + key}`)
        );
        const imageUrl = imageEntry ? imageEntry[1].default : null;
        return { key, ...card, imageUrl };
      });
  }, [
    selectedSet,
    selectedPack,
    cardsDatabase,
    filterOwned,
    filterWanted,
    filterMissing,
    filterTrade,
    nameFilter,
  ]);

  /**
   * Filter JSON entries by packs
   */
  const availablePacks = useMemo(() => {
    // Use tempSelectedSet when in modal, otherwise use selectedSet
    const currentSet = filterModalOpen ? tempSelectedSet : selectedSet;

    if (!cardsDatabase || currentSet === "none" || currentSet === "all") {
      return [];
    }
    
    const packs = new Set<string>();
    let hasSubsets = false;
    let hasNonCoreCards = false;

    Object.values(cardsDatabase).forEach((card) => {
      if (card.card_set_base_name === currentSet) {
        const packName = card.card_set_name;
        const baseSetPrefix = currentSet.split(" ")[0]; // "Genetic Apex" → "Genetic"

        if (packName === baseSetPrefix) {
          hasSubsets = true;
          packs.add(SHARED_PACK_LABEL);
        } else {
          hasNonCoreCards = true;
          packs.add(packName);
        }
      }
    });

    // Only show dropdown if we have actual subsets (not just core pool)
    if (!hasNonCoreCards || packs.size === 0) {
      return [];
    }

    // If we found subsets, make sure to include the core pool
    if (hasSubsets) {
      packs.add(SHARED_PACK_LABEL);
    }

    const sortedPacks = Array.from(packs).sort((a, b) => {
      // Always put Core Pool last in sort
      if (a === SHARED_PACK_LABEL) return 1;
      if (b === SHARED_PACK_LABEL) return -1;
      return a.localeCompare(b);
    });

    return sortedPacks;
  }, [cardsDatabase, selectedSet, tempSelectedSet, filterModalOpen]);

  // Cache images when they're loaded
  const cacheImage = useCallback((url: string) => {
    if (!imageCache.has(url)) {
      // Create a function to cache the image after it loads
      const img = new Image();
      img.onload = () => {
        imageCache.set(url, url);
        // You could add more functionality here if needed
        // like storing in localStorage or IndexedDB for persistence
      };
      img.src = url;
    }
  }, []);

  // Preload and cache images when the set changes
  useEffect(() => {
    if (!isChangingSet && !isLoading && cardsDatabase) {
      // Preload and cache all images in the current set
      cards.forEach((card) => {
        if (card.imageUrl && card.card_image_url) {
          cacheImage(card.imageUrl);
        }
      });
    }
  }, [cards, isChangingSet, isLoading, cacheImage, cardsDatabase]);

  // Replace with this simpler implementation that only responds to set changes
  useEffect(() => {
    if (cardsDatabase && !isLoading) {
      setIsChangingSet(true);
      const timer = setTimeout(() => {
        setIsChangingSet(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [selectedSet]); // Only depend on selectedSet

  /**
   * Handle set change from dropdown
   * @param {React.ChangeEvent<HTMLSelectElement>} e - Select change event
   */
  const handleSetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTempSelectedSet(e.target.value);
    setTempSelectedPack("all");
  };

  /**
   * Open modal with card details
   * @param {string} key - Card key to display in modal
   */
  const openModal = (key: string): void => setModalCardKey(key);

  /**
   * Close the card details modal
   */
  const closeModal = (): void => setModalCardKey(null);

  /**
   * Find the modal card details from the cards array
   */
  const modalCard = modalCardKey
    ? cards.find((c) => c.key === modalCardKey)
    : null;

  /**
   * Handle image loading error by falling back to local images
   * @param {React.SyntheticEvent<HTMLImageElement>} e - Image error event
   * @param {CardWithKey} card - Card object for which image failed to load
   */
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement>,
    card: CardWithKey
  ) => {
    // Try to fall back to local images
    const imageEntry = Object.entries(images).find(([path]) =>
      path.includes(`${selectedSet}/${"c" + card.key}`)
    );

    if (imageEntry) {
      e.currentTarget.src = imageEntry[1].default;
    } else {
      // If no local image either, use a placeholder
      e.currentTarget.src =
        "https://via.placeholder.com/245x342?text=Image+Not+Found";
    }
  };

  /**
   * Handle owned status change
   * @param {string} cardKey - Key of the card to update
   * @param {boolean} isOwned - New owned status
   */
  const handleOwnedChange = (cardKey: string, isOwned: boolean): void => {
    if (!cardsDatabase) return;

    // Update in-memory database
    const updatedDb = {
      ...cardsDatabase,
      [cardKey]: {
        ...cardsDatabase[cardKey],
        card_owned: isOwned,
      },
    };

    // Save to storage
    saveDatabase(updatedDb);

    // Update state
    setCardsDatabase(updatedDb);
  };

  /**
   * Handle wanted status change
   * @param {string} cardKey - Key of the card to update
   * @param {boolean} isWanted - New wanted status
   */
  const handleWantedChange = (cardKey: string, isWanted: boolean): void => {
    if (!cardsDatabase) return;

    const card = cardsDatabase[cardKey];

    // Calculate new desirability if card is wanted
    const newDesirability =
      isWanted && card.card_obtainable
        ? calculateDesirabilityFromRarity(card.card_rarity)
        : 0;

    // Update trade desirability if card is tradable
    const newTradeDesirability = isWanted && card.card_tradable ? true : false;

    // Update in-memory database
    const updatedDb = {
      ...cardsDatabase,
      [cardKey]: {
        ...cardsDatabase[cardKey],
        card_desirability: newDesirability,
        card_trade_desirability: newTradeDesirability,
      },
    };

    // Save to storage
    saveDatabase(updatedDb);

    // Update state
    setCardsDatabase(updatedDb);
  };

  /**
   * Toggle owned status by clicking the button
   * @param {React.MouseEvent} e - Click event
   * @param {string} cardKey - Key of the card to toggle
   */
  const toggleOwned = (e: React.MouseEvent, cardKey: string): void => {
    if (!cardsDatabase) return;

    e.stopPropagation(); // Prevent opening the modal
    const card = cardsDatabase[cardKey];
    handleOwnedChange(cardKey, !card.card_owned);
  };

  /**
   * Toggle wanted status by clicking the button
   * @param {React.MouseEvent} e - Click event
   * @param {string} cardKey - Key of the card to toggle
   */
  const toggleWanted = (e: React.MouseEvent, cardKey: string): void => {
    if (!cardsDatabase) return;

    e.stopPropagation(); // Prevent opening the modal
    const card = cardsDatabase[cardKey];
    if (card.card_obtainable || card.card_tradable) {
      handleWantedChange(cardKey, card.card_desirability === 0);
    }
  };

  /**
   * Toggle trade desirability status by clicking the button
   * @param {React.MouseEvent} e - Click event
   * @param {string} cardKey - Key of the card to toggle
   */
  const toggleTrade = (e: React.MouseEvent, cardKey: string): void => {
    if (!cardsDatabase) return;

    e.stopPropagation(); // Prevent opening the modal
    const card = cardsDatabase[cardKey];

    const updatedDb = {
      ...cardsDatabase,
      [cardKey]: {
        ...card,
        card_trade_desirability: !card.card_trade_desirability,
      },
    };

    saveDatabase(updatedDb);
    setCardsDatabase(updatedDb);
  };

  /**
   * Handle export button click to download database
   */
  const handleExportClick = async (): Promise<void> => {
    if (!cardsDatabase) return;

    setIsSaving(true);
    try {
      await downloadDatabaseAsFile(cardsDatabase);
    } catch (error) {
      console.error("Error exporting database:", error);
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  /**
   * Handle import button click to import a database from a file
   */
  const handleImportClick = async (): Promise<void> => {
    try {
      const importedDb = await importDatabaseFromFile();
      setCardsDatabase(importedDb);
      setHasDatabaseError(false);
    } catch (error) {
      console.error("Error importing database:", error);
    }
  };

  /**
   * Handle filter changes
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
   */
  const handleTempFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, checked } = e.target;
    if (name === "owned") setTempFilterOwned(checked);
    if (name === "wanted") setTempFilterWanted(checked);
    if (name === "missing") setTempFilterMissing(checked);
    if (name === "trade") setTempFilterTrade(checked);
  };

  /**
   * Handle name filter change
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
   */
  const handleNameFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setNameFilter(e.target.value);
  };

  // Add function to apply filters
  const applyFilters = () => {
    setSelectedSet(tempSelectedSet);
    setSelectedPack(tempSelectedPack);
    setFilterMissing(tempFilterMissing);
    setFilterOwned(tempFilterOwned);
    setFilterWanted(tempFilterWanted);
    setFilterTrade(tempFilterTrade);
    setFilterModalOpen(false);
  };

  // Add function to reset temp filters
  const resetFilters = () => {
    setTempSelectedSet("none");
    setTempSelectedPack("all");
    setTempFilterMissing(false);
    setTempFilterOwned(false);
    setTempFilterWanted(false);
    setTempFilterTrade(false);
  };

  // Add function to handle modal close/cancel
  const handleModalClose = () => {
    // Reset temp values to current values
    setTempSelectedSet(selectedSet);
    setTempSelectedPack(selectedPack);
    setTempFilterMissing(filterMissing);
    setTempFilterOwned(filterOwned);
    setTempFilterWanted(filterWanted);
    setTempFilterTrade(filterTrade);
    setFilterModalOpen(false);
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading cards database...</p>
      </div>
    );
  }

  // Show the import modal if no database is found
  if (hasDatabaseError || !cardsDatabase) {
    return <NoDatabaseModal onDatabaseImported={handleDatabaseImported} />;
  }

  return (
    <div className="card-gallery-scroll-wrapper">
      <div className="card-gallery-container">
        <div className="gallery-header">
          <div className="instructions instructions-container">
            <div
              className="instructions-header"
              onClick={() => setInstructionsCollapsed((prev) => !prev)}
            >
              <h3>Card Gallery Instructions:</h3>
              <span className="collapse-btn">
                {instructionsCollapsed ? "▼" : "▲"}
              </span>
            </div>
            {!instructionsCollapsed && (
              <ul>
                <li>Select a card set from the dropdown menu</li>
                <li>Use the filters to show only owned or wanted cards</li>
                <li>Click on any card to mark it as owned or wanted</li>
                <li>Use the buttons on each card to quickly toggle status</li>
                <li>Use the Export button to download your collection</li>
                <li>Use the Import button to load a saved collection</li>
              </ul>
            )}
          </div>
          <div className="gallery-controls-container">
            <div className="card-size-slider">
              <label htmlFor="cardWidthSlider" style={{ marginRight: "10px" }}>
                Card Size:
              </label>
              <input
                id="cardWidthSlider"
                type="range"
                min={150}
                max={300}
                step={5}
                value={cardWidth}
                onChange={(e) => setCardWidth(Number(e.target.value))}
              />
            </div>
            <div className="left-controls controls-flex">
              <div className="filter-container">
                <div className="filter-row">
                  <div className="search-field">
                    <input
                      type="text"
                      placeholder="Filter by name..."
                      value={nameFilter}
                      onChange={handleNameFilterChange}
                      className="name-filter"
                    />
                    {nameFilter && (
                      <button
                        className="clear-button"
                        onClick={() => setNameFilter("")}
                        title="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <button
                    className="action-button filter-button"
                    onClick={() => setFilterModalOpen(true)}
                  >
                    Filter Options
                  </button>
                </div>
              </div>
            </div>

            <div className="right-controls">
              <button
                className="icon-button export-button"
                onClick={handleExportClick}
                disabled={isSaving}
                title="Export Database"
              >
                {isSaving ? "⏳" : "📤"}
              </button>
              <button
                className="icon-button import-button"
                onClick={handleImportClick}
                title="Import Database"
              >
                📥
              </button>
            </div>
          </div>
        </div>

        {isChangingSet ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading cards...</p>
          </div>
        ) : (
          <div
            className="card-grid"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${cardWidth}px, 1fr))`,
            }}
          >
            {cards.length > 0 ? (
              cards.map((card) =>
                card.imageUrl ? (
                  <div
                    key={card.key}
                    className="card-wrapper"
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardWidth * 1.5}px`,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      opacity: card.card_owned ? 1 : 0.4,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      className="card-container"
                      style={{
                        width: "100%",
                        height: "100%",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.card_name}
                        className="card-thumb"
                        style={{
                          width: "100%",
                          height: "auto",
                          boxShadow: [
                            card.card_desirability > 0
                              ? "0 0 15px 4px rgba(255, 215, 0, 1)"
                              : "",
                            card.card_trade_desirability
                              ? "0 0 15px 4px rgba(56, 189, 248, 1)"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(", "),
                          transition: "transform 0.2s ease",
                        }}
                        onClick={() => openModal(card.key)}
                        onLoad={() =>
                          card.card_image_url && cacheImage(card.card_image_url)
                        }
                        onError={(e) => handleImageError(e, card)}
                      />

                      <div className="card-status-panel">
                        {/* Owned */}
                        <button
                          className={`status-btn owned-btn ${
                            card.card_owned ? "active" : ""
                          }`}
                          title={
                            card.card_owned
                              ? "Owned - Click to toggle"
                              : "Not owned - Click to toggle"
                          }
                          onClick={(e) => toggleOwned(e, card.key)}
                          style={{
                            width: `${24 * (cardWidth / 185)}px`,
                            height: `${24 * (cardWidth / 185)}px`,
                            fontSize: `${12 * (cardWidth / 185)}px`,
                            transition: "all 0.2s ease",
                          }}
                        >
                          ✓
                        </button>

                        {/* Wanted */}
                        {(card.card_obtainable || card.card_tradable) && (
                          <button
                            className={`status-btn wanted-btn ${
                              card.card_desirability > 0 ? "active" : ""
                            }`}
                            title={
                              card.card_desirability > 0
                                ? "Wanted - Click to toggle"
                                : "Not wanted - Click to toggle"
                            }
                            onClick={(e) => toggleWanted(e, card.key)}
                            style={{
                              width: `${24 * (cardWidth / 185)}px`,
                              height: `${24 * (cardWidth / 185)}px`,
                              fontSize: `${12 * (cardWidth / 185)}px`,
                              transition: "all 0.2s ease",
                            }}
                          >
                            ★
                          </button>
                        )}

                        {/* Trade */}
                        {card.card_tradable && (
                          <button
                            className={`status-btn trade-btn ${
                              card.card_trade_desirability ? "active" : ""
                            }`}
                            title={
                              card.card_trade_desirability
                                ? "Marked for Trade - Click to toggle"
                                : "Not for Trade - Click to toggle"
                            }
                            onClick={(e) => toggleTrade(e, card.key)}
                            style={{
                              width: `${24 * (cardWidth / 185)}px`,
                              height: `${24 * (cardWidth / 185)}px`,
                              fontSize: `${12 * (cardWidth / 185)}px`,
                              transition: "all 0.2s ease",
                            }}
                          >
                            ↻
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null
              )
            ) : (
              <div className="no-results">
                <p>No cards found with the current filters.</p>
                <p>Try changing the set or adjusting the filters.</p>
              </div>
            )}
          </div>
        )}

        {filterModalOpen && (
          <div className="modal-overlay" onClick={handleModalClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={handleModalClose}>
                ×
              </button>
              <h2>Filter Options</h2>

              <div className="modal-body">
                <div className="filter-options">
                  <select
                    value={tempSelectedSet}
                    onChange={handleSetChange}
                    disabled={isChangingSet || isSaving}
                  >
                    <option value="none">Select a set</option>
                    <option value="all">All sets</option>
                    <option value="" disabled>
                      ──────────
                    </option>
                    {CARD_SETS.map((set) => (
                      <option key={set} value={set}>
                        {set}
                      </option>
                    ))}
                  </select>

                  {availablePacks.length > 0 && (
                    <select
                      value={tempSelectedPack}
                      onChange={(e) => setTempSelectedPack(e.target.value)}
                      disabled={isChangingSet || isSaving}
                    >
                      <option value="all">All Packs</option>
                      <option disabled>──────────</option>
                      {availablePacks.map((pack) => (
                        <option key={pack} value={pack}>
                          {pack}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="modal-checkboxes">
                    <label>
                      <input
                        type="checkbox"
                        name="missing"
                        checked={tempFilterMissing}
                        onChange={handleTempFilterChange}
                      />
                      Missing
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="owned"
                        checked={tempFilterOwned}
                        onChange={handleTempFilterChange}
                      />
                      Owned
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="wanted"
                        checked={tempFilterWanted}
                        onChange={handleTempFilterChange}
                      />
                      Wanted
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="trade"
                        checked={tempFilterTrade}
                        onChange={handleTempFilterChange}
                      />
                      Trade
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={resetFilters}>Reset Filters</button>
                <button onClick={handleModalClose}>Cancel</button>
                <button onClick={applyFilters}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {modalCard && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={closeModal}>
                ×
              </button>
              <img
                src={modalCard.imageUrl || ""}
                alt={modalCard.card_name}
                onError={(e) => handleImageError(e, modalCard)}
              />
              <div className="modal-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={modalCard.card_owned}
                    onChange={(e) =>
                      handleOwnedChange(modalCard.key, e.target.checked)
                    }
                  />
                  Owned
                </label>

                {/* Only show wanted checkbox if card is obtainable or tradable */}
                {(modalCard.card_obtainable || modalCard.card_tradable) && (
                  <label>
                    <input
                      type="checkbox"
                      checked={modalCard.card_desirability > 0}
                      onChange={(e) =>
                        handleWantedChange(modalCard.key, e.target.checked)
                      }
                    />
                    Wanted
                  </label>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardGallery;
