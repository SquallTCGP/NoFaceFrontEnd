import React, { useState, useMemo, useEffect, useCallback } from 'react'
import FullCardsDB from '../json/Full_Cards_Database.json'
import { calculateDesirabilityFromRarity } from '../utils/cardUtils'
import { loadDatabase, saveDatabase, resetDatabase, downloadDatabaseAsFile, loadOriginalDatabase } from '../utils/dbUtils'
import { Card, CardWithKey, CardsDatabase } from '../types'

// @ts-ignore - The glob import pattern is provided by Vite
const images = import.meta.glob<{ default: string }>('../assets/card-images/*/*.png', { eager: true })

const CardGallery: React.FC = () => {
  const sets = [
    'Genetic Apex',
    'Mythical Island',
    'Space-Time Smackdown',
    'Triumphant Light',
    'Shining Revelry',
    'Celestial Guardians',
  ]

  const [selectedSet, setSelectedSet] = useState<string>(sets[0])
  const [modalCardKey, setModalCardKey] = useState<string | null>(null)
  const [cardsDatabase, setCardsDatabase] = useState<CardsDatabase>(FullCardsDB as CardsDatabase)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isChangingSet, setIsChangingSet] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isResetting, setIsResetting] = useState<boolean>(false)
  const [resetKey, setResetKey] = useState<number>(0) // Used to force re-render after reset

  // Load database on component mount
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const db = await loadDatabase()
      setCardsDatabase(db)
    } catch (error) {
      console.error('Error loading database:', error)
      // Fallback to the imported database
      setCardsDatabase(FullCardsDB as CardsDatabase)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData, resetKey])

  // Filter JSON entries by selected set and attach image URL
  const cards = useMemo<CardWithKey[]>(() => {
    return Object.entries(cardsDatabase)
      .filter(([, card]) => card.card_set_base_name === selectedSet)
      .map(([key, card]) => {
        const imageEntry = Object.entries(images).find(
          ([path]) => path.includes(`${selectedSet}/${'c' + key}`)
        )
        const imageUrl = imageEntry ? imageEntry[1].default : null
        return { key, ...card, imageUrl }
      })
  }, [selectedSet, cardsDatabase])

  // Handle set changing with loading state
  useEffect(() => {
    // Skip initial render
    if (!isLoading) {
      setIsChangingSet(true)
      // Simulate loading time for images
      const timer = setTimeout(() => {
        setIsChangingSet(false)
      }, 800) // Adjust timing as needed
      
      return () => clearTimeout(timer)
    }
  }, [selectedSet, isLoading])

  const handleSetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSet(e.target.value)
  }

  const openModal = (key: string): void => setModalCardKey(key)
  const closeModal = (): void => setModalCardKey(null)

  const modalCard = modalCardKey
    ? cards.find(c => c.key === modalCardKey)
    : null

  const handleOwnedChange = (cardKey: string, isOwned: boolean): void => {
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

  const handleWantedChange = (cardKey: string, isWanted: boolean): void => {
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

  // Toggle owned status by clicking the button
  const toggleOwned = (e: React.MouseEvent, cardKey: string): void => {
    e.stopPropagation(); // Prevent opening the modal
    const card = cardsDatabase[cardKey];
    handleOwnedChange(cardKey, !card.card_owned);
  }

  // Toggle wanted status by clicking the button
  const toggleWanted = (e: React.MouseEvent, cardKey: string): void => {
    e.stopPropagation(); // Prevent opening the modal
    const card = cardsDatabase[cardKey];
    if (card.card_obtainable || card.card_tradable) {
      handleWantedChange(cardKey, card.card_desirability === 0);
    }
  }

  // Handle save button click
  const handleSaveClick = (): void => {
    setIsSaving(true);
    try {
      downloadDatabaseAsFile(cardsDatabase);
    } catch (error) {
      console.error('Error saving database:', error);
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  }

  // Handle reset button click
  const handleResetClick = async (): Promise<void> => {
    if (confirm('Are you sure you want to reset the database to original values? This will lose all your changes.')) {
      setIsResetting(true);
      try {
        // Reset the database
        const originalDb = await resetDatabase();
        setCardsDatabase(originalDb);
        
        // Force a complete re-render by changing the reset key
        setTimeout(() => {
          setResetKey(prev => prev + 1);
        }, 100);
      } catch (error) {
        console.error('Error resetting database:', error);
      } finally {
        setTimeout(() => setIsResetting(false), 1000);
      }
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading cards database...</p>
      </div>
    );
  }

  return (
    <div className="card-gallery-container">
      <div className="instructions">
        <h3>Card Gallery Instructions:</h3>
        <ul>
          <li>Select a card set from the dropdown menu</li>
          <li>Click on any card to mark it as owned or wanted</li>
          <li>Use the buttons on each card to quickly toggle status</li>
          <li>Use the Save button to download your collection</li>
          <li>Use the Reset button to restore original values</li>
        </ul>
      </div>

      <div className="gallery-controls">
        <select
          value={selectedSet}
          onChange={handleSetChange}
          disabled={isChangingSet || isSaving || isResetting}
        >
          {sets.map(set => (
            <option key={set} value={set}>
              {set}
            </option>
          ))}
        </select>
        <div className="action-buttons">
          <button 
            className="action-button save-button" 
            onClick={handleSaveClick}
            disabled={isSaving || isResetting}
          >
            {isSaving ? 'Saving...' : 'Save Card Database'}
          </button>
          <button 
            className="action-button reset-button" 
            onClick={handleResetClick}
            disabled={isSaving || isResetting}
          >
            {isResetting ? 'Resetting...' : 'Reset to Original Card Database'}
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
          {cards.map(card =>
            card.imageUrl ? (
              <div key={card.key} className="card-container">
                <img
                  src={card.imageUrl}
                  alt={card.card_name}
                  className="card-thumb"
                  onClick={() => openModal(card.key)}
                />
                {/* New card status panel */}
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