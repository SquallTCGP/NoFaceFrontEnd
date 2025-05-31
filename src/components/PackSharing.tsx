/**
 * PackSharing.tsx
 *
 * A React component that allows users to view, filter, and share saved card packs.
 * Packs can be shared individually or in bulk. Packs are organized into "Ready to Share" and "Expired" sections.
 * Sharing updates each pack's `last_shared_timestamp`.
 */

import React, { useState, useEffect } from "react";
import savedPacksJson from "../json/saved_packs.json";
import { processSavedPack, ProcessedPack, CARD_SETS } from "../utils/cardUtils";
import PackAccordionContent from "./PackAccordionContent";
import "../assets/styles/PackSharing.scss";

/** Interface representing raw saved pack data from JSON */
interface SavedPack {
  pack: string;
  cards: string[];
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

/** Collection of saved packs keyed by unique pack ID */
interface SavedPacksData {
  [key: string]: SavedPack;
}

export const PackSharing: React.FC = () => {
  // === State Definitions ===

  /** Raw saved packs loaded from JSON */
  const [savedPacks, setSavedPacks] = useState<SavedPacksData>(savedPacksJson as SavedPacksData);

  /** Pokedex data loaded from localStorage */
  const [pokedex, setPokedex] = useState<any>(null);

  /** Packs that are ready to be shared */
  const [packsToShare, setPacksToShare] = useState<SavedPacksData>({});

  /** Processed pack data for rendering */
  const [processedPacks, setProcessedPacks] = useState<ProcessedPack[]>([]);

  /** Tracks if sharing action is currently running */
  const [isSharing, setIsSharing] = useState<boolean>(false);

  /** User-selected packs to share */
  const [selectedPacks, setSelectedPacks] = useState<Set<string>>(new Set());

  /** Indicates loading state while processing packs */
  const [isLoading, setIsLoading] = useState(true);

  /** Status message for user feedback (e.g., success, in progress) */
  const [shareStatus, setShareStatus] = useState<string>("");

  /** Optional summary text after bulk share */
  const [summary, setSummary] = useState<string>("");

  /** Controls which accordion panel is open */
  const [openAccordion, setOpenAccordion] = useState<number>(1);

  /** Filter text for nickname search */
  const [nameFilter, setNameFilter] = useState<string>("");

  /** Controls visibility of filter modal */
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);

  /** Minimum rarity filter (e.g., ★ to ★★★) */
  const [minRarity, setMinRarity] = useState<number>(0);

  /** Currently selected set for filtering */
  const [selectedSet, setSelectedSet] = useState<string>("all");

  /** Filter for number of top cards (0-5) */
  const [topCardsFilter, setTopCardsFilter] = useState<number>(-1);

  // Add these state variables for temporary modal values
  const [tempSelectedSet, setTempSelectedSet] = useState<string>(selectedSet);
  const [tempMinRarity, setTempMinRarity] = useState<number>(minRarity);
  const [tempTopCardsFilter, setTempTopCardsFilter] = useState<number>(topCardsFilter);

  // Add new state for scroll position
  const [showFloatingButtons, setShowFloatingButtons] = useState(false);

  /** Indicates whether the message is visible */
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  /** Indicates whether the message should be hidden */
  const [hideMessage, setHideMessage] = useState(false);

  // === Load pokedex data from localStorage ===
  useEffect(() => {
    const loadPokedex = () => {
      const storedPokedex = localStorage.getItem('cardsDatabase');
      console.log('Attempting to load pokedex from localStorage');
      if (storedPokedex) {
        try {
          const parsedPokedex = JSON.parse(storedPokedex);
          console.log('Successfully loaded pokedex:', Object.keys(parsedPokedex).length, 'cards');
          setPokedex(parsedPokedex);
        } catch (error) {
          console.error('Error parsing pokedex from localStorage:', error);
        }
      } else {
        console.warn('No pokedex found in localStorage with key cardDatabase');
      }
    };

    loadPokedex();
  }, []);

