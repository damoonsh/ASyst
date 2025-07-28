import React from 'react';
import MessageBubble from './MessageBubble';
import ConversationMessage from './ConversationMessage';

function ChatMessages({
  currentSession,
  streamingMessage,
  isLoading,
  selectedModel,
  handleEditMessage,
  tempUserMessage,
  editingMessageId,
  editingMessageText
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
      {!currentSession || (currentSession?.messages?.length === 0 && !streamingMessage) ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <p className="text-xl font-medium mb-2">No messages yet</p>
          <p>Start a conversation by sending a message below</p>
        </div>
      ) : (
        <>
          {currentSession?.messages?.map((msg, index) => {
            // Check if the message has edits (new format from mockConversations.json)
            if (msg.edits && msg.edits.length > 0) {
              return (
                <ConversationMessage
                  key={msg.id || index}
                  message={msg}
                  handleEditMessage={handleEditMessage}
                  isBeingEdited={editingMessageId === msg.id}
                  editingText={editingMessageId === msg.id ? editingMessageText : null}
                  isGeneratingResponse={editingMessageId === msg.id && isLoading}
                  streamingMessage={editingMessageId === msg.id ? streamingMessage : null}
                  selectedModel={selectedModel}
                />
              );
            }
            // Handle legacy format (for backward compatibility)
            else {
              const isNewFormat = msg.question !== undefined;

              if (isNewFormat) {
                // Legacy new format with question-answer pairs
                return (
                  <div key={msg.id || index} className="space-y-2">
                    {/* Question (user message) */}
                    <MessageBubble
                      message={{ ...msg, isUser: true }}
                      isNewFormat={true}
                      onEditMessage={handleEditMessage}
                    />

                    {/* Answer (model response) */}
                    <MessageBubble
                      message={{ ...msg, isUser: false }}
                      isNewFormat={true}
                    />
                  </div>
                );
              } else {
                // Old format
                return (
                  <MessageBubble
                    key={msg.id || index}
                    message={msg}
                    isNewFormat={false}
                  />
                );
              }
            }
          })}
        </>
      )}

      {/* Show temporary user message during streaming (but not when editing) */}
      {tempUserMessage && !editingMessageId && (
        <div className="flex justify-end">
          <div className="max-w-[85%] md:max-w-[75%] rounded-lg p-3 shadow-sm bg-primary-100 dark:bg-primary-900/30 text-gray-800 dark:text-gray-100">
            <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
              <span>You</span>
              <span>{new Date(tempUserMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="whitespace-pre-wrap break-words">
              {tempUserMessage.question}
            </div>
          </div>
        </div>
      )}

      {/* Streaming message - only show when not editing (editing messages handle their own streaming) */}
      {streamingMessage && !editingMessageId && (
        <div className="flex justify-start">
          <div className="max-w-[85%] md:max-w-[75%] rounded-lg p-3 shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
            {/* Message header */}
            <div className="flex justify-between items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{selectedModel}</span>
              <span>Generating...</span>
            </div>

            {/* Streaming content */}
            <div className="whitespace-pre-wrap break-words">
              {streamingMessage}
              <span className="animate-pulse">▋</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator (only shown when not streaming) */}
      {isLoading && !streamingMessage && (
        <div className="flex justify-start">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 shadow-sm flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
      <div id="messages-end" />
    </div>
  );
}

export default ChatMessages;