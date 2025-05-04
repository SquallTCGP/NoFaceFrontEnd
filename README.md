# Card Gallery App

A web application for tracking and managing card collections. This application allows users to import card database files, browse their collection by set, mark cards as owned or wanted, and export their collection for backup or sharing.

## Features

- **Card Database Management**
  - Import JSON card database files
  - Export/save your collection as a JSON file
  - Local storage persistence between sessions

- **Card Browsing and Filtering**
  - Browse cards by set
  - Filter by name
  - Filter by owned/wanted status
  - View high-quality card images

- **Collection Management**
  - Mark cards as owned with a single click
  - Mark cards as wanted for cards you're looking to acquire
  - View detailed card information

- **Image Handling**
  - Display cards from remote URLs (card_image_url)
  - Automatic image caching for better performance
  - Fallback to local images when remote images are unavailable
  - Placeholder images for cards with missing images

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/NoFaceFrontEnd.git
   cd NoFaceFrontEnd
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Run the development server
   ```
   npm run dev
   ```

4. Open your browser and navigate to http://localhost:5173

### Usage

1. **First Launch**: When you first open the app, you'll be prompted to import a JSON database file
2. **Importing Cards**: Use the Import button (📥) to load a card database
3. **Browsing Cards**: Select a card set from the dropdown menu
4. **Filtering**: Use the name filter or checkboxes to find specific cards
5. **Managing Collection**: Click the checkmark (✓) to mark a card as owned, or the star (★) to mark it as wanted
6. **Exporting**: Use the Export button (📤) to save your collection as a JSON file

## Database Format

The application expects JSON files with the following structure:

```json
{
  "CARD_ID_1": {
    "card_number": "1",
    "card_name": "Card Name",
    "card_rarity": 1,
    "card_set": "SET",
    "card_set_name": "Set Name",
    "card_set_base_name": "Base Set Name",
    "expansion_id": "EXP1",
    "card_desirability": 0,
    "card_trade_desirability": false,
    "card_tradable": true,
    "card_obtainable": true,
    "card_owned": false,
    "card_image_url": "https://example.com/card-image.webp"
  },
  // More cards...
}
```

## Technical Implementation

- Built with React and TypeScript
- Vite for fast development and building
- LocalStorage for data persistence
- In-memory image caching for performance
- Responsive design for various screen sizes
- Modular component architecture

## Future Improvements

- Advanced filtering and sorting options
- Collection statistics
- Deck building capabilities
- User profiles and collection sharing
- PWA support for offline access
- Tauri integration for desktop application

## License

This project is licensed under the MIT License - see the LICENSE file for details.
