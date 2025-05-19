import React, { useState } from 'react';
import CardGallery from './components/CardGallery';
import PackSharing from './components/PackSharing';
import Navigation from './components/Navigation';
import './App.css';

/**
 * Root application component
 * 
 * Serves as the main entry point for the application and
 * renders the CardGallery component
 * 
 * @returns {JSX.Element} The rendered application
 */
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('gallery');

  return (
    <div className="app-container">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="main-content">
        {currentPage === 'gallery' ? <CardGallery /> : <PackSharing />}
      </main>
    </div>
  );
};

export default App;
