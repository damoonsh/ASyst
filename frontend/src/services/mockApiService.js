/**
 * Minimal Mock API Service
 * 
 * ONLY PURPOSE: Return mock LLM responses for UI testing
 * Does NOT handle persistence, threads, messages, or any backend functionality
 * All real functionality should use the actual apiService
 */

// Simple mock responses
const mockResponses = [
  "This is a mock response to your question. The actual API will provide real answers.",
  "Mock answer: I understand your question and here's a simulated response for testing purposes.",
  "This is a test response from the mock API. In production, you'll get real AI-generated answers.",
  "Mock response: Thank you for your question. This is just a placeholder answer for development.",
  "Simulated answer: This mock response helps test the UI while the real API is being developed."
];

// Get random mock response
const getRandomResponse = () => {
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
};

// Simple typing simulation
const simulateTyping = (text, onChunk, onComplete) => {
  let position = 0;
  const chunkSize = 3; // Characters per chunk
  const delay = 50; // Milliseconds between chunks

  const typeNextChunk = () => {
    if (position < text.length) {
      const chunk = text.slice(position, position + chunkSize);
      onChunk(chunk);
      position += chunkSize;
      setTimeout(typeNextChunk, delay);
    } else {
      onComplete(text);
    }
  };

  setTimeout(typeNextChunk, 200); // Initial delay
};

// Available models for UI testing
const mockModels = [
  { id: "tinyllama:latest", name: "TinyLlama" },
  { id: "qwen3:0.6b", name: "Qwen 0.6B" },
  { id: "smollm2:360m", name: "SmoLLM2 360M" }
];

/**
 * Minimal Mock API Service
 * Only provides mock responses for UI testing
 */
const mockApiService = {
  /**
   * Get available models for UI
   */
  getAvailableModels: () => {
    return Promise.resolve(mockModels);
  },

  /**
   * Generate a mock response with typing simulation
   * @param {string} message - User's message (ignored, just for interface compatibility)
   * @param {string} modelName - Model name (ignored, just for interface compatibility)
   * @param {boolean} useContext - Whether to use context (ignored)
   * @param {function} onChunk - Callback for streaming chunks
   * @param {function} onComplete - Callback when response is complete
   * @param {function} onError - Callback for errors
   */
  sendMessage: (message, modelName, useContext, onChunk, onComplete, onError) => {
    try {
      const mockResponse = getRandomResponse();
      simulateTyping(mockResponse, onChunk, onComplete);
    } catch (error) {
      onError(error);
    }
  }
};

export default mockApiService;