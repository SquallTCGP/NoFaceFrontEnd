import './App.css'
import CardGallery from './components/CardGallery'

/**
 * Root application component
 * 
 * Serves as the main entry point for the application and
 * renders the CardGallery component
 * 
 * @returns {JSX.Element} The rendered application
 */
function App() {
  return (
    <div>
      <CardGallery />
    </div>
  )
}

export default App
