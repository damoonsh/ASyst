/**
 * Real API Service for communicating with the FastAPI backend
 * This service provides methods to interact with the chat data modeling API
 */

const API_BASE_URL = 'http://localhost:8001'

/**
 * Helper function to handle API responses
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail?.message || errorData.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

/**
 * Real API Service
 */
const apiService = {
  /**
   * Create a new thread
   * @returns {Promise} Promise that resolves to the created thread
   */
  createThread: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Failed to create thread:', error)
      throw error
    }
  },

  /**
   * Get all thread titles for sidebar display
   * @returns {Promise} Promise that resolves to an array of thread titles
   */
  getThreadTitles: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/threads/titles`)
      return await handleResponse(response)
    } catch (error) {
      console.error('Failed to fetch thread titles:', error)
      throw error
    }
  },

  /**
   * Get full conversation history for a specific thread
   * @param {string} threadId - The ID of the thread to get (received from backend)
   * @returns {Promise} Promise that resolves to the conversation data
   */
  getConversation: async (threadId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${threadId}`)
      return await handleResponse(response)
    } catch (error) {
      console.error(`Failed to fetch conversation ${threadId}:`, error)
      throw error
    }
  },

  /**
   * Get all edits for a specific message
   * @param {string} threadId - The ID of the thread
   * @param {string} messageId - The ID of the message
   * @returns {Promise} Promise that resolves to the message edits
   */
  getMessageEdits: async (threadId, messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${threadId}/${messageId}`)
      return await handleResponse(response)
    } catch (error) {
      console.error(`Failed to fetch message edits for ${messageId}:`, error)
      throw error
    }
  },

  /**
   * Create a new message in an existing thread
   * @param {string} threadId - The ID of the thread (received from backend)
   * @param {string} question - The question text
   * @param {string} answer - The answer text
   * @param {string} model - The model used
   * @returns {Promise} Promise that resolves to the created message with backend-generated IDs
   */
  createMessage: async (threadId, question, answer, model) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${threadId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer,
          model
        })
      })
      return await handleResponse(response)
    } catch (error) {
      console.error(`Failed to create message in thread ${threadId}:`, error)
      throw error
    }
  },

  /**
   * Create a new edit for an existing message
   * @param {string} messageId - The ID of the message to edit (received from backend)
   * @param {string} question - The edited question text
   * @param {string} answer - The edited answer text
   * @param {string} model - The model used
   * @returns {Promise} Promise that resolves to the created edit with backend-generated edit_id
   */
  createMessageEdit: async (messageId, question, answer, model) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${messageId}/edits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer,
          model
        })
      })
      return await handleResponse(response)
    } catch (error) {
      console.error(`Failed to create edit for message ${messageId}:`, error)
      throw error
    }
  },

  /**
   * Transform thread titles from API format to frontend format
   * @param {Array} apiThreads - Thread titles from API
   * @returns {Array} Formatted threads for frontend
   */
  transformThreadTitles: (apiThreads) => {
    return apiThreads.map(thread => ({
      id: thread.thread_id,
      title: thread.title,
      createdAt: thread.started_at
    }))
  },

  /**
   * Transform conversation data from API format to frontend format
   * @param {Object} apiConversation - Conversation data from API
   * @returns {Object} Formatted conversation for frontend
   */
  transformConversation: (apiConversation) => {
    return {
      id: apiConversation.thread_id,
      title: apiConversation.title,
      createdAt: apiConversation.started_at,
      messages: apiConversation.messages.map(message => ({
        id: message.message_id,
        edits: message.edits.map(edit => ({
          edit_id: edit.edit_id,
          model_name: edit.model,
          timestamp: edit.created_at,
          question: edit.question,
          answer: edit.answer
        }))
      }))
    }
  },

  /**
   * Health check endpoint
   * @returns {Promise} Promise that resolves to health status
   */
  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      return await handleResponse(response)
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }
}

export default apiService