import { useTheme } from './context/ThemeContext'
import { useSession } from './context/SessionContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

function App() {
  const { theme } = useTheme()
  const { currentSession } = useSession()
  
  return (
    <div className={`min-h-screen ${theme} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <ChatArea />
          </main>
        </div>
      </div>
    </div>
  )
}

export default App