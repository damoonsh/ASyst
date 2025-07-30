import React from 'react';
import { FiEdit2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ThinkingWidget from './ThinkingWidget';

function MessageBubble({ message, isNewFormat = false, onEditMessage, thinkingContent = null, isStreaming = false }) {
  // Handle different message formats
  const isUser = isNewFormat ? message.isUser : message.isUser;
  const content = isNewFormat
    ? (isUser ? message.question : message.answer)
    : message.content;
  const timestamp = message.timestamp;
  const modelName = message.model_name || message.modelName;

  // Extract thinking content from message data or use passed prop
  // For legacy messages from database, check if thinking content is embedded in answer
  let displayThinkingContent = thinkingContent;
  let displayContent = content;

  // For AI messages, check if thinking content is embedded in the content
  if (!isUser && !displayThinkingContent && content) {
    const thinkMatch = content.match(/^<think>(.*?)<\/think>/s);
    if (thinkMatch) {
      displayThinkingContent = thinkMatch[1].trim();
      displayContent = content.replace(/^<think>.*?<\/think>/s, '').trim();
    }
  }

  // Format the timestamp
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <>
      {/* Thinking widget for AI messages (positioned above the message) */}
      {!isUser && displayThinkingContent && (
        <div className="flex justify-start mb-1">
          <ThinkingWidget
            thinkingContent={displayThinkingContent}
            isStreaming={isStreaming}
          />
        </div>
      )}

      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[85%] md:max-w-[75%] rounded-lg p-3 shadow-sm ${isUser
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
                  onClick={() => onEditMessage(message.id, displayContent)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                  aria-label="Edit message"
                >
                  <FiEdit2 size={12} />
                </button>
              )}
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Message content with markdown rendering */}
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
              {displayContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </>
  );
}

export default MessageBubble;