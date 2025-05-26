/**
 * PackSharing.tsx
 *
 * A React component that allows users to view, filter, and share saved card packs.
 * Packs can be shared individually or in bulk. Packs are organized into "Ready to Share" and "Expired" sections.
 * Sharing updates each pack's `last_shared_timestamp`.
 */

import React, { useState, useEffect } from "react";
import savedPacksJson from "../json/saved_packs.json";
import { processSavedPack, ProcessedPack } from "../utils/cardUtils";
import pokedex from "../json/pokedex.json";
import { getSetIconUrl } from "../utils/setIcons";
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
}

/** Collection of saved packs keyed by unique pack ID */
interface SavedPacksData {
  [key: string]: SavedPack;
}

export const PackSharing: React.FC = () => {
  // === State Definitions ===

  /** Raw saved packs loaded from JSON */
  const [savedPacks, setSavedPacks] = useState<SavedPacksData>(savedPacksJson as SavedPacksData);

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

  // === Lifecycle: Process raw JSON data into usable format ===
  useEffect(() => {
    const processPacks = () => {
      setIsLoading(true);
      const processed: ProcessedPack[] = [];

      Object.entries(savedPacks).forEach(([id, pack]) => {
        const processedPack = processSavedPack(pack, pokedex);
        if (processedPack) {
          processed.push({ ...processedPack, id });
        }
      });

      setProcessedPacks(processed);
      setIsLoading(false);
    };

    processPacks();
  }, [savedPacks]);

  // === Utility: Mark a pack as shared ===
  const sharePack = async (packId: string) => {
    setIsSharing(true);
    setShareStatus(`Sharing pack...`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    setSavedPacks((prev) => ({
      ...prev,
      [packId]: {
        ...prev[packId],
        last_shared_timestamp: Math.floor(Date.now() / 1000),
      },
    }));

    setShareStatus(`Successfully shared pack!`);
    setSummary("");
    setIsSharing(false);
  };

  // === Utility: Mark all packs as shared ===
  const shareAllPacks = async () => {
    setIsSharing(true);
    setShareStatus("Sharing all packs...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const now = Math.floor(Date.now() / 1000);
    const updated = Object.entries(savedPacks).reduce((acc, [packId, pack]) => {
      acc[packId] = { ...pack, last_shared_timestamp: now };
      return acc;
    }, {} as SavedPacksData);

    setSavedPacks(updated);
    setShareStatus("Successfully shared all packs");
    setSummary(`Shared ${Object.keys(savedPacks).length} packs.`);
    setIsSharing(false);
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

    const readyPacks = packs.filter(
      (pack) => !savedPacks[pack.id].last_shared_timestamp ||
        now - savedPacks[pack.id].last_shared_timestamp < 24 * 60 * 60
    );

    const expiredPacks = packs.filter(
      (pack) => savedPacks[pack.id].last_shared_timestamp &&
        now - savedPacks[pack.id].last_shared_timestamp >= 24 * 60 * 60
    );

    return { readyPacks, expiredPacks };
  };

  const { readyPacks, expiredPacks } = filterPacks(processedPacks);

  // === Accordion toggle logic ===
  const handleOpen = (value: number) => {
    setOpenAccordion(openAccordion === value ? 0 : value);
  };

  // === JSX Rendering ===
  return (
    <div className="pack-sharing-container">

      {/* Filter & Control Bar */}
      <div className="pack-controls">
        <div className="filter-container">
          <div className="search-field">
            <input
              type="text"
              placeholder="Filter by name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="name-filter"
            />
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
          onClick={() => {
            /* Future implementation: bulk share selected packs */
          }}
        >
          Share Selected Packs
        </button>

        <button
          className="share-all-button"
          disabled={isSharing}
          onClick={shareAllPacks}
        >
          Share Packs
        </button>
      </div>

      {/* Accordion: Ready Packs */}
      <div className="accordion-section">
        <div
          className={`accordion-header ${openAccordion === 1 ? "open" : ""}`}
          onClick={() => handleOpen(1)}
        >
          Ready To Share Packs
        </div>

        {openAccordion === 1 && (
          <div className="accordion-content">
            <div className="packs-grid">
              {readyPacks.length > 0 ? (
                readyPacks.map((pack) => (
                  <div key={pack.id} className="pack-row">
                    <div className="pack-checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedPacks.has(pack.id)}
                        onChange={() => togglePackSelection(pack.id)}
                      />
                    </div>

                    <div className="pack-info-col">
                      <div className="pack-meta">
                        <img
                          src={getSetIconUrl(pack.set_base_name, pack.set_name)}
                          alt={`${pack.set_base_name} ${pack.set_name}`}
                          className="set-icon"
                        />
                        <div className="pack-details">
                          <div className="nickname">{pack.nickname}</div>
                          <div className="friend-id">{pack.friend_id}</div>
                        </div>
                      </div>
                      <button
                        className="share-pack-button"
                        onClick={() => sharePack(pack.id)}
                        disabled={isSharing}
                      >
                        Share Pack
                      </button>
                    </div>

                    <div className="cards-display-col">
                      {pack.cards.map((card, i) => (
                        <div key={i} className="card-wrapper">
                          <img src={card.image_url} alt={card.name} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No packs ready to share</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accordion: Expired Packs */}
      <div className="accordion-section">
        <div
          className={`accordion-header ${openAccordion === 2 ? "open" : ""}`}
          onClick={() => handleOpen(2)}
        >
          Expired Packs
        </div>

        {openAccordion === 2 && (
          <div className="accordion-content">
            <div className="packs-grid">
              {expiredPacks.length > 0 ? (
                expiredPacks.map((pack) => (
                  <div key={pack.id} className="pack-row">
                    <div className="pack-checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedPacks.has(pack.id)}
                        onChange={() => togglePackSelection(pack.id)}
                      />
                    </div>

                    <div className="pack-info-col">
                      <div className="pack-meta">
                        <img
                          src={getSetIconUrl(pack.set_base_name, pack.set_name)}
                          alt={`${pack.set_base_name} ${pack.set_name}`}
                          className="set-icon"
                        />
                        <div className="pack-details">
                          <div className="nickname">{pack.nickname}</div>
                          <div className="friend-id">{pack.friend_id}</div>
                          <button
                            className="share-pack-button"
                            onClick={() => sharePack(pack.id)}
                            disabled={isSharing}
                          >
                            Share Pack
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="cards-display-col">
                      {pack.cards.map((card, i) => (
                        <div key={i} className="card-wrapper">
                          <img src={card.image_url} alt={card.name} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No expired packs</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Filter Options</h2>
              <button
                className="close-button"
                onClick={() => setFilterModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="filter-options">
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                >
                  <option value="all">All Sets</option>
                  {/* Populate dynamically if needed */}
                </select>

                <select
                  value={minRarity}
                  onChange={(e) => setMinRarity(Number(e.target.value))}
                >
                  <option value="0">Minimum Rarity</option>
                  <option value="1">★</option>
                  <option value="2">★★</option>
                  <option value="3">★★★</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setFilterModalOpen(false)}>Cancel</button>
              <button onClick={() => setFilterModalOpen(false)}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackSharing;
