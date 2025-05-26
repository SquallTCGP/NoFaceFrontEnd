import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import "../assets/styles/NavigationMenu.scss";

interface NavigationProps {
  /** The name of the currently active page (e.g., "gallery" or "sharing") */
  currentPage: string;

  /** Callback to change the current page */
  onPageChange: (page: string) => void;
}

/**
 * NavigationMenu component renders a responsive side menu
 * with navigation buttons to switch between different pages.
 * 
 * Features:
 * - Hamburger icon toggles a sliding navigation panel
 * - Overlay click also closes the menu
 * - Highlights the currently active page
 */
const NavigationMenu: React.FC<NavigationProps> = ({
  currentPage,
  onPageChange,
}) => {
  /** Tracks whether the navigation menu is open */
  const [isOpen, setIsOpen] = useState(false);

  /** Toggles the navigation menu open/closed */
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Handles switching to a different page and closes the menu
   * @param page - The page to switch to
   */
  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger icon button: toggles menu open/closed */}
      <button
        className="hamburger-button"
        onClick={toggleMenu}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Transparent overlay that closes the menu when clicked */}
      <div
        className={`menu-overlay ${isOpen ? "active" : ""}`}
        onClick={toggleMenu}
      />

      {/* Side navigation panel */}
      <div className={`menu-panel ${isOpen ? "open" : ""}`}>
        <nav className="main-navigation">
          {/* Card Gallery Button */}
          <button
            className={`nav-button ${
              currentPage === "gallery" ? "active" : ""
            }`}
            onClick={() => handlePageChange("gallery")}
          >
            Card Gallery
          </button>

          {/* Pack Sharing Button */}
          <button
            className={`nav-button ${
              currentPage === "sharing" ? "active" : ""
            }`}
            onClick={() => handlePageChange("sharing")}
          >
            Pack Sharing
          </button>
        </nav>
      </div>
    </>
  );
};

export default NavigationMenu;
