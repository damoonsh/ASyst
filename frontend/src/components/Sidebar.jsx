import { useState, useEffect } from 'react'
import { useSession } from '../context/SessionContext'
import { FiPlus, FiMessageSquare, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

function Sidebar() {
  const {
    sessions,
    currentSessionId,
    createSession,
    switchSession,
    deleteSession,
    isLoading
  } = useSession()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)

    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  const handleNewChat = () => {
    createSession()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-64'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
      transition-all duration-300 flex flex-col z-10 
      ${isMobile && isCollapsed ? 'absolute h-full -translate-x-full' : ''}`}
    >
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 btn btn-primary"
        >
          <FiPlus className="flex-shrink-0" />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            {!isCollapsed && (
              <div className="flex flex-col items-center">
                <div className="flex space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span>Loading sessions...</span>
              </div>
            )}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            {!isCollapsed && "No chat sessions yet"}
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              className={`p-3 cursor-pointer flex items-center gap-3 ${session.id === currentSessionId
                  ? 'bg-primary-100 dark:bg-primary-900/30 border-r-4 border-primary-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              onClick={() => switchSession(session.id)}
            >
              <FiMessageSquare className={`flex-shrink-0 ${session.id === currentSessionId
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
                }`} />

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="truncate font-medium">
                      {session.title || 'New Chat'}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                      }}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete chat"
                    >
                      <FiTrash2 className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {formatDate(session.createdAt)}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center py-2 px-3 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar