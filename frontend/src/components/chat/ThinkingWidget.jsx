import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

function ThinkingWidget({ thinkingContent, isStreaming = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to trim <think> tokens from the content
  const trimThinkTokens = (content) => {
    if (!content) return '';
    
    // Remove <think> and </think> tags (with optional spaces) and trim whitespace
    return content
      .replace(/^<think>\s*/i, '')
      .replace(/\s*<\/think>$/i, '')
      .trim();
  };

  const cleanThinkingContent = trimThinkTokens(thinkingContent);

  if (!cleanThinkingContent) {
    return null;
  }

  // Dynamic styling based on streaming state
  const containerClasses = isStreaming 
    ? "max-w-[85%] md:max-w-[75%] rounded-lg shadow-sm border animate-gradient-shift bg-gradient-to-r from-sky-100 via-teal-100 to-blue-200 dark:from-sky-900/30 dark:via-teal-900/30 dark:to-blue-900/30 border-sky-300 dark:border-sky-700"
    : "max-w-[85%] md:max-w-[75%] rounded-lg shadow-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700";

  const headerClasses = isStreaming
    ? "w-full flex items-center justify-between p-3 text-left hover:bg-sky-200/50 dark:hover:bg-sky-800/30 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
    : "w-full flex items-center justify-between p-3 text-left hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800";

  return (
    <div className={containerClasses}>
      {/* Thinking widget header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={headerClasses}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse thinking content" : "Expand thinking content"}
      >
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span>💭</span>
          <span className="font-medium">Thinking{isStreaming ? '...' : ''}</span>
        </div>
        {isExpanded ? (
          <FiChevronUp size={16} className="text-gray-500 dark:text-gray-400" />
        ) : (
          <FiChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
        )}
      </button>
      
      {/* Thinking content (collapsible) */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600 mt-0">
          <div className="pt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
            {cleanThinkingContent}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThinkingWidget;