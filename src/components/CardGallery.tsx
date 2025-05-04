import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { calculateDesirabilityFromRarity } from '../utils/cardUtils'
import { loadDatabase, saveDatabase, downloadDatabaseAsFile, importDatabaseFromFile, databaseExists } from '../utils/dbUtils'
import { Card, CardWithKey, CardsDatabase } from '../types'
import { CARD_SETS } from '../utils/cardUtils'
import NoDatabaseModal from './NoDatabaseModal'

// Define the type for the imported images
type ImageModule = { default: string };
type ImageModules = Record<string, ImageModule>;

// @ts-ignore - The glob import pattern is provided by Vite
const images = import.meta.glob<ImageModule>('../assets/card-images/*/*.png', { eager: true }) as ImageModules

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
  const [selectedSet, setSelectedSet] = useState<string>(CARD_SETS[0])
  const [modalCardKey, setModalCardKey] = useState<string | null>(null)
  const [cardsDatabase, setCardsDatabase] = useState<CardsDatabase | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isChangingSet, setIsChangingSet] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [hasDatabaseError, setHasDatabaseError] = useState<boolean>(false)
  const [filterOwned, setFilterOwned] = useState<boolean>(false)
  const [filterWanted, setFilterWanted] = useState<boolean>(false)
  const [instructionsCollapsed, setInstructionsCollapsed] = useState<boolean>(true)
  const [nameFilter, setNameFilter] = useState<string>('')

  /**
   * Load database on component mount
   */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      // Check if a database exists in localStorage
      if (databaseExists()) {
        const db = await loadDatabase()
        setCardsDatabase(db)
        setHasDatabaseError(false)
      } else {
        // No database found, user will need to import one
        setCardsDatabase(null)
        setHasDatabaseError(true)
      }
    } catch (error) {
      console.error('Error loading database:', error)
      setHasDatabaseError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  /**
   * Handle database import
   * @param {CardsDatabase} database - The imported database
   */
  const handleDatabaseImported = (database: CardsDatabase) => {
    setCardsDatabase(database)
    setHasDatabaseError(false)
  }

  /**
   * Filter JSON entries by selected set and attach image URL
   * Apply owned/wanted filters if enabled
   */
  const cards = useMemo<CardWithKey[]>(() => {
    if (!cardsDatabase) return []
    
    return Object.entries(cardsDatabase)
      .filter(([, card]) => {
        // Apply set filter
        if (card.card_set_base_name !== selectedSet) return false
        
        // Apply owned filter if enabled
        if (filterOwned && !card.card_owned) return false
        
        // Apply wanted filter if enabled
        if (filterWanted && card.card_desirability <= 0) return false
        
        // Apply name filter if provided
        if (nameFilter && !card.card_name.toLowerCase().includes(nameFilter.toLowerCase())) return false
        
        return true
      })
      .map(([key, card]) => {
        // Always try to get image from card_image_url first
        if (card.card_image_url) {
          console.log(`Using remote URL for ${card.card_name}: ${card.card_image_url}`);
          return { key, ...card, imageUrl: card.card_image_url };
        }
        
        // Only fallback to other methods if card_image_url is not available
        if (card.image_url) {
          return { key, ...card, imageUrl: card.image_url };
        }
        
        // Last resort: fall back to local images
        const imageEntry = Object.entries(images).find(
          ([path]) => path.includes(`${selectedSet}/${'c' + key}`)
        )
        const imageUrl = imageEntry ? imageEntry[1].default : null
        return { key, ...card, imageUrl }
      })
  }, [selectedSet, cardsDatabase, filterOwned, filterWanted, nameFilter])

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
      cards.forEach(card => {
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
    setSelectedSet(e.target.value)
  }

  /**
   * Open modal with card details
   * @param {string} key - Card key to display in modal
   */
  const openModal = (key: string): void => setModalCardKey(key)
  
  /**
   * Close the card details modal
   */
  const closeModal = (): void => setModalCardKey(null)

  /**
   * Find the modal card details from the cards array
   */
  const modalCard = modalCardKey
    ? cards.find(c => c.key === modalCardKey)
    : null

  /**
   * Handle image loading error by falling back to local images
   * @param {React.SyntheticEvent<HTMLImageElement>} e - Image error event
   * @param {CardWithKey} card - Card object for which image failed to load
   */
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, card: CardWithKey) => {
    // Try to fall back to local images
    const imageEntry = Object.entries(images).find(
      ([path]) => path.includes(`${selectedSet}/${'c' + card.key}`)
    );
    
    if (imageEntry) {
      e.currentTarget.src = imageEntry[1].default;
    } else {
      // If no local image either, use a placeholder
      e.currentTarget.src = 'https://via.placeholder.com/245x342?text=Image+Not+Found';
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
        card_owned: isOwned
      }
    }
    
    // Save to storage
    saveDatabase(updatedDb)
    
    // Update state
    setCardsDatabase(updatedDb)
  }

  /**
   * Handle wanted status change
   * @param {string} cardKey - Key of the card to update
   * @param {boolean} isWanted - New wanted status
   */
  const handleWantedChange = (cardKey: string, isWanted: boolean): void => {
    if (!cardsDatabase) return;
    
    const card = cardsDatabase[cardKey]
    
    // Calculate new desirability if card is wanted
    const newDesirability = isWanted && card.card_obtainable 
      ? calculateDesirabilityFromRarity(card.card_rarity) 
      : 0
    
    // Update trade desirability if card is tradable
    const newTradeDesirability = isWanted && card.card_tradable 
      ? true 
      : false
    
    // Update in-memory database
    const updatedDb = {
      ...cardsDatabase,
      [cardKey]: {
        ...cardsDatabase[cardKey],
        card_desirability: newDesirability,
        card_trade_desirability: newTradeDesirability
      }
    }
    
    // Save to storage
    saveDatabase(updatedDb)
    
    // Update state
    setCardsDatabase(updatedDb)
  }

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
  }

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
  }

  /**
   * Handle export button click to download database
   */
  const handleExportClick = async (): Promise<void> => {
    if (!cardsDatabase) return;
    
    setIsSaving(true);
    try {
      await downloadDatabaseAsFile(cardsDatabase);
    } catch (error) {
      console.error('Error exporting database:', error);
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  }

  /**
   * Handle import button click to import a database from a file
   */
  const handleImportClick = async (): Promise<void> => {
    try {
      const importedDb = await importDatabaseFromFile();
      setCardsDatabase(importedDb);
      setHasDatabaseError(false);
    } catch (error) {
      console.error('Error importing database:', error);
    }
  }

  /**
   * Handle filter changes
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
   */
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, checked } = e.target;
    if (name === 'owned') setFilterOwned(checked);
    if (name === 'wanted') setFilterWanted(checked);
  }
  
  /**
   * Handle name filter change
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
   */
  const handleNameFilterChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setNameFilter(e.target.value);
  }

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
    <div className="card-gallery-container">
      <div className="instructions instructions-container">
        <div className="instructions-header" onClick={() => setInstructionsCollapsed(prev => !prev)}>
          <h3>Card Gallery Instructions:</h3>
          <span className="collapse-btn">
            {instructionsCollapsed ? '▼' : '▲'}
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
        <div className="left-controls controls-flex">
          <select
            value={selectedSet}
            onChange={handleSetChange}
            disabled={isChangingSet || isSaving}
          >
            {CARD_SETS.map(set => (
              <option key={set} value={set}>
                {set}
              </option>
            ))}
          </select>
          
          <div className="filter-container">
            <div className="filter-row">
              <input
                type="text"
                placeholder="Filter by name..."
                value={nameFilter}
                onChange={handleNameFilterChange}
                className="name-filter"
              />
              
              <div className="filter-checkboxes">
                <label className="filter-label">
                  <input
                    type="checkbox"
                    name="owned"
                    checked={filterOwned}
                    onChange={handleFilterChange}
                  />
                  Owned Cards
                </label>
                <label className="filter-label">
                  <input
                    type="checkbox"
                    name="wanted"
                    checked={filterWanted}
                    onChange={handleFilterChange}
                  />
                  Wanted Cards
                </label>
              </div>
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
            {isSaving ? '⏳' : '📤'}
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

      {isChangingSet ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading cards...</p>
        </div>
      ) : (
        <div className="card-grid">
          {cards.length > 0 ? cards.map(card =>
            card.imageUrl ? (
              <div key={card.key} className="card-container">
                <img
                  src={card.imageUrl}
                  alt={card.card_name}
                  className="card-thumb"
                  onClick={() => openModal(card.key)}
                  onLoad={() => card.card_image_url && cacheImage(card.card_image_url)}
                  onError={(e) => handleImageError(e, card)}
                />
                {/* Card status panel */}
                <div className="card-status-panel">
                  <button 
                    className={`status-btn owned-btn ${card.card_owned ? 'active' : ''}`}
                    title={card.card_owned ? "Owned - Click to toggle" : "Not owned - Click to toggle"}
                    onClick={(e) => toggleOwned(e, card.key)}
                  >
                    ✓
                  </button>
                  
                  {/* Only show wanted button if card is obtainable or tradable */}
                  {(card.card_obtainable || card.card_tradable) && (
                    <button 
                      className={`status-btn wanted-btn ${card.card_desirability > 0 ? 'active' : ''}`}
                      title={card.card_desirability > 0 ? "Wanted - Click to toggle" : "Not wanted - Click to toggle"}
                      onClick={(e) => toggleWanted(e, card.key)}
                    >
                      ★
                    </button>
                  )}
                </div>
              </div>
            ) : null
          ) : (
            <div className="no-results">
              <p>No cards found with the current filters.</p>
              <p>Try changing the set or adjusting the filters.</p>
            </div>
          )}
        </div>
      )}

      {modalCard && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>×</button>
            <img
              src={modalCard.imageUrl || ''}
              alt={modalCard.card_name}
              onError={(e) => handleImageError(e, modalCard)}
            />
            <div className="modal-checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={modalCard.card_owned}
                  onChange={e => handleOwnedChange(modalCard.key, e.target.checked)}
                />
                Owned
              </label>
              
              {/* Only show wanted checkbox if card is obtainable or tradable */}
              {(modalCard.card_obtainable || modalCard.card_tradable) && (
                <label>
                  <input
                    type="checkbox"
                    checked={modalCard.card_desirability > 0}
                    onChange={e => handleWantedChange(modalCard.key, e.target.checked)}
                  />
                  Wanted
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CardGallery 