import { useTheme } from '../context/ThemeContext'
import { FiSun, FiMoon, FiMenu, FiInfo } from 'react-icons/fi'

function Header() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4 md:px-6 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <button 
            className="md:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Toggle menu"
          >
            <FiMenu className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">
            Chat UI with File Upload
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            aria-label="Information"
          >
            <FiInfo />
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? 
              <FiSun className="text-yellow-400" /> : 
              <FiMoon className="text-gray-700" />
            }
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header