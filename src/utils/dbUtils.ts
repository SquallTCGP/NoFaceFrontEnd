/**
 * Database Utilities Module
 * 
 * Provides functions for loading, saving, and managing the card database.
 * Handles persistent storage operations and database exports.
 * 
 * @module dbUtils
 */

import { CardsDatabase } from '../types';
import { downloadFile, readFile } from './webFileService';

/**
 * Key used for storing the card database in localStorage
 * Changing this key would invalidate any previously saved databases
 * @constant
 */
const DB_STORAGE_KEY = 'cardsDatabase';

/**
 * Saves the database to localStorage
 * @param {CardsDatabase} database - The database to save
 * @returns {Promise<void>}
 */
export const saveDatabase = async (database: CardsDatabase): Promise<void> => {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(database));
    console.log('Database saved to localStorage');
  } catch (error) {
    console.error('Error saving database:', error);
    throw error;
  }
};

/**
 * Checks if a database exists in localStorage
 * @returns {boolean} Whether a database exists
 */
export const databaseExists = (): boolean => {
  return !!localStorage.getItem(DB_STORAGE_KEY);
};

/**
 * Loads the database from localStorage
 * @returns {Promise<CardsDatabase>} The loaded database
 * @throws {Error} If no database is found in localStorage
 */
export const loadDatabase = async (): Promise<CardsDatabase> => {
  const savedDb = localStorage.getItem(DB_STORAGE_KEY);
  
  if (!savedDb) {
    throw new Error('No database found in localStorage');
  }
  
  try {
    return JSON.parse(savedDb) as CardsDatabase;
  } catch (error) {
    console.error('Error parsing saved database:', error);
    throw new Error('Failed to parse database from localStorage');
  }
};

/**
 * Clears the database from localStorage
 * @returns {Promise<void>}
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    localStorage.removeItem(DB_STORAGE_KEY);
    console.log('Database cleared from localStorage');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

/**
 * Imports a database from a user-selected JSON file
 * @returns {Promise<CardsDatabase>} The imported database
 */
export const importDatabaseFromFile = async (): Promise<CardsDatabase> => {
  try {
    const fileContent = await readFile();
    const database = JSON.parse(fileContent) as CardsDatabase;
    
    // Save the imported database
    await saveDatabase(database);
    
    return database;
  } catch (error) {
    console.error('Error importing database:', error);
    throw error;
  }
};

/**
 * Downloads the database as a JSON file
 * @param {CardsDatabase} database - The database to download
 */
export const downloadDatabaseAsFile = async (database: CardsDatabase): Promise<void> => {
  try {
    // Convert database to JSON string
    const jsonString = JSON.stringify(database, null, 2);
    
    // Use our web file service to download the file
    downloadFile(jsonString, 'Cards_Database.json');
    console.log('Database download initiated');
  } catch (error) {
    console.error('Error downloading database:', error);
    throw error;
  }
}; 