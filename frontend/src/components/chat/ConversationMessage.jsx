import React, { useState, useRef, useEffect } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ThinkingWidget from './ThinkingWidget';
import EditNavigation from './EditNavigation';

function ConversationMessage({
  message,
  handleEditMessage,
  isBeingEdited = false,
  editingText = null,
  isGeneratingResponse = false,
  streamingMessage = null,
  selectedModel = null
}) {
  const [currentEditIndex, setCurrentEditIndex] = useState(message.edits.length - 1);
  const currentEdit = message.edits[currentEditIndex];

  // When editing starts, always show the latest edit
  useEffect(() => {
    if (isBeingEdited) {
      setCurrentEditIndex(message.edits.length - 1);
    }
  }, [isBeingEdited, message.edits.length]);

  // If being edited, show the editing text for the question
  const displayQuestion = isBeingEdited && editingText ? editingText : currentEdit.question;

  // If generating response, show streaming message or loading, otherwise show current answer
  const displayAnswer = isGeneratingResponse
    ? (streamingMessage || "Generating response...")
    : currentEdit.answer;

  // Extract thinking content for display (from current edit or streaming message)
  const thinkingContent = isGeneratingResponse
    ? (streamingMessage?.thinking || null)
    : currentEdit.thinking;
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
    <>
      <div
        className="space-y-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* User question */}
        <div className="flex justify-end">
          <div className="max-w-[85%] md:max-w-[75%] rounded-lg p-3 shadow-sm bg-primary-100 dark:bg-primary-900/30 text-gray-800 dark:text-gray-100">
            {/* Message header */}
            <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
              <span>You</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => !isBeingEdited && handleEditMessage(message.id, currentEdit.question)}
                  className={`p-1 rounded-full transition-colors ${isBeingEdited
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  aria-label="Edit message"
                  disabled={isBeingEdited}
                >
                  <FiEdit2 size={12} />
                </button>
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Question content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={dark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {displayQuestion}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Edit navigation controls (only shown if there are multiple edits and not being edited) */}
        {message.edits.length > 1 && !isBeingEdited && (
          <div className="flex justify-end">
            <div className="max-w-[85%] md:max-w-[75%]">
              <EditNavigation
                currentEditIndex={currentEditIndex}
                totalEdits={message.edits.length}
                onPreviousEdit={goToPreviousEdit}
                onNextEdit={goToNextEdit}
              />
            </div>
          </div>
        )}
        {thinkingContent && (
          <div className="flex justify-start mb-1">
            <ThinkingWidget
              thinkingContent={thinkingContent}
              isStreaming={isGeneratingResponse}
            />
          </div>
        )}
        {/* AI answer */}
        <div className="flex justify-start">
          <div className="max-w-[85%] md:max-w-[75%] rounded-lg p-3 shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
            {/* Message header */}
            <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{isGeneratingResponse && selectedModel ? selectedModel : currentEdit.model_name}</span>
              <span>{isGeneratingResponse ? "Generating..." : formattedTime}</span>
            </div>

            {/* Answer content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={dark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {displayAnswer}
              </ReactMarkdown>
              {isGeneratingResponse && streamingMessage && (
                <span className="animate-pulse">▋</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConversationMessage;