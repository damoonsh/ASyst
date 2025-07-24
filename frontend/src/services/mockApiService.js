/**
 * Mock API Service for simulating LLM responses
 * This service provides mock responses with realistic typing delay and streaming effects
 */

// Collection of response templates for different scenarios
const responseTemplates = {
  short: [
    "I understand your question. The answer is quite straightforward.",
    "That's a good question. Here's a simple answer.",
    "Based on my knowledge, the answer is simple.",
    "I can help with that. Here's a brief response.",
    "The answer to your question is concise and direct."
  ],
  medium: [
    "I appreciate your question. Let me provide a comprehensive answer.\n\nFirst, it's important to understand the basics. Then we can explore the details more thoroughly. There are several factors to consider here.",
    "That's an interesting question. Let me break this down for you.\n\nThere are multiple aspects to consider. First, let's look at the fundamental concepts. Then we can discuss the practical applications.",
    "I'd be happy to help with that. Let me give you a detailed explanation.\n\nThis topic has several important components. Let's start with the core principles and then move to specific examples.",
    "Great question. Let me provide some context before diving into the answer.\n\nUnderstanding this topic requires looking at it from different angles. Let's explore the key aspects one by one."
  ],
  long: [
    "Thank you for your thoughtful question. This is a complex topic that deserves a thorough explanation.\n\nLet's start with the fundamentals. Understanding the basic principles is essential before we can explore the more nuanced aspects of this subject. There are several key concepts to consider.\n\nFirst, we should examine the historical context. This provides valuable insights into how current practices and theories evolved. Many of the challenges we face today have historical precedents that can inform our approach.\n\nSecond, let's look at the theoretical framework. The underlying models and theories help explain why certain approaches are more effective than others. This theoretical understanding is crucial for developing practical solutions.\n\nFinally, we can discuss practical applications and real-world examples. These illustrate how the principles we've discussed are implemented in various contexts. Case studies provide valuable lessons about what works and what doesn't.\n\nI hope this comprehensive overview helps clarify the topic. If you have specific aspects you'd like me to elaborate on, please let me know.",
    "I'm glad you asked about this topic. It's a fascinating area with many dimensions worth exploring in detail.\n\nTo provide a comprehensive answer, I'll need to cover several important aspects:\n\n1. **Core Principles**: The fundamental concepts that form the foundation of this subject. These principles guide our understanding and approach to related problems.\n\n2. **Historical Development**: How our understanding has evolved over time, including key breakthroughs and paradigm shifts that shaped current thinking.\n\n3. **Current Best Practices**: The most effective approaches based on recent research and practical experience. These represent the state-of-the-art in the field.\n\n4. **Common Challenges**: Typical obstacles encountered and strategies for overcoming them. Understanding these challenges helps prepare for potential difficulties.\n\n5. **Future Directions**: Emerging trends and potential developments that may influence this area in coming years.\n\nEach of these aspects contributes to a holistic understanding of the topic. By examining them together, we can develop a nuanced perspective that acknowledges both the theoretical foundations and practical realities.\n\nWould you like me to elaborate on any particular aspect of this overview?"
  ],
  withContext: [
    "Based on the context you've provided, I can offer a more tailored response. The document you uploaded contains relevant information about this topic.\n\nAccording to the context, there are specific details that directly address your question. The key points include:\n\n1. Important facts from the document that relate to your query\n2. Specific examples that illustrate the concept you're asking about\n3. Relevant data or figures that support the explanation\n\nThis information from the context helps provide a more accurate and specific answer to your question.",
    "I've analyzed the context from your uploaded document, and I can provide an informed response based on that information.\n\nThe document specifically mentions several points related to your question:\n\n- Key concept definitions that clarify the terminology\n- Methodological approaches described in section 2 of the document\n- Case studies that demonstrate practical applications\n\nBy integrating this contextual information with general knowledge, I can provide a more precise and relevant answer to your specific situation."
  ],
  error: [
    "I apologize, but I encountered an error while processing your request. This could be due to several reasons:\n\n1. The question might be too complex or ambiguous\n2. There might be a temporary issue with the model\n3. The request might contain elements I'm not designed to handle\n\nCould you try rephrasing your question or breaking it down into smaller parts?",
    "I'm sorry, but I wasn't able to generate a proper response to your query. This might be because:\n\n- The question contains contradictory elements\n- The topic is outside my knowledge boundaries\n- There was a processing error in my system\n\nWould you mind reformulating your question or trying a different approach?"
  ]
};

