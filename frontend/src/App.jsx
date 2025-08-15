import { useState } from 'react'
import { useTheme } from './context/ThemeContext'
import { useSession } from './context/SessionContext'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

function App() {
  const { theme } = useTheme()
  const { currentSession } = useSession()
  const [useContext, setUseContext] = useState(true)
  
  return (
    <div className={`min-h-screen ${theme} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatArea useContext={useContext} setUseContext={setUseContext} />
        </main>
      </div>
    </div>
  )
}

export default App