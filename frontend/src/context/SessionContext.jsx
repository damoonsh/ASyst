import { createContext, useContext, useState, useEffect } from 'react'
import mockApiService from '../services/mockApiService'

const SessionContext = createContext()

// Helper function to generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Get current session object
  const currentSession = sessions.find(session => session.id === currentSessionId) || null
  
  // Load sessions from mock API on component mount
  useEffect(() => {
    setIsLoading(true)
    
    // Load sessions from mock API
    mockApiService.getConversations()
      .then(loadedSessions => {
        setSessions(loadedSessions)
        
        // Set current session to the first one if it exists
        if (loadedSessions.length > 0) {
          // Use the first session as the current one
          setCurrentSessionId(loadedSessions[0].id)
        } else {
          // Create a temporary session in memory but don't save it yet
          const tempSession = {
            id: generateId(),
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
          id: generateId(),
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
  
  // Create a new session - but don't save it to storage until a message is sent
  const createSession = (title = 'New Chat', modelName = 'tinyllama:latest') => {
    // Create a temporary session in memory only
    const newSession = {
      id: generateId(),
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      modelName,
      isTemporary: true // Mark as temporary until a message is sent
    }
    
    // Add to local state but don't persist yet
    setSessions(prevSessions => [...prevSessions, newSession])
    setCurrentSessionId(newSession.id)
    return Promise.resolve(newSession)
  }
  
  // Switch to a different session
  const switchSession = (sessionId) => {
    setCurrentSessionId(sessionId)
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
            id: generateId(),
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
    
    // For non-temporary sessions, delete from the API
    mockApiService.deleteConversation(sessionId)
      .then(() => {
        setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId))
        
        // If we're deleting the current session, switch to another one or create a new temporary one
        if (sessionId === currentSessionId) {
          const remainingSessions = sessions.filter(session => session.id !== sessionId)
          if (remainingSessions.length > 0) {
            setCurrentSessionId(remainingSessions[0].id)
          } else {
            // Create a new temporary session
            const tempSession = {
              id: generateId(),
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
      })
      .catch(error => {
        console.error('Failed to delete session:', error)
        
        // Fallback to local deletion if API fails
        setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId))
        
        // If we're deleting the current session, switch to another one or create a new one
        if (sessionId === currentSessionId) {
          const remainingSessions = sessions.filter(session => session.id !== sessionId)
          if (remainingSessions.length > 0) {
            setCurrentSessionId(remainingSessions[0].id)
          } else {
            // Create a new temporary session
            const tempSession = {
              id: generateId(),
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
      })
  }
  
  // Add a message to the current session
  const addMessage = (content, isUser = true, modelName = null) => {
    // Create message locally first
    const messageId = generateId();
    let message;
    
    // Use the new format with question/answer for new messages
    if (isUser) {
      // For user messages, store as question
      message = {
        id: messageId,
        question: content,
        timestamp: new Date().toISOString(),
        model_name: modelName
      };
    } else {
      // For AI responses, we should have the question from the previous message
      // This branch should rarely be used directly as we now update existing messages
      message = {
        id: messageId,
        content, // Keep for backward compatibility
        answer: content,
        timestamp: new Date().toISOString(),
        model_name: modelName,
        isUser: false
      };
    }
    
    if (!currentSessionId) {
      // Create a new session if none exists
      return createSession().then(newSession => {
        // Add message to local state
        setSessions(prevSessions => 
          prevSessions.map(session => 
            session.id === newSession.id
              ? { ...session, messages: [...session.messages, message], isTemporary: false }
              : session
          )
        )
        
        // Save the session and message to the API since this is the first message
        mockApiService.createConversation(newSession.title, newSession.modelName)
          .then(savedSession => {
            mockApiService.addMessage(savedSession.id, content, isUser, modelName)
              .catch(error => console.error('Failed to persist message:', error))
          })
          .catch(error => console.error('Failed to persist session:', error))
        
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
              messages: [...session.messages, message],
              isTemporary: false // Mark as permanent once a message is added
            }
          : session
      )
    )
    
    // If this is the first message in a temporary session, create it in the API
    if (session?.isTemporary && session.messages.length === 0) {
      mockApiService.createConversation(session.title, session.modelName)
        .then(savedSession => {
          // Update the session ID in our local state
          setSessions(prevSessions => 
            prevSessions.map(s => 
              s.id === currentSessionId
                ? { ...s, id: savedSession.id, isTemporary: false }
                : s
            )
          )
          setCurrentSessionId(savedSession.id)
          
          // Add the message to the newly created session
          mockApiService.addMessage(savedSession.id, content, isUser, modelName)
            .catch(error => console.error('Failed to persist message:', error))
        })
        .catch(error => {
          console.error('Failed to persist session:', error)
          // Still add the message to our local session
          mockApiService.addMessage(currentSessionId, content, isUser, modelName)
            .catch(error => console.error('Failed to persist message:', error))
        })
    } else {
      // Just add the message to the existing session
      mockApiService.addMessage(currentSessionId, content, isUser, modelName)
        .catch(error => console.error('Failed to persist message:', error))
    }
    
    return Promise.resolve(message)
  }
  
  // Update session model and optionally messages
  const updateSessionModel = (sessionId, modelName, updatedMessages = null) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId
          ? { 
              ...session, 
              modelName,
              // If updatedMessages is provided, use it, otherwise keep the existing messages
              ...(updatedMessages !== null ? { messages: updatedMessages } : {})
            }
          : session
      )
    )
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
      isLoading
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}