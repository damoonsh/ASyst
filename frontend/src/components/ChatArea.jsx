import { useState, useEffect } from 'react'
import { useSession } from '../context/SessionContext'
import MessageInput from './chat/MessageInput'
import FileUpload from './chat/FileUpload'
import ChatHeader from './chat/ChatHeader'
import ChatMessages from './chat/ChatMessages'
import mockApiService from '../services/mockApiService'

function ChatArea() {
  const { currentSession, addMessage, updateSessionModel } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [availableModels, setAvailableModels] = useState([
    { id: "tinyllama:latest", name: "TinyLlama" },
    { id: "qwen3:0.6b", name: "Qwen 0.6B" },
    { id: "smollm2:360m", name: "SmoLLM2 360M" },
  ])
  const [selectedModel, setSelectedModel] = useState(availableModels[0].id)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [useContext, setUseContext] = useState(true)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [apiMode, setApiMode] = useState(false) // New state for API/Mock toggle

  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingMessageText, setEditingMessageText] = useState("")

  // Fetch available models on component mount
  useEffect(() => {
    mockApiService.getAvailableModels()
      .then(models => {
        setAvailableModels(models);
        setSelectedModel(models[0].id);
      })
      .catch(error => console.error("Failed to fetch models:", error));
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Use DOM API directly instead of useRef
    const messagesEnd = document.getElementById('messages-end')
    if (messagesEnd) {
      messagesEnd.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentSession?.messages, streamingMessage])

  // Store the initial model when the session changes
  useEffect(() => {
    if (currentSession) {
      // Just store the selected model locally, don't update the session
      setSelectedModel(currentSession.modelName || availableModels[0].id)
    }
  }, [currentSession])

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading) return

    // Add user message to chat - no model name for user messages
    await addMessage(message, true, null)

    // Set loading state
    setIsLoading(true)
    setStreamingMessage("")

    if (apiMode) {
      // This would be replaced with actual API call in a real implementation
      console.log("Using real API service (not implemented)");
      // Simulate API call for now
      setTimeout(() => {
        const response = "This is a simulated API response. In a real implementation, this would call your backend API.";
        addMessage(response, false, selectedModel);
        setIsLoading(false);
      }, 1000);
    } else {
      // Use our mock API service
      mockApiService.sendMessage(
        message,
        selectedModel,
        useContext && uploadedFiles.length > 0,
        // On chunk callback
        (chunk) => {
          setStreamingMessage(prev => prev + chunk);
        },
        // On complete callback
        (fullResponse) => {
          // Handle the response based on the current session format
          if (currentSession && currentSession.messages) {
            const lastMessageIndex = currentSession.messages.length - 1;
            const lastMessage = currentSession.messages[lastMessageIndex];

            // Check if we're using the edits format
            if (lastMessage && lastMessage.edits) {
              // Add a new edit to the message
              mockApiService.addMessageEdit(
                currentSession.id,
                lastMessage.id,
                message,
                fullResponse,
                selectedModel
              ).then(() => {
                // Refresh the session to get the updated messages
                mockApiService.getConversation(currentSession.id)
                  .then(updatedSession => {
                    // Update the session with the new messages
                    updateSessionModel(currentSession.id, selectedModel, updatedSession.messages);
                  });
              });
            }
            // If we're using the question-answer format
            else if (lastMessage && lastMessage.question) {
              // Update the last message with the answer
              const updatedMessage = {
                ...lastMessage,
                answer: fullResponse,
                model_name: selectedModel
              };

              // Replace the last message with the updated one
              const updatedMessages = [...currentSession.messages];
              updatedMessages[lastMessageIndex] = updatedMessage;

              // Update the session with the new messages
              updateSessionModel(currentSession.id, selectedModel, updatedMessages);
            } else {
              // Fall back to the old way if needed
              addMessage(fullResponse, false, selectedModel);
            }
          }

          setIsLoading(false);
          setStreamingMessage("");
        },
        // On error callback
        (error) => {
          console.error("Error in mock API:", error);
          addMessage("I'm sorry, I encountered an error processing your request.", false, selectedModel);
          setIsLoading(false);
          setStreamingMessage("");
        },
        // Thread ID for saving the conversation
        currentSession?.id
      );
    }
  }

  const handleFileUpload = async (file, onProgress) => {
    setIsProcessing(true)

    try {
      const result = await mockApiService.uploadFile(file, onProgress, window.processingSettings.useOffline)

      // Add the uploaded file to the list
      setUploadedFiles(prev => [...prev, result])

      setIsProcessing(false)
      return result
    } catch (error) {
      setIsProcessing(false)
      throw error
    }
  }

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  // No longer need handleSettingsChange as settings are managed globally

  // Handle editing a message
  const handleEditMessage = (messageId, questionText) => {
    setEditingMessageId(messageId)
    setEditingMessageText(questionText)
  }

  // Handle submitting an edited message
  const handleSubmitEdit = async () => {
    if (!editingMessageId || !editingMessageText.trim()) return

    // Find the message being edited
    const messageToEdit = currentSession.messages.find(msg => msg.id === editingMessageId)
    if (!messageToEdit) return

    // Set loading state
    setIsLoading(true)

    // If the message has edits, add a new edit
    if (messageToEdit.edits) {
      // Get the latest edit
      const latestEdit = messageToEdit.edits[messageToEdit.edits.length - 1];

      // Add a new edit with the updated question
      mockApiService.addMessageEdit(
        currentSession.id,
        messageToEdit.id,
        editingMessageText,
        latestEdit.answer,
        selectedModel
      ).then(() => {
        // Refresh the session to get the updated messages
        mockApiService.getConversation(currentSession.id)
          .then(updatedSession => {
            // Update the session with the new messages
            updateSessionModel(currentSession.id, selectedModel, updatedSession.messages);

            // Clear editing state
            setEditingMessageId(null);
            setEditingMessageText("");
            setIsLoading(false);
          });
      });
    } else {
      // For legacy format, just update the message
      const updatedMessages = [...currentSession.messages];
      const messageIndex = updatedMessages.findIndex(msg => msg.id === editingMessageId);

      if (messageIndex !== -1) {
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          question: editingMessageText
        };

        // Update the session with the new messages
        updateSessionModel(currentSession.id, selectedModel, updatedMessages);
      }

      // Clear editing state
      setEditingMessageId(null);
      setEditingMessageText("");
      setIsLoading(false);
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingMessageText("")
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full">
      {/* Header with model selector and controls */}
      <ChatHeader
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        availableModels={availableModels}
        uploadedFiles={uploadedFiles}
        useContext={useContext}
        setUseContext={setUseContext}
        apiMode={apiMode}
        setApiMode={setApiMode}
      />

      {/* Chat messages area */}
      <ChatMessages
        currentSession={currentSession}
        streamingMessage={streamingMessage}
        isLoading={isLoading}
        selectedModel={selectedModel}
        handleEditMessage={handleEditMessage}
      />

      {/* Message input - added shrink-0 to prevent it from shrinking */}
      <div className="shrink-0">
        {editingMessageId ? (
          <MessageInput
            initialMessage={editingMessageText}
            onSendMessage={handleSubmitEdit}
            isLoading={isLoading}
            onToggleFileUpload={() => { }}
            hasFiles={false}
            isEditing={true}
            onCancelEdit={handleCancelEdit}
          />
        ) : (
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onToggleFileUpload={() => setShowFileUploadDialog(true)}
            hasFiles={uploadedFiles.length > 0}
          />
        )}
      </div>

      {/* File Upload Dialog - controlled by external state */}
      <FileUpload
        onFileUpload={handleFileUpload}
        onFileRemove={handleRemoveFile}
        uploadedFiles={uploadedFiles}
        isProcessing={isProcessing}
        isDialogOpen={showFileUploadDialog}
        onDialogClose={() => setShowFileUploadDialog(false)}
      />
    </div>
  )
}

export default ChatArea