import React from 'react';
import ProcessingSettings from '../ProcessingSettings';

function ChatHeader({
  selectedModel,
  setSelectedModel,
  availableModels,
  uploadedFiles,
  useContext,
  setUseContext,
  apiMode,
  setApiMode
}) {
  return (
    <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
      <div className="flex flex-wrap gap-3 items-start justify-between">
        {/* Left side: Model selector and File Upload */}
        <div className="flex flex-wrap gap-4 items-start">
          {/* Model selector */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Model
            </label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* File Upload Status */}
          {uploadedFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Uploaded Files
              </label>
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
          )}
        </div>

        {/* Right side: Controls */}
        <div className="flex items-center gap-3">
          {/* API/Mock Mode toggle */}
          <div className="flex items-center">
            <label htmlFor="api-mode-toggle" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
              API Mode
            </label>
            <div 
              className="relative inline-block w-10 align-middle select-none cursor-pointer"
              onClick={() => setApiMode(!apiMode)}
            >
              <input
                type="checkbox"
                name="api-mode-toggle"
                id="api-mode-toggle"
                checked={apiMode}
                onChange={() => setApiMode(!apiMode)}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full ${apiMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} transition-colors`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${apiMode ? 'translate-x-4' : ''}`}></div>
            </div>
          </div>

          {/* Context toggle */}
          <div className="flex items-center">
            <label htmlFor="context-toggle" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
              Use Context
            </label>
            <div 
              className="relative inline-block w-10 align-middle select-none cursor-pointer"
              onClick={() => setUseContext(!useContext)}
            >
              <input
                type="checkbox"
                name="context-toggle"
                id="context-toggle"
                checked={useContext}
                onChange={() => setUseContext(!useContext)}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full ${useContext ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'} transition-colors`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${useContext ? 'translate-x-4' : ''}`}></div>
            </div>
          </div>

          {/* Processing Settings */}
          <ProcessingSettings />
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;