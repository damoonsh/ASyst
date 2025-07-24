import React from 'react';
import { FiEdit2 } from 'react-icons/fi';

function MessageBubble({ message, isNewFormat = false, onEditMessage }) {
  // Handle different message formats
  const isUser = isNewFormat ? message.isUser : message.isUser;
  const content = isNewFormat 
    ? (isUser ? message.question : message.answer) 
    : message.content;
  const timestamp = message.timestamp;
  const modelName = message.model_name || message.modelName;
  
  // Format the timestamp
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[85%] md:max-w-[75%] rounded-lg p-3 shadow-sm ${
          isUser 
            ? 'bg-primary-100 dark:bg-primary-900/30 text-gray-800 dark:text-gray-100' 
            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100'
        }`}
      >
        {/* Message header with model name or user indicator */}
        <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{isUser ? 'You' : modelName}</span>
          <div className="flex items-center gap-2">
            {isUser && onEditMessage && (
              <button 
                onClick={() => onEditMessage(message.id, content)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                aria-label="Edit message"
              >
                <FiEdit2 size={12} />
              </button>
            )}
            <span>{formattedTime}</span>
          </div>
        </div>
        
        {/* Message content with proper whitespace handling */}
        <div className="whitespace-pre-wrap break-words">
          {content}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;