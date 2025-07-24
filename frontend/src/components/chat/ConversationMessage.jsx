import React, { useState, useRef, useEffect } from 'react';
import { FiEdit2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function ConversationMessage({ message, handleEditMessage }) {
  const [currentEditIndex, setCurrentEditIndex] = useState(message.edits.length - 1);
  const currentEdit = message.edits[currentEditIndex];
  const containerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Format the timestamp
  const formattedTime = new Date(currentEdit.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Handle swipe navigation between edits
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diffX = touchStartX.current - touchEndX.current;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // Swipe left - go to next edit (if available)
        if (currentEditIndex < message.edits.length - 1) {
          setCurrentEditIndex(currentEditIndex + 1);
        }
      } else {
        // Swipe right - go to previous edit (if available)
        if (currentEditIndex > 0) {
          setCurrentEditIndex(currentEditIndex - 1);
        }
      }
    }
    
    // Reset touch coordinates
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Navigate to previous edit
  const goToPreviousEdit = () => {
    if (currentEditIndex > 0) {
      setCurrentEditIndex(currentEditIndex - 1);
    }
  };

  // Navigate to next edit
  const goToNextEdit = () => {
    if (currentEditIndex < message.edits.length - 1) {
      setCurrentEditIndex(currentEditIndex + 1);
    }
  };

  return (
    <div 
      className="space-y-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Edit navigation controls (only shown if there are multiple edits) */}
      {message.edits.length > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <div className="flex items-center">
            <span>Edit {currentEditIndex + 1} of {message.edits.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={goToPreviousEdit}
              disabled={currentEditIndex === 0}
              className={`p-1 rounded ${currentEditIndex === 0 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              aria-label="Previous edit"
            >
              <FiChevronLeft size={16} />
            </button>
            <button 
              onClick={goToNextEdit}
              disabled={currentEditIndex === message.edits.length - 1}
              className={`p-1 rounded ${currentEditIndex === message.edits.length - 1 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              aria-label="Next edit"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* User question */}
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[75%] rounded-lg p-3 shadow-sm bg-primary-100 dark:bg-primary-900/30 text-gray-800 dark:text-gray-100">
          {/* Message header */}
          <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
            <span>You</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleEditMessage(message.id, currentEdit.question)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                aria-label="Edit message"
              >
                <FiEdit2 size={12} />
              </button>
              <span>{formattedTime}</span>
            </div>
          </div>
          
          {/* Question content */}
          <div className="whitespace-pre-wrap break-words">
            {currentEdit.question}
          </div>
        </div>
      </div>

      {/* AI answer */}
      <div className="flex justify-start">
        <div className="max-w-[85%] md:max-w-[75%] rounded-lg p-3 shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
          {/* Message header */}
          <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{currentEdit.model_name}</span>
            <span>{formattedTime}</span>
          </div>
          
          {/* Answer content */}
          <div className="whitespace-pre-wrap break-words">
            {currentEdit.answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConversationMessage;