import React from 'react';

function ChatHeader({
  uploadedFiles
}) {
  // Only render if there are uploaded files
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
        <span className="text-sm text-green-700 dark:text-green-300">
          {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} ready
        </span>
        {/* RAG Mode Indicator */}
        {uploadedFiles.some(file => file.name.toLowerCase().endsWith('.pdf')) && (
          <div className="flex items-center space-x-1 ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
            <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              RAG Mode
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatHeader;