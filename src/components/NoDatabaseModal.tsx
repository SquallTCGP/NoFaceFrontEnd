import React from 'react';
import { importDatabaseFromFile } from '../utils/dbUtils';
import { CardsDatabase } from '../types';

/**
 * Props for the NoDatabaseModal component
 */
interface NoDatabaseModalProps {
  /** Callback function invoked when a database is successfully imported */
  onDatabaseImported: (database: CardsDatabase) => void;
}

/**
 * Modal displayed when no database is found in local storage
 * Prompts the user to import a JSON database file
 * 
 * @param {NoDatabaseModalProps} props - Component props
 * @returns {JSX.Element} The rendered modal
 */
const NoDatabaseModal: React.FC<NoDatabaseModalProps> = ({ onDatabaseImported }) => {
  /**
   * Handles the import button click
   * Attempts to import a database file and calls the onDatabaseImported callback on success
   */
  const handleImportClick = async () => {
    try {
      const importedDb = await importDatabaseFromFile();
      onDatabaseImported(importedDb);
    } catch (error) {
      console.error('Error importing database:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content no-database-modal">
        <h2>Welcome to Card Gallery</h2>
        <p>No database found. Please import a JSON database file to get started.</p>
        <div className="modal-actions">
          <button 
            className="primary-button"
            onClick={handleImportClick}
          >
            Import Database
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoDatabaseModal; 