// Helper function to get a random item from an array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to simulate typing delay with customizable speed
const simulateTypingDelay = (text, callback, speed = 'medium') => {
  // Define typing speeds in characters per second
  const typingSpeeds = {
    slow: 20,
    medium: 40,
    fast: 80
  };

  const charsPerSecond = typingSpeeds[speed] || typingSpeeds.medium;
  const totalTime = (text.length / charsPerSecond) * 1000; // Total time in milliseconds
  const minChunkSize = 3; // Minimum characters to send at once
  const maxChunkSize = 10; // Maximum characters to send at once

  let position = 0;
  let lastChunkTime = Date.now();

  const typeNextChunk = () => {
    if (position >= text.length) {
      return;
    }

    // Calculate a random chunk size between min and max
    const remainingChars = text.length - position;
    const chunkSize = Math.min(
      remainingChars,
      Math.floor(Math.random() * (maxChunkSize - minChunkSize + 1)) + minChunkSize
    );

    // Get the next chunk of text
    const chunk = text.substring(position, position + chunkSize);
    position += chunkSize;

    // Call the callback with the chunk
    callback(chunk, position >= text.length);

    // Calculate next chunk delay with some randomness
    const now = Date.now();
    const elapsedTime = now - lastChunkTime;
    lastChunkTime = now;

    // Add some natural variation to typing speed
    const variationFactor = 0.5 + Math.random(); // Between 0.5 and 1.5
    const idealTimePerChunk = (chunkSize / charsPerSecond) * 1000 * variationFactor;

    // Schedule next chunk
    if (position < text.length) {
      setTimeout(typeNextChunk, idealTimePerChunk);
    }
  };

  // Start typing
  typeNextChunk();
};

// Import mock data
import mockConversationsData from '../data/mockConversations.json';
import processingSettingsData from '../data/processingSettings.json';
import uploadedFilesData from '../data/uploadedFiles.json';

/**
 * Mock API Service
 */
const mockApiService = {
  // Store for mock conversations
  _mockConversations: null,
  _processingSettings: null,
  _uploadedFiles: null,

  /**
   * Initialize the mock conversations from the JSON file
   * @private
   */
  _initMockConversations: function () {
    if (this._mockConversations === null) {
      // Use the data from JSON file
      this._mockConversations = { ...mockConversationsData };
    }
    return this._mockConversations;
  },

  /**
   * Initialize the processing settings from the JSON file
   * @private
   */
  _initProcessingSettings: function () {
    if (this._processingSettings === null) {
      this._processingSettings = { ...processingSettingsData };
    }
    return this._processingSettings;
  },

  /**
   * Initialize the uploaded files from the JSON file
   * @private
   */
  _initUploadedFiles: function () {
    if (this._uploadedFiles === null) {
      this._uploadedFiles = { ...uploadedFilesData };
    }
    return this._uploadedFiles;
  },

  /**
   * Save the current state of mock conversations
   * This would typically write to a database or file system
   * In a real implementation, this would be an API call
   * @private
   */
  _saveMockConversations: function () {
    // In a real implementation, this would save to a database or file system
    console.log('Saving conversations:', this._mockConversations);
    // We're simulating persistence here - in a real app this would be an API call
  },

  /**
   * Get all conversation threads
   * @returns {Promise} Promise that resolves to an array of conversation threads
   */
  getConversations: function () {
    return new Promise((resolve) => {
      const conversations = this._initMockConversations();

      // Convert the object to an array and sort by createdAt (newest first)
      const conversationsArray = Object.values(conversations)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Simulate network delay
      setTimeout(() => {
        resolve(conversationsArray);
      }, 300);
    });
  },

  /**
   * Get a specific conversation thread by ID
   * @param {string} threadId - The ID of the thread to get
   * @returns {Promise} Promise that resolves to the conversation thread
   */
  getConversation: function (threadId) {
    return new Promise((resolve, reject) => {
      const conversations = this._initMockConversations();

      // Simulate network delay
      setTimeout(() => {
        if (conversations[threadId]) {
          resolve(conversations[threadId]);
        } else {
          reject(new Error(`Conversation thread ${threadId} not found`));
        }
      }, 200);
    });
  },

  /**
   * Create a new conversation thread
   * @param {string} title - The title of the thread
   * @param {string} modelName - The model to use for this thread
   * @returns {Promise} Promise that resolves to the new conversation thread
   */
  createConversation: function (title = 'New Chat', modelName = 'tinyllama:latest') {
    return new Promise((resolve) => {
      const conversations = this._initMockConversations();

      // Generate a new thread ID
      const threadId = `thread_${Date.now().toString(36)}`;

      // Create the new thread
      const newThread = {
        id: threadId,
        title,
        createdAt: new Date().toISOString(),
        messages: []
      };

      // Add it to the conversations
      conversations[threadId] = newThread;

      // Save to localStorage
      this._saveMockConversations();

      // Simulate network delay
      setTimeout(() => {
        resolve(newThread);
      }, 200);
    });
  },

  /**
   * Delete a conversation thread
   * @param {string} threadId - The ID of the thread to delete
   * @returns {Promise} Promise that resolves when the thread is deleted
   */
  deleteConversation: function (threadId) {
    return new Promise((resolve, reject) => {
      const conversations = this._initMockConversations();

      // Simulate network delay
      setTimeout(() => {
        if (conversations[threadId]) {
          delete conversations[threadId];

          // Save to localStorage
          this._saveMockConversations();

          resolve({ success: true });
        } else {
          reject(new Error(`Conversation thread ${threadId} not found`));
        }
      }, 200);
    });
  },

  /**
   * Add a message to a conversation thread
   * @param {string} threadId - The ID of the thread to add the message to
   * @param {string} content - The message content
   * @param {boolean} isUser - Whether the message is from the user
   * @param {string} modelName - The model name
   * @returns {Promise} Promise that resolves to the added message
   */
  addMessage: function (threadId, content, isUser = true, modelName = null) {
    return new Promise((resolve, reject) => {
      const conversations = this._initMockConversations();

      // Simulate network delay
      setTimeout(() => {
        if (conversations[threadId]) {
          const thread = conversations[threadId];
          
          // If this is a user message, store it as a question
          if (isUser) {
            // Store the question temporarily to pair with the answer later
            thread._pendingQuestion = content;
            
            // Create a temporary message object for the UI
            const tempMessage = {
              id: `temp_${Date.now()}`,
              content,
              isUser: true,
              timestamp: new Date().toISOString(),
              modelName: null
            };
            
            resolve(tempMessage);
          } 
          // If this is a model response, create a complete message with edits
          else {
            // Get the pending question or use a default
            const question = thread._pendingQuestion || "Unknown question";
            delete thread._pendingQuestion; // Clear the pending question
            
            // Generate a message ID
            const messageId = `msg_${threadId.split('_')[1]}_${thread.messages.length + 1}`;
            
            // Generate edit ID
            const editId = `edit_${threadId.split('_')[1]}_${thread.messages.length + 1}_1`;
            
            // Create the message with the edits structure
            const message = {
              id: messageId,
              edits: [
                {
                  edit_id: editId,
                  model_name: modelName,
                  timestamp: new Date().toISOString(),
                  question: question,
                  answer: content
                }
              ]
            };
            
            // Add it to the thread
            thread.messages.push(message);
            
            // Save to storage
            this._saveMockConversations();
            
            resolve(message);
          }
        } else {
          reject(new Error(`Conversation thread ${threadId} not found`));
        }
      }, 100);
    });
  },

  /**
   * Add an edit to an existing message
   * @param {string} threadId - The ID of the thread
   * @param {string} messageId - The ID of the message to edit
   * @param {string} question - The updated question
   * @param {string} answer - The updated answer
   * @param {string} modelName - The model name
   * @returns {Promise} Promise that resolves to the updated message
   */
  addMessageEdit: function (threadId, messageId, question, answer, modelName) {
    return new Promise((resolve, reject) => {
      const conversations = this._initMockConversations();

      setTimeout(() => {
        if (conversations[threadId]) {
          const thread = conversations[threadId];
          const message = thread.messages.find(msg => msg.id === messageId);
          
          if (message) {
            // Generate new edit ID
            const editNumber = message.edits ? message.edits.length + 1 : 1;
            const editId = `edit_${threadId.split('_')[1]}_${messageId.split('_')[2]}_${editNumber}`;
            
            // Initialize edits array if it doesn't exist
            if (!message.edits) {
              message.edits = [];
            }
            
            // Add new edit
            const newEdit = {
              edit_id: editId,
              model_name: modelName,
              timestamp: new Date().toISOString(),
              question: question,
              answer: answer
            };
            
            message.edits.push(newEdit);
            
            // Save to storage
            this._saveMockConversations();
            
            resolve(message);
          } else {
            reject(new Error(`Message ${messageId} not found in thread ${threadId}`));
          }
        } else {
          reject(new Error(`Conversation thread ${threadId} not found`));
        }
      }, 100);
    });
  },

  /**
   * Simulates sending a message to an LLM and getting a streaming response
   * @param {string} message - The user's message
   * @param {string} modelName - The name of the model to use
   * @param {boolean} useContext - Whether to use context in the response
   * @param {function} onChunk - Callback for each chunk of the response
   * @param {function} onComplete - Callback when the response is complete
   * @param {function} onError - Callback for errors
   * @param {string} threadId - Optional thread ID to add the message to
   */
  sendMessage: (message, modelName, useContext = false, onChunk, onComplete, onError, threadId = null) => {
    // Simulate network delay (200-800ms)
    const networkDelay = 200 + Math.random() * 600;

    setTimeout(() => {
      // Randomly decide if this should be an error response (5% chance)
      if (Math.random() < 0.05) {
        const errorResponse = getRandomItem(responseTemplates.error);
        simulateTypingDelay(errorResponse, onChunk, 'medium');
        setTimeout(() => onComplete(errorResponse), (errorResponse.length / 40) * 1000);
        return;
      }

      // Determine response type based on message length and complexity
      let responseType;

      // If useContext is true, 70% chance to use context-based response
      if (useContext && Math.random() < 0.7) {
        responseType = 'withContext';
      } else {
        // Choose response length based on question complexity
        const questionLength = message.length;
        const questionComplexity = message.split(' ').length;

        if (questionLength < 20 || questionComplexity < 5) {
          responseType = 'short';
        } else if (questionLength < 100 || questionComplexity < 15) {
          responseType = Math.random() < 0.7 ? 'medium' : 'long';
        } else {
          responseType = Math.random() < 0.6 ? 'long' : 'medium';
        }
      }

      // Get a random response of the selected type
      let baseResponse = getRandomItem(responseTemplates[responseType]);

      // Personalize the response by including parts of the question
      const keywords = message.split(' ')
        .filter(word => word.length > 4)
        .map(word => word.replace(/[^\w\s]/gi, ''));

      if (keywords.length > 0) {
        // Include 1-2 keywords from the question in the response
        const keywordsToUse = [];
        const numKeywords = Math.min(keywords.length, 1 + Math.floor(Math.random() * 2));

        for (let i = 0; i < numKeywords; i++) {
          const randomIndex = Math.floor(Math.random() * keywords.length);
          keywordsToUse.push(keywords[randomIndex]);
          keywords.splice(randomIndex, 1);
        }

        // Insert keywords into the response if they're not already there
        keywordsToUse.forEach(keyword => {
          if (!baseResponse.toLowerCase().includes(keyword.toLowerCase()) && keyword.length > 4) {
            // Find a suitable position to insert the keyword
            const sentences = baseResponse.split('. ');
            if (sentences.length > 1) {
              const position = Math.floor(Math.random() * sentences.length);
              sentences[position] = sentences[position].replace(
                /\b(is|are|the|this|that|these|those)\b/i,
                `$1 ${keyword}`
              );
              baseResponse = sentences.join('. ');
            }
          }
        });
      }

      // Add model-specific quirks based on the model name
      if (modelName.includes('tiny') || modelName.includes('small')) {
        // Smaller models might give shorter responses
        baseResponse = baseResponse.split('\n\n')[0];
      } else if (modelName.includes('qwen')) {
        // Add a Qwen-style signature
        baseResponse += "\n\nI hope this helps! Let me know if you need more information.";
      }

      // Simulate typing with appropriate speed based on model size
      let typingSpeed = 'medium';
      if (modelName.includes('tiny') || modelName.includes('small')) {
        typingSpeed = 'fast';
      } else if (modelName.includes('large') || modelName.includes('7b')) {
        typingSpeed = 'slow';
      }

      // Start streaming the response
      simulateTypingDelay(baseResponse, onChunk, typingSpeed);

      // Call onComplete when done (estimate based on response length and typing speed)
      const typingSpeeds = { slow: 20, medium: 40, fast: 80 };
      const completionTime = (baseResponse.length / typingSpeeds[typingSpeed]) * 1000;
      
      setTimeout(() => {
        onComplete(baseResponse);
        
        // If threadId is provided, save the complete Q&A to the thread
        if (threadId) {
          // Use the addMessage method to save the message with edits format
          mockApiService.addMessage(threadId, message, true, modelName)
            .then(() => {
              // Now add the answer
              return mockApiService.addMessageEdit(
                threadId,
                `msg_${threadId.split('_')[1]}_${mockApiService._mockConversations[threadId].messages.length}`,
                message,
                baseResponse,
                modelName
              );
            })
            .then(() => console.log('Message saved to thread'))
            .catch(err => console.error('Error saving message:', err));
        }
      }, completionTime);
    }, networkDelay);
  },

  /**
   * Simulates getting available models
   * @returns {Promise} Promise that resolves to an array of models
   */
  getAvailableModels: () => {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        resolve([
          { id: "tinyllama:latest", name: "TinyLlama", description: "Fast, lightweight model for simple queries" },
          { id: "qwen3:0.6b", name: "Qwen 0.6B", description: "Balanced performance for everyday questions" },
          { id: "smollm2:360m", name: "SmoLLM2 360M", description: "Efficient model with good reasoning" },
        ]);
      }, 300);
    });
  },

  /**
   * Simulates uploading and processing a file
   * @param {File} file - The file to upload
   * @param {function} onProgress - Progress callback
   * @param {boolean} useOffline - Whether to use offline processing (default: true)
   * @returns {Promise} Promise that resolves when the file is processed
   */
  uploadFile: (file, onProgress, useOffline = true) => {
    return new Promise((resolve, reject) => {
      // Check if file is valid
      const validTypes = ['application/pdf', 'text/plain', 'text/markdown'];
      const validExtensions = ['.pdf', '.txt', '.md'];

      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

      if (!isValidType) {
        reject(new Error('Invalid file type. Please upload a PDF, TXT, or MD file.'));
        return;
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        reject(new Error('File size too large. Please upload files smaller than 10MB.'));
        return;
      }

      // Simulate file upload with progress
      let progress = 0;
      const totalTime = useOffline ? 1000 + Math.random() * 1000 : 2000 + Math.random() * 3000; // Offline is faster
      const interval = 100; // Update every 100ms
      const steps = totalTime / interval;

      const progressInterval = setInterval(() => {
        progress += 1 / steps;
        if (progress >= 1) {
          progress = 1;
          clearInterval(progressInterval);

          // Simulate processing delay after upload completes
          const processingDelay = useOffline ? 200 : 500;
          setTimeout(() => {
            // Generate a mock file path for offline processing
            const mockFilePath = useOffline 
              ? `/local/uploads/${Date.now()}_${file.name}`
              : `/server/uploads/${Date.now()}_${file.name}`;

            // Create the file object
            const fileObject = {
              id: Date.now().toString(36) + Math.random().toString(36).substring(2),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString(),
              filePath: mockFilePath, // For offline processing, send only the path
              processingMode: useOffline ? 'offline' : 'online',
              status: 'processed'
            };

            // In a real application, we would save this to the server
            // For now, we'll just log it
            console.log('File uploaded:', fileObject);
            
            // Initialize uploaded files if needed
            const uploadedFiles = mockApiService._initUploadedFiles();
            
            // Add the file to our in-memory store
            if (!uploadedFiles.files) {
              uploadedFiles.files = [];
            }
            uploadedFiles.files.push(fileObject);

            resolve(fileObject);
          }, processingDelay);
        }
        onProgress && onProgress(progress);
      }, interval);
    });
  }
};

export default mockApiService;