  // === Lifecycle: Process raw JSON data into usable format ===
  useEffect(() => {
    const processPacks = () => {
      // Don't process if pokedex isn't loaded yet
      if (!pokedex) {
        console.log('Waiting for pokedex data to load...');
        return;
      }

      setIsLoading(true);
      console.log('Processing packs with pokedex data');
      const processed: ProcessedPack[] = [];

      Object.entries(savedPacks).forEach(([id, pack]) => {
        console.log('Processing pack:', id);
        const processedPack = processSavedPack(pack, pokedex);
        if (processedPack) {
          processed.push({ ...processedPack, id });
        } else {
          console.warn('Failed to process pack:', id);
        }
      });

      console.log('Processed packs:', processed.length);
      setProcessedPacks(processed);
      setIsLoading(false);
    };

    processPacks();
  }, [savedPacks, pokedex]); // Add pokedex as dependency

  // Update floating buttons visibility based on both scroll and selection
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const shouldShowFromScroll = scrollPosition > 100;
      setShowFloatingButtons(shouldShowFromScroll || selectedPacks.size > 0);
    };

    // Initial check for selected packs
    setShowFloatingButtons(selectedPacks.size > 0);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedPacks.size]); // Add selectedPacks.size as dependency

  // Also update floating buttons when selection changes
  useEffect(() => {
    setShowFloatingButtons(selectedPacks.size > 0);
  }, [selectedPacks.size]);

  // Function to show message with auto-hide
  const showStatusMessage = (status: string, summaryText: string = "") => {
    setShareStatus(status);
    setSummary(summaryText);
    setIsMessageVisible(true);
    setHideMessage(false);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setHideMessage(true);
      // Clear the message after animation
      setTimeout(() => {
        setIsMessageVisible(false);
        setShareStatus("");
        setSummary("");
        setHideMessage(false);
      }, 500);
    }, 3000);
  };

  // === Utility: Mark a pack as shared ===
  const sharePack = async (packId: string) => {
    setIsSharing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Update savedPacks state
    setSavedPacks((prev) => ({
      ...prev,
      [packId]: {
        ...prev[packId],
        last_shared_timestamp: currentTimestamp,
      },
    }));

    // Update packsToShare state
    setPacksToShare((prev) => {
      const newPacksToShare = {
        ...prev,
        [packId]: {
          ...savedPacks[packId],
          last_shared_timestamp: currentTimestamp,
        },
      };
      console.log('Packs to share after single pack share:', newPacksToShare);
      return newPacksToShare;
    });

    showStatusMessage("Successfully shared pack!");
    setIsSharing(false);
  };

  // === Utility: Mark all filtered, non-expired packs as shared
  const shareAllPacks = async () => {
    setIsSharing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { readyPacks } = filterPacks(processedPacks);
    
    if (readyPacks.length === 0) {
      showStatusMessage(
        "No packs to share",
        "No packs match the current filters or all packs are expired."
      );
      setIsSharing(false);
      return;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const updatedPacks = { ...savedPacks };
    const newPacksToShare = { ...packsToShare };

    readyPacks.forEach(pack => {
      updatedPacks[pack.id].last_shared_timestamp = currentTimestamp;
      newPacksToShare[pack.id] = {
        ...updatedPacks[pack.id],
        last_shared_timestamp: currentTimestamp,
      };
    });

    setSavedPacks(updatedPacks);
    setPacksToShare(newPacksToShare);
    setSelectedPacks(new Set()); // Clear selected packs after sharing all

    showStatusMessage(
      "Successfully shared filtered packs",
      `Shared ${readyPacks.length} packs.`
    );
    setIsSharing(false);
  };

  // === Utility: Share selected packs ===
  const shareSelectedPacks = async () => {
    setIsSharing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const updatedPacks = { ...savedPacks };
    const newPacksToShare = { ...packsToShare };

    selectedPacks.forEach(packId => {
      updatedPacks[packId].last_shared_timestamp = currentTimestamp;
      newPacksToShare[packId] = {
        ...updatedPacks[packId],
        last_shared_timestamp: currentTimestamp,
      };
    });

    setSavedPacks(updatedPacks);
    setPacksToShare(newPacksToShare);
    console.log('Packs to share after sharing selected packs:', newPacksToShare);

    showStatusMessage(
      "Successfully shared selected packs",
      `Shared ${selectedPacks.size} packs.`
    );
    setIsSharing(false);
    setSelectedPacks(new Set());
  };

  // === Utility: Select all packs in a section ===
  const selectAllInSection = (packs: ProcessedPack[]) => {
    const newSelected = new Set(selectedPacks);
    packs.forEach(pack => newSelected.add(pack.id));
    setSelectedPacks(newSelected);
  };

  // === Utility: Deselect all packs in a section ===
  const deselectAllInSection = (packs: ProcessedPack[]) => {
    const newSelected = new Set(selectedPacks);
    packs.forEach(pack => newSelected.delete(pack.id));
    setSelectedPacks(newSelected);
  };

  // === UI Interaction: Toggle pack selection state ===
  const togglePackSelection = (packId: string) => {
    const newSelected = new Set(selectedPacks);
    newSelected.has(packId) ? newSelected.delete(packId) : newSelected.add(packId);
    setSelectedPacks(newSelected);
  };

  // === Utility: Split processed packs into "ready" and "expired" based on timestamp ===
  const filterPacks = (packs: ProcessedPack[]) => {
    const now = Math.floor(Date.now() / 1000);
    const SHARE_COOLDOWN = 432000; // 5 days in seconds

    // Apply name filter first if set
    const filteredByName = nameFilter
      ? packs.filter(pack => 
          pack.cards.some(card => 
            card.name.toLowerCase().includes(nameFilter.toLowerCase())
          )
        )
      : packs;

    // Apply set filter if not "all"
    const filteredBySet = selectedSet === "all" || selectedSet === "none"
      ? filteredByName
      : filteredByName.filter(pack => 
          pack.set_base_name === selectedSet
        );

    // Apply minimum rarity filter based on star levels
    const filteredByRarity = minRarity === 0
      ? filteredBySet
      : filteredBySet.filter(pack => {
          switch (minRarity) {
            case 5: // ☆ (1 Star)
              // At least one card of rarity 5
              return pack.cards.some(card => card.rarity === 5);
            
            case 6: // ☆☆ (2 Stars)
              // All cards must be rarity 6 or higher
              return pack.cards.every(card => card.rarity >= 6);
            
            case 7: // ★★ (Rainbow 2 Stars)
              // All cards must be rarity 7
              return pack.cards.every(card => card.rarity === 7);
            
            default:
              return true;
          }
        });

    // Apply top cards filter
    const filteredByTopCards = topCardsFilter === -1 
      ? filteredByRarity 
      : filteredByRarity.filter(pack => pack.top_cards_count === topCardsFilter);

    // Split into ready and expired packs based on last_shared_timestamp
    const readyPacks = filteredByTopCards.filter(
      (pack) => now - pack.last_shared_timestamp > SHARE_COOLDOWN
    );

    const expiredPacks = filteredByTopCards.filter(
      (pack) => now - pack.last_shared_timestamp <= SHARE_COOLDOWN
    ).sort((a, b) => b.last_shared_timestamp - a.last_shared_timestamp);

    return { readyPacks, expiredPacks };
  };

  const { readyPacks, expiredPacks } = filterPacks(processedPacks);

  // === Accordion toggle logic ===
  const handleOpen = (value: number) => {
    setOpenAccordion(openAccordion === value ? 0 : value);
  };

  // === Function to apply filters
  const applyFilters = () => {
    setSelectedSet(tempSelectedSet);
    setMinRarity(tempMinRarity);
    setTopCardsFilter(tempTopCardsFilter);
    setFilterModalOpen(false);
  };

  // === Function to handle modal close/cancel
  const handleModalClose = () => {
    // Reset temp values to current values
    setTempSelectedSet(selectedSet);
    setTempMinRarity(minRarity);
    setTempTopCardsFilter(topCardsFilter);
    setFilterModalOpen(false);
  };

  // === Utility: Reset filters to default values ===
  const resetFilters = () => {
    setTempSelectedSet("all");
    setTempMinRarity(0);
    setTempTopCardsFilter(-1);
  };

  // === JSX Rendering ===
  return (
    <div className="pack-sharing-container">
      {/* Status Message */}
      {isMessageVisible && (
        <div className={`status-message ${hideMessage ? 'hide' : ''}`}>
          {shareStatus}
          {summary && <div className="summary">{summary}</div>}
        </div>
      )}

      {/* Filter & Control Bar */}
      <div className="pack-controls">
        <div className="filter-container">
          <div className="search-field">
            <input
              type="text"
              placeholder="Filter by name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
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
            className="filter-button pack-sharing-button"
            onClick={() => setFilterModalOpen(true)}
          >
            Filter Options
          </button>
        </div>

        <div className="packs-count">Packs To Share: {selectedPacks.size}</div>

        <button
          className="share-selected-button"
          disabled={selectedPacks.size === 0 || isSharing}
          onClick={shareSelectedPacks}
        >
          Share Selected
        </button>

        <button
          className="share-all-button"
          disabled={isSharing}
          onClick={shareAllPacks}
        >
          Share All
        </button>
      </div>

      {/* Floating Button Container - Show when packs are selected */}
      {showFloatingButtons && (
        <div className="floating-buttons-container">
          <div className="floating-buttons-content">
            <div className="packs-count">Selected: {selectedPacks.size}</div>
            <button
              className="share-selected-button"
              disabled={selectedPacks.size === 0 || isSharing}
              onClick={shareSelectedPacks}
            >
              Share Selected
            </button>
            <button
              className="share-all-button"
              disabled={isSharing}
              onClick={shareAllPacks}
            >
              Share All
            </button>
          </div>
        </div>
      )}

      {/* Accordion: Ready Packs */}
      <div className="accordion-section">
        <div
          className={`accordion-header ${openAccordion === 1 ? "open" : ""}`}
          onClick={() => handleOpen(1)}
        >
          <div className="header-content">
            <span className="arrow-indicator">▼</span>
            <span>Ready To Share Packs ({readyPacks.length})</span>
          </div>
          {openAccordion === 1 && (
            <div className="select-all-container" onClick={e => e.stopPropagation()}>
              <button
                className="select-all-button"
                onClick={() => {
                  const allSelected = readyPacks.every(pack => selectedPacks.has(pack.id));
                  allSelected ? deselectAllInSection(readyPacks) : selectAllInSection(readyPacks);
                }}
              >
                {readyPacks.every(pack => selectedPacks.has(pack.id)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
        </div>

        {openAccordion === 1 && (
          <PackAccordionContent
            packs={readyPacks}
            selectedPacks={selectedPacks}
            isSharing={isSharing}
            onToggleSelection={togglePackSelection}
            onSharePack={sharePack}
            isExpiredSection={false}
          />
        )}
      </div>

      {/* Accordion: Expired Packs */}
      <div className="accordion-section">
        <div
          className={`accordion-header ${openAccordion === 2 ? "open" : ""}`}
          onClick={() => handleOpen(2)}
        >
          <div className="header-content">
            <span className="arrow-indicator">▼</span>
            <span>Expired Packs ({expiredPacks.length})</span>
          </div>
          {openAccordion === 2 && (
            <div className="select-all-container" onClick={e => e.stopPropagation()}>
              <button
                className="select-all-button"
                onClick={() => {
                  const allSelected = expiredPacks.every(pack => selectedPacks.has(pack.id));
                  allSelected ? deselectAllInSection(expiredPacks) : selectAllInSection(expiredPacks);
                }}
              >
                {expiredPacks.every(pack => selectedPacks.has(pack.id)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
        </div>

        {openAccordion === 2 && (
          <PackAccordionContent
            packs={expiredPacks}
            selectedPacks={selectedPacks}
            isSharing={isSharing}
            onToggleSelection={togglePackSelection}
            onSharePack={sharePack}
            isExpiredSection={true}
          />
        )}
      </div>

      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleModalClose}>×</button>
            <h2>Filter Options</h2>

            <div className="modal-body">
              <div className="filter-options">
                <select
                  value={tempSelectedSet}
                  onChange={(e) => setTempSelectedSet(e.target.value)}
                >
                  <option value="none">Select a set</option>
                  <option value="all">All sets</option>
                  <option value="" disabled>──────────</option>
                  {CARD_SETS.map(set => (
                    <option key={set} value={set}>{set}</option>
                  ))}
                </select>

                <select
                  value={tempMinRarity}
                  onChange={(e) => setTempMinRarity(Number(e.target.value))}
                >
                  <option value="0">Minimum Rarity</option>
                  <option value="5">☆ (1 Star)</option>
                  <option value="6">☆☆ (2 Stars)</option>
                  <option value="7">★★ (Rainbow 2 Stars)</option>
                </select>

                <select
                  value={tempTopCardsFilter}
                  onChange={(e) => setTempTopCardsFilter(Number(e.target.value))}
                  className="top-cards-filter"
                >
                  <option value="-1">Any Number of Top Cards</option>
                  <option value="0">0/5</option>
                  <option value="1">1/5</option>
                  <option value="2">2/5</option>
                  <option value="3">3/5</option>
                  <option value="4">4/5</option>
                  <option value="5">5/5</option>
                </select>
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
    </div>
  );
};

export default PackSharing;
