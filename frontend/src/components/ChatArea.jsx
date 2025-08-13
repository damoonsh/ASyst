import { useState, useEffect } from 'react'
import { useSession } from '../context/SessionContext'
import MessageInput from './chat/MessageInput'
import FileUpload from './chat/FileUpload'
import ChatHeader from './chat/ChatHeader'
import ChatMessages from './chat/ChatMessages'
import apiService from '../services/apiService'
import mockApiService from '../services/mockApiService'

function ChatArea({ useContext, setUseContext }) {
  const { currentSession, addMessage, updateSessionModel, convertTemporarySession, updateSessionTitle } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [availableModels, setAvailableModels] = useState([
    { id: "smollm2:360m", name: "SmoLLM2" },
    { id: "tinyllama:latest", name: "TinyLlama" },
    { id: "qwen3:0.6b", name: "Qwen 0.6B" },
    { id: "qwen2.5-coder:0.5b", name: "Qwen2.5-Coder" }
  ])
  const [selectedModel, setSelectedModel] = useState(availableModels[0].id)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [apiMode, setApiMode] = useState(true) // Default to real API mode
  const [tempUserMessage, setTempUserMessage] = useState(null)

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
      console.log('Current session changed:', {
        id: currentSession.id,
        title: currentSession.title,
        isTemporary: currentSession.isTemporary,
        messagesCount: currentSession.messages?.length || 0
      })

      // If we're in the middle of loading and the session changes unexpectedly, log it
      if (isLoading) {
        console.warn('Session changed while loading - this might cause issues!')
      }
    }
  }, [currentSession, isLoading])

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading) return

    // Store the current session ID to ensure we stay in the same session
    const originalSessionId = currentSession?.id
    console.log('Starting message send for session:', originalSessionId)

    // Set loading state and store the current user message for display during streaming
    setIsLoading(true)
    setStreamingMessage("")

    // Store the user message temporarily for display during streaming
    setTempUserMessage({
      question: message,
      timestamp: new Date().toISOString(),
      isTemporary: true
    })

    if (apiMode) {
      // Use real API service with LLM endpoint
      try {
        // Handle thread creation if needed
        let threadId = currentSession.id
        let actualSessionId = currentSession.id

        if (currentSession.isTemporary) {
          // Create a new thread first
          const newThread = await apiService.createThread()
          threadId = newThread.thread_id

          // Convert temporary session to use backend-generated thread_id
          console.log('Converting temporary session:', {
            oldId: currentSession.id,
            newThreadId: newThread.thread_id,
            newTitle: newThread.title
          })

          const newSessionId = convertTemporarySession(currentSession.id, newThread)
          actualSessionId = newSessionId
        }

        // Check if we have PDF files to determine which endpoint to use
        const hasPDFs = uploadedFiles.some(file => file.name.toLowerCase().endsWith('.pdf'))
        let stream
        let processStreamFunction

        if (hasPDFs) {
          // Use RAG endpoint when PDFs are available
          console.log('Using RAG endpoint due to PDF files:', uploadedFiles.filter(f => f.name.toLowerCase().endsWith('.pdf')).map(f => f.name))

          // Use the original File object if available, otherwise fall back to path/filename
          const firstPDF = uploadedFiles.find(file => file.name.toLowerCase().endsWith('.pdf'))
          const pdfFile = firstPDF ? (firstPDF.originalFile || firstPDF.path || firstPDF.name) : null

          stream = await apiService.callRAG(message, selectedModel, pdfFile)
          processStreamFunction = apiService.processRAGStream
        } else {
          // Use regular LLM endpoint when no PDFs
          console.log('Using regular LLM endpoint (no PDFs)')
          stream = await apiService.callLLM(message, selectedModel)
          processStreamFunction = apiService.processLLMStream
        }

        // Process the streaming response
        await processStreamFunction(
          stream,
          // On chunk callback
          (chunk) => {
            setStreamingMessage(prev => prev + chunk)
          },
          // On complete callback
          async (fullResponse, contextUsed = false, thinking = null) => {
            // Determine if this is the first message in the thread
            // Only true if the session was temporary (meaning this is the very first message)
            const isFirstMessage = currentSession.isTemporary
            console.log('Debug firstMessage:', {
              isTemporary: currentSession.isTemporary,
              messagesLength: currentSession.messages?.length,
              isFirstMessage,
              threadId,
              actualSessionId
            })

            // Create the message in the backend with the complete response
            await apiService.createMessage(
              threadId,
              message,
              fullResponse,
              selectedModel,
              isFirstMessage
            )

            // Use the thread_id to refresh the conversation
            const updatedConversation = await apiService.getConversation(threadId)
            const transformedConversation = apiService.transformConversation(updatedConversation)

            console.log('Updating session with conversation:', {
              actualSessionId,
              threadId,
              currentSessionId: currentSession?.id,
              messagesCount: transformedConversation.messages.length,
              title: transformedConversation.title,
              contextUsed: contextUsed || false,
              endpointUsed: hasPDFs ? 'RAG' : 'LLM'
            })

            // Update the session with the new messages and title
            updateSessionModel(actualSessionId, selectedModel, transformedConversation.messages)
            updateSessionTitle(actualSessionId, transformedConversation.title)

            setIsLoading(false)
            setStreamingMessage("")

            // Keep temp message visible for a moment to ensure smooth transition
            setTimeout(() => {
              setTempUserMessage(null)
            }, 500)

            // Verify we're still in the same session
            if (currentSession?.id !== originalSessionId && currentSession?.id !== actualSessionId) {
              console.error('Session changed unexpectedly!', {
                original: originalSessionId,
                expected: actualSessionId,
                current: currentSession?.id
              })
            } else {
              console.log('Session consistency maintained:', {
                original: originalSessionId,
                final: currentSession?.id
              })
            }

            // Title is already updated above, no need for separate update
          },
          // On error callback
          (error) => {
            console.error("Error with LLM streaming:", error)
            addMessage("I'm sorry, I encountered an error processing your request.", false, selectedModel)
            setIsLoading(false)
            setStreamingMessage("")
            setTempUserMessage(null)
          }
        )
      } catch (error) {
        console.error("Error with real API:", error)
        addMessage("I'm sorry, I encountered an error processing your request.", false, selectedModel)
        setIsLoading(false)
        setStreamingMessage("")
        setTempUserMessage(null)
      }
    } else {
      // Use our mock API service for streaming responses
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
              // Mock mode: Just update the UI directly (no persistence)
              const updatedMessage = {
                ...lastMessage,
                edits: [...lastMessage.edits, {
                  edit_id: `mock_edit_${lastMessage.edits.length + 1}`,
                  model_name: selectedModel,
                  timestamp: new Date().toISOString(),
                  question: message,
                  answer: fullResponse
                }]
              };

              const updatedMessages = [...currentSession.messages];
              updatedMessages[lastMessageIndex] = updatedMessage;
              updateSessionModel(currentSession.id, selectedModel, updatedMessages);
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
          setTempUserMessage(null);
        },
        // On error callback
        (error) => {
          console.error("Error in mock API:", error);
          addMessage("I'm sorry, I encountered an error processing your request.", false, selectedModel);
          setIsLoading(false);
          setStreamingMessage("");
          setTempUserMessage(null);
        },
        // Thread ID for saving the conversation
        currentSession?.id
      );
    }
  }

  const handleFileUpload = async (file, onProgress) => {
    setIsProcessing(true)

    // Mock mode: Simulate file upload without actual processing
    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        onProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create mock file object with path information
      const mockFile = {
        id: `mock_file_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        // Try to get the full path if available (works in some browsers/contexts)
        path: file.path || file.webkitRelativePath || file.name,
        // Store the original File object for potential use
        originalFile: file
      };

      setUploadedFiles(prev => [...prev, mockFile]);
      setIsProcessing(false);
      return mockFile;
    } catch (error) {
      setIsProcessing(false);
      throw error;
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
  const handleSubmitEdit = async (updatedMessage) => {
    if (!editingMessageId || !updatedMessage.trim()) return

    // Find the message being edited
    const messageToEdit = currentSession.messages.find(msg => msg.id === editingMessageId)
    if (!messageToEdit) return

    // Set loading state
    setIsLoading(true)

    try {
      if (apiMode) {
        // Use real API service with appropriate endpoint
        if (messageToEdit.edits) {
          // Check if we have PDF files to determine which endpoint to use
          const hasPDFs = uploadedFiles.some(file => file.name.toLowerCase().endsWith('.pdf'))
          let stream
          let processStreamFunction

          if (hasPDFs) {
            // Use RAG endpoint when PDFs are available
            console.log('Using RAG endpoint for edit due to PDF files')
            const firstPDF = uploadedFiles.find(file => file.name.toLowerCase().endsWith('.pdf'))
            const pdfFile = firstPDF ? (firstPDF.originalFile || firstPDF.path || firstPDF.name) : null

            stream = await apiService.callRAG(updatedMessage, selectedModel, pdfFile)
            processStreamFunction = apiService.processRAGStream
          } else {
            // Use regular LLM endpoint when no PDFs
            console.log('Using regular LLM endpoint for edit (no PDFs)')
            stream = await apiService.callLLM(updatedMessage, selectedModel)
            processStreamFunction = apiService.processLLMStream
          }

          // Process the streaming response
          await processStreamFunction(
            stream,
            // On chunk callback
            (chunk) => {
              setStreamingMessage(prev => prev + chunk)
            },
            // On complete callback
            async (fullResponse, contextUsed = false, thinking = null) => {
              // Create a new edit with the updated question and new answer
              await apiService.createMessageEdit(
                messageToEdit.id,
                updatedMessage,
                fullResponse,
                selectedModel
              )

              // Refresh the conversation to get the updated data
              const updatedConversation = await apiService.getConversation(currentSession.id)
              const transformedConversation = apiService.transformConversation(updatedConversation)

              // Update the session with the new messages
              updateSessionModel(currentSession.id, selectedModel, transformedConversation.messages)

              setStreamingMessage("")
            },
            // On error callback
            (error) => {
              console.error("Error with LLM streaming during edit:", error)
              setStreamingMessage("")
              throw error
            }
          )
        }
      } else {
        // Use mock API service - just update UI directly
        if (messageToEdit.edits) {
          // Get the latest edit
          const latestEdit = messageToEdit.edits[messageToEdit.edits.length - 1];

          // Mock mode: Add new edit directly to UI state
          const newEdit = {
            edit_id: `mock_edit_${messageToEdit.edits.length + 1}`,
            model_name: selectedModel,
            timestamp: new Date().toISOString(),
            question: updatedMessage,
            answer: latestEdit.answer
          };

          const updatedMessages = [...currentSession.messages];
          const messageIndex = updatedMessages.findIndex(msg => msg.id === editingMessageId);

          if (messageIndex !== -1) {
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              edits: [...updatedMessages[messageIndex].edits, newEdit]
            };
            updateSessionModel(currentSession.id, selectedModel, updatedMessages);
          }
        } else {
          // For legacy format, just update the message
          const updatedMessages = [...currentSession.messages];
          const messageIndex = updatedMessages.findIndex(msg => msg.id === editingMessageId);

          if (messageIndex !== -1) {
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              question: updatedMessage
            };

            // Update the session with the new messages
            updateSessionModel(currentSession.id, selectedModel, updatedMessages);
          }
        }
      }

      // Clear editing state
      setEditingMessageId(null);
      setEditingMessageText("");
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to submit edit:', error)
      setIsLoading(false)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingMessageText("")
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full">
      {/* Header with file upload status */}
      <ChatHeader
        uploadedFiles={uploadedFiles}
      />

      {/* Chat messages area */}
      <ChatMessages
        currentSession={currentSession}
        streamingMessage={streamingMessage}
        isLoading={isLoading}
        selectedModel={selectedModel}
        handleEditMessage={handleEditMessage}
        tempUserMessage={tempUserMessage}
        editingMessageId={editingMessageId}
        editingMessageText={editingMessageText}
      />

      {/* Message input - added shrink-0 to prevent it from shrinking */}
      <div className="shrink-0">
        {editingMessageId ? (
          <MessageInput
            initialMessage={editingMessageText}
            onSendMessage={(updatedMessage) => handleSubmitEdit(updatedMessage)}
            isLoading={isLoading}
            onToggleFileUpload={() => { }}
            hasFiles={false}
            isEditing={true}
            onCancelEdit={handleCancelEdit}
            onFileUpload={handleFileUpload}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            availableModels={availableModels}
            useContext={useContext}
            setUseContext={setUseContext}
          />
        ) : (
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onToggleFileUpload={() => setShowFileUploadDialog(true)}
            hasFiles={uploadedFiles.length > 0}
            onFileUpload={handleFileUpload}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            availableModels={availableModels}
            useContext={useContext}
            setUseContext={setUseContext}
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