import { createContext, useContext, useState, useEffect } from 'react'
import apiService from '../services/apiService'

const SessionContext = createContext()

// Helper function to generate a temporary ID (only used for local state before backend sync)
const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`
}

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get current session object
  const currentSession = sessions.find(session => session.id === currentSessionId) || null

  // Load sessions from API on component mount
  useEffect(() => {
    setIsLoading(true)

    // Load thread titles from API
    apiService.getThreadTitles()
      .then(threadTitles => {
        const formattedSessions = apiService.transformThreadTitles(threadTitles).map(session => ({
          ...session,
          messages: [] // Initialize with empty messages array
        }))
        setSessions(formattedSessions)

        // Set current session to the first one if it exists
        if (formattedSessions.length > 0) {
          setCurrentSessionId(formattedSessions[0].id)
        } else {
          // Create a temporary session in memory but don't save it yet
          const tempSession = {
            id: generateTempId(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            modelName: 'tinyllama:latest',
            isTemporary: true
          }

          setSessions([tempSession])
          setCurrentSessionId(tempSession.id)
        }

        setIsLoading(false)
      })
      .catch(error => {
        console.error('Failed to load sessions:', error)

        // Create a temporary session in memory on error
        const tempSession = {
          id: generateTempId(),
          title: 'New Chat',
          messages: [],
          createdAt: new Date().toISOString(),
          modelName: 'tinyllama:latest',
          isTemporary: true
        }

        setSessions([tempSession])
        setCurrentSessionId(tempSession.id)
        setIsLoading(false)
      })
  }, [])

  // Track current session ID when it changes
  useEffect(() => {
    if (currentSessionId) {
      // In a real application, we would save this to the server
      console.log('Current session updated:', currentSessionId)
    }
  }, [currentSessionId])

  // Create a new temporary session - backend thread will be created when first message is sent
  const createSession = (title = 'New Chat', modelName = 'tinyllama:latest') => {
    const tempSession = {
      id: generateTempId(),
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      modelName,
      isTemporary: true // Will be converted to real thread when first message is sent
    }

    // Add to local state
    setSessions(prevSessions => [...prevSessions, tempSession])
    setCurrentSessionId(tempSession.id)
    return Promise.resolve(tempSession)
  }

  // Switch to a different session
  const switchSession = (sessionId) => {
    setCurrentSessionId(sessionId)
    
    // Load conversation details if it's not a temporary session
    const session = sessions.find(s => s.id === sessionId)
    if (session && !session.isTemporary && (!session.messages || session.messages.length === 0)) {
      // Load the full conversation from the API using sessionId (thread_id from backend)
      apiService.getConversation(sessionId)
        .then(conversationData => {
          const transformedConversation = apiService.transformConversation(conversationData)
          
          // Update the session with the loaded messages
          setSessions(prevSessions =>
            prevSessions.map(s =>
              s.id === sessionId
                ? { ...s, messages: transformedConversation.messages }
                : s
            )
          )
        })
        .catch(error => {
          console.error(`Failed to load conversation ${sessionId}:`, error)
        })
    }
  }

  // Delete a session
  const deleteSession = (sessionId) => {
    // Find the session to check if it's temporary
    const sessionToDelete = sessions.find(s => s.id === sessionId)

    // If it's a temporary session, just remove it from local state
    if (sessionToDelete?.isTemporary) {
      setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId))

      // If we're deleting the current session, switch to another one or create a new temporary one
      if (sessionId === currentSessionId) {
        const remainingSessions = sessions.filter(session => session.id !== sessionId)
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id)
        } else {
          // Create a new temporary session
          const tempSession = {
            id: generateTempId(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            modelName: 'tinyllama:latest',
            isTemporary: true
          }

          setSessions([tempSession])
          setCurrentSessionId(tempSession.id)
        }
      }
      return
    }

    // For non-temporary sessions, we would delete from the API
    // TODO: Implement delete endpoint in backend API
    console.warn('Delete functionality not yet implemented for persistent sessions')
    
    // For now, just remove from local state
    setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId))

    // If we're deleting the current session, switch to another one or create a new temporary one
    if (sessionId === currentSessionId) {
      const remainingSessions = sessions.filter(session => session.id !== sessionId)
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id)
      } else {
        // Create a new temporary session
        const tempSession = {
          id: generateTempId(),
          title: 'New Chat',
          messages: [],
          createdAt: new Date().toISOString(),
          modelName: 'tinyllama:latest',
          isTemporary: true
        }

        setSessions([tempSession])
        setCurrentSessionId(tempSession.id)
      }
    }
  }

  // Add a message to the current session
  const addMessage = (content, isUser = true, modelName = null) => {
    // Create message locally first - ID will be replaced when synced with backend
    let message;

    // Use the new format with question/answer for new messages
    if (isUser) {
      // For user messages, store as question
      message = {
        id: null, // Will be set when message is created in backend
        question: content,
        timestamp: new Date().toISOString(),
        model_name: modelName
      };
    } else {
      // For AI responses, we should have the question from the previous message
      // This branch should rarely be used directly as we now update existing messages
      message = {
        id: null, // Will be set when message is created in backend
        content, // Keep for backward compatibility
        answer: content,
        timestamp: new Date().toISOString(),
        model_name: modelName,
        isUser: false
      };
    }

    if (!currentSessionId) {
      // Create a new temporary session if none exists
      return createSession().then(newSession => {
        // Add message to local state
        setSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === newSession.id
              ? { ...session, messages: [...(session.messages || []), message] }
              : session
          )
        )

        return message
      })
    }

    // Get the current session
    const session = sessions.find(s => s.id === currentSessionId)

    // Add message to local state immediately
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === currentSessionId
          ? {
            ...session,
            messages: [...(session.messages || []), message],
            isTemporary: false // Mark as permanent once a message is added
          }
          : session
      )
    )

    // Note: The real API persistence will be handled in the ChatArea component
    // when we have both question and answer to create a complete message
    console.log('Message added to local state. API persistence will be handled by ChatArea component.')

    return Promise.resolve(message)
  }

  // Update session model and optionally messages
  const updateSessionModel = (sessionId, modelName, updatedMessages = null) => {
    // Check if the session exists and if the model name is different
    const sessionToUpdate = sessions.find(s => s.id === sessionId)
    
    // Only update if the session exists and either:
    // 1. The model name is different, or
    // 2. We have new messages to update
    if (sessionToUpdate && 
        (sessionToUpdate.modelName !== modelName || updatedMessages !== null)) {
      
      setSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === sessionId
            ? {
              ...session,
              modelName,
              // If updatedMessages is provided, use it, otherwise keep the existing messages
              ...(updatedMessages !== null ? { messages: updatedMessages } : {}),
              // Mark as non-temporary if we're updating with messages from the API
              ...(updatedMessages !== null ? { isTemporary: false } : {})
            }
            : session
        )
      )
    }
  }

  // Convert temporary session to backend session
  const convertTemporarySession = (oldSessionId, newThreadData) => {
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === oldSessionId
          ? {
            ...session,
            id: newThreadData.thread_id,
            title: newThreadData.title,
            createdAt: newThreadData.started_at,
            isTemporary: false
          }
          : session
      )
    )
    setCurrentSessionId(newThreadData.thread_id)
    return newThreadData.thread_id
  }

  return (
    <SessionContext.Provider value={{
      sessions,
      currentSession,
      currentSessionId,
      createSession,
      switchSession,
      deleteSession,
      addMessage,
      updateSessionModel,
      convertTemporarySession,
      isLoading
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}