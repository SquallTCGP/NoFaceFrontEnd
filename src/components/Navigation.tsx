import React from 'react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  return (
    <nav className="main-navigation">
      <button
        className={`nav-button ${currentPage === 'gallery' ? 'active' : ''}`}
        onClick={() => onPageChange('gallery')}
      >
        Card Gallery
      </button>
      <button
        className={`nav-button ${currentPage === 'sharing' ? 'active' : ''}`}
        onClick={() => onPageChange('sharing')}
      >
        Pack Sharing
      </button>
    </nav>
  );
};

export default Navigation; 