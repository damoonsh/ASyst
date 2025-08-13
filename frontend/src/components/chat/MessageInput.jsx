import { useState, useEffect, useRef } from 'react'
import { FiSend, FiPaperclip, FiX, FiCheck, FiUpload, FiCpu, FiLayers } from 'react-icons/fi'

function MessageInput({ 
  onSendMessage, 
  isLoading, 
  onToggleFileUpload, 
  hasFiles = false, 
  isEditing = false,
  initialMessage = '',
  onCancelEdit,
  onFileUpload,
  selectedModel,
  setSelectedModel,
  availableModels,
  useContext,
  setUseContext
}) {
  const [message, setMessage] = useState(initialMessage)
  const [isDragOver, setIsDragOver] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState([])
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showContextDropdown, setShowContextDropdown] = useState(false)
  const [contextModel, setContextModel] = useState(selectedModel)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const dragCounterRef = useRef(0)
  const modelDropdownRef = useRef(null)
  const contextDropdownRef = useRef(null)
  
  // Auto-resize textarea function
  const autoResize = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }

  // Update message when initialMessage changes (for editing mode)
  useEffect(() => {
    setMessage(initialMessage)
    // Auto-resize after setting initial message
    setTimeout(autoResize, 0)
  }, [initialMessage])

  // Auto-resize when component mounts
  useEffect(() => {
    autoResize()
  }, [])

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false)
      }
      if (contextDropdownRef.current && !contextDropdownRef.current.contains(event.target)) {
        setShowContextDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSendMessage = () => {
    if (!message.trim() || isLoading) return

    onSendMessage(message)
    setMessage('')
    setAttachedFiles([]) // Clear attached files after sending
    // Reset textarea height after sending
    setTimeout(autoResize, 0)
  }

  const handleMessageChange = (e) => {
    setMessage(e.target.value)
    autoResize()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else if (e.key === 'Escape' && isEditing) {
      onCancelEdit()
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    dragCounterRef.current = 0

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileAttachment(files)
    }
  }

  const handleFileAttachment = (files) => {
    const newFiles = files.map(file => ({
      id: `temp_${Date.now()}_${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }))
    
    setAttachedFiles(prev => [...prev, ...newFiles])
    
    // If onFileUpload is provided, call it for each file
    if (onFileUpload) {
      files.forEach(file => {
        onFileUpload(file, (progress) => {
          // Handle upload progress if needed
          console.log(`Upload progress for ${file.name}: ${progress}%`)
        })
      })
    }
  }

  const handleRemoveAttachedFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleFileAttachment(files)
    }
    // Reset the input so the same file can be selected again
    e.target.value = ''
  }

  const handlePaperclipClick = () => {
    if (isEditing) return
    fileInputRef.current?.click()
  }

  return (
    <div 
      className={`relative p-4 border-t border-gray-200 dark:border-gray-700 ${isEditing ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isEditing && (
        <div className="mb-2 text-sm text-yellow-700 dark:text-yellow-400 max-w-4xl mx-auto">
          Editing message...
        </div>
      )}

      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-4 bg-primary-500/10 border-2 border-dashed border-primary-500 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <FiUpload className="mx-auto mb-2 text-primary-500" size={32} />
            <p className="text-primary-600 dark:text-primary-400 font-medium">Drop files here to attach</p>
          </div>
        </div>
      )}

      {/* Attached Files Display */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map(file => (
              <div key={file.id} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm">
                <FiPaperclip className="text-gray-500 dark:text-gray-400" size={14} />
                <span className="text-gray-700 dark:text-gray-300 truncate max-w-32">
                  {file.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  onClick={() => handleRemoveAttachedFile(file.id)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  aria-label={`Remove ${file.name}`}
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 max-w-4xl mx-auto relative">
        {/* Model Selector */}
        {selectedModel && availableModels && (
          <div className="relative flex flex-col items-center" ref={modelDropdownRef}>
            {/* Model selector icon button */}
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="p-3 rounded-full transition-colors self-end text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Select model"
            >
              <FiCpu size={20} />
            </button>

            {/* Dropdown menu */}
            {showModelDropdown && (
              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[200px]">
                <div className="py-1">
                  {availableModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
                        setShowModelDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedModel === model.id 
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Context Management */}
        {setUseContext && availableModels && (
          <div className="relative flex flex-col items-center" ref={contextDropdownRef}>
            {/* Context selector icon button */}
            <button
              onClick={() => setShowContextDropdown(!showContextDropdown)}
              className={`p-3 rounded-full transition-colors self-end ${
                useContext 
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label="Context model selector"
            >
              <FiLayers size={20} />
            </button>

            {/* Context Dropdown menu */}
            {showContextDropdown && (
              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[200px]">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                    Context Settings
                  </div>
                  <button
                    onClick={() => {
                      setUseContext(!useContext)
                      setShowContextDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {useContext ? '✓ Context Enabled' : '○ Context Disabled'}
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-600 mt-1 pt-1">
                    <div className="px-4 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Context Model
                    </div>
                    {availableModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setContextModel(model.id)
                          setShowContextDropdown(false)
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          contextModel === model.id 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isEditing ? (
          <button
            onClick={handlePaperclipClick}
            className={`p-3 rounded-full transition-colors self-end ${hasFiles || attachedFiles.length > 0
                ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            aria-label="Attach files"
          >
            <FiPaperclip size={20} />
          </button>
        ) : (
          <button
            onClick={onCancelEdit}
            className="p-3 rounded-full transition-colors self-end text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            aria-label="Cancel edit"
          >
            <FiX size={20} />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder={isEditing ? "Edit your message..." : "Type your message..."}
          className={`flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent ${
            isEditing 
              ? 'border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-yellow-500' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500'
          }`}
          rows={1}
          style={{ minHeight: '44px', maxHeight: '200px', height: '44px' }}
          autoFocus={isEditing}
        />

        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || isLoading}
          className={`p-3 rounded-full self-end ${
            !message.trim() || isLoading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : isEditing
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-primary-600 text-white hover:bg-primary-700'
          } transition-colors`}
          aria-label={isEditing ? "Save edit" : "Send message"}
        >
          {isEditing ? <FiCheck size={20} /> : <FiSend size={20} />}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        accept="*/*"
      />
    </div>
  )
}

export default MessageInput