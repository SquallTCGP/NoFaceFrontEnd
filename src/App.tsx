import "./App.css";
import CardGallery from "./components/CardGallery";
import PackSharing from "./components/PackSharing";
import NavigationMenu from "./components/NavigationMenu";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Root application component
 *
 * Serves as the main entry point for the application and
 * renders the CardGallery component
 *
 * @returns {JSX.Element} The rendered application
 */
function App() {
  const [currentPage, setCurrentPage] = useState("gallery");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.theme;
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldDark = stored === "dark" || (!stored && systemPrefersDark);

    root.classList.remove("dark");
    if (shouldDark) root.classList.add("dark");

    setDarkMode(shouldDark);
  }, []);

  function toggleTheme() {
    const newDark = !darkMode;
    setDarkMode(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.theme = newDark ? "dark" : "light";
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "gallery":
        return <CardGallery />;
      case "sharing":
        return <PackSharing />;
      default:
        return <CardGallery />;
    }
  };

  return (
    <div>
      <NavigationMenu currentPage={currentPage} onPageChange={setCurrentPage} />

      <button
        onClick={toggleTheme}
        className="theme-toggle fixed top-4 right-4 p-2 rounded-full shadow-md border transition-all duration-300 bg-white text-gray-800 border-gray-300 dark:bg-zinc-800 dark:text-white dark:border-white"
        aria-label="Toggle Dark Mode"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {renderCurrentPage()}
    </div>
  );
}

export default App;
