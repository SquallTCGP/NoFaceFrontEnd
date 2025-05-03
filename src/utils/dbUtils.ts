/**
 * Database Utilities Module
 * 
 * Provides functions for loading, saving, and managing the card database.
 * Handles persistent storage operations, database initialization, and database exports.
 * 
 * @module dbUtils
 */

import { CardsDatabase } from '../types';
import { downloadFile, readFile } from './webFileService';

/**
 * Initializes the database by copying the original to working copy if needed
 * @returns {Promise<CardsDatabase>} The working database
 */
export const initDatabase = async (): Promise<CardsDatabase> => {
  // Check if working database exists and load it
  try {
    const response = await fetch('/src/json/Full_Cards_Database.json');
    return await response.json() as CardsDatabase;
  } catch (error) {
    console.error('Error loading database:', error);
    
    // If working DB doesn't exist or error, use original
    const originalResponse = await fetch('/src/json/original_db/Full_Cards_Database.json');
    const originalDb = await originalResponse.json() as CardsDatabase;
    
    // Save original as working copy
    await saveDatabase(originalDb);
    
    return originalDb;
  }
};

/**
 * Loads the original database directly from source
 * @returns {Promise<CardsDatabase>} The original database
 */
export const loadOriginalDatabase = async (): Promise<CardsDatabase> => {
  try {
    // For web browser, fetch from file
    const response = await fetch('/src/json/Full_Cards_Database.json');
    const originalDb = await response.json() as CardsDatabase;
    return originalDb;
  } catch (error) {
    console.error('Error loading original database:', error);
    throw error;
  }
};

/**
 * Saves the database to the working copy file
 * @param {CardsDatabase} database - The database to save
 * @returns {Promise<void>}
 */
export const saveDatabase = async (database: CardsDatabase): Promise<void> => {
  try {
    // For development, we'll just log the save operation and use localStorage
    localStorage.setItem('cardsDatabase', JSON.stringify(database));
    console.log('Database saved to localStorage');
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

/**
 * Loads the database from localStorage or initializes it if needed
 * @returns {Promise<CardsDatabase>} The loaded database
 */
export const loadDatabase = async (): Promise<CardsDatabase> => {
  // Try to load from localStorage first (simulating loading from saved file)
  const savedDb = localStorage.getItem('cardsDatabase');
  
  if (savedDb) {
    try {
      return JSON.parse(savedDb) as CardsDatabase;
    } catch (error) {
      console.error('Error parsing saved database:', error);
    }
  }
  
  // If no saved database, initialize from original
  return await initDatabase();
};

/**
 * Resets the database to original values
 * @returns {Promise<CardsDatabase>} The reset database
 */
export const resetDatabase = async (): Promise<CardsDatabase> => {
  try {
    // Remove the localStorage entry first
    localStorage.removeItem('cardsDatabase');
    
    // Fetch original database
    const originalDb = await loadOriginalDatabase();
    
    // Save it back to localStorage
    await saveDatabase(originalDb);
    
    console.log('Database reset to original values and saved to localStorage');
    
    return originalDb;
  } catch (error) {
    console.error('Error resetting database:', error);
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
    downloadFile(jsonString, 'Full_Cards_Database.json');
    console.log('Database download initiated');
  } catch (error) {
    console.error('Error downloading database:', error);
  }
}; 