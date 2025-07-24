import { useState, useEffect } from 'react'
import { FiSend, FiPaperclip, FiX, FiCheck } from 'react-icons/fi'

function MessageInput({ 
  onSendMessage, 
  isLoading, 
  onToggleFileUpload, 
  hasFiles = false, 
  isEditing = false,
  initialMessage = '',
  onCancelEdit
}) {
  const [message, setMessage] = useState(initialMessage)
  
  // Update message when initialMessage changes (for editing mode)
  useEffect(() => {
    setMessage(initialMessage)
  }, [initialMessage])

  const handleSendMessage = () => {
    if (!message.trim() || isLoading) return

    onSendMessage(message)
    setMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else if (e.key === 'Escape' && isEditing) {
      onCancelEdit()
    }
  }

  return (
    <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${isEditing ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
      {isEditing && (
        <div className="mb-2 text-sm text-yellow-700 dark:text-yellow-400 max-w-4xl mx-auto">
          Editing message...
        </div>
      )}
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {!isEditing ? (
          <button
            onClick={onToggleFileUpload}
            className={`p-3 rounded-full transition-colors self-end ${hasFiles
                ? 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            aria-label="Toggle file upload"
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isEditing ? "Edit your message..." : "Type your message..."}
          className={`flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent ${
            isEditing 
              ? 'border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-yellow-500' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500'
          }`}
          rows={1}
          style={{ minHeight: '44px', maxHeight: '200px' }}
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
    </div>
  )
}

export default MessageInput