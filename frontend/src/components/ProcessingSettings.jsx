import { useState, useEffect } from 'react'
import { FiSettings, FiWifi, FiWifiOff, FiX } from 'react-icons/fi'

function ProcessingSettings({ onSettingsChange, initialSettings = {} }) {
  const [settings, setSettings] = useState({
    useOffline: true, // Default to offline as per requirements
    ...initialSettings
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Load settings from JSON file on component mount
  useEffect(() => {
    // Import the settings from the JSON file
    import('../data/processingSettings.json')
      .then(data => {
        setSettings(prev => ({ ...prev, ...data }))
      })
      .catch(error => {
        console.error('Failed to load processing settings:', error)
      })
  }, [])

  // Notify parent when settings change
  useEffect(() => {
    onSettingsChange?.(settings)
    // In a real application, we would save changes back to the server here
    console.log('Settings updated:', settings)
  }, [settings, onSettingsChange])

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const openDialog = () => setIsDialogOpen(true)
  const closeDialog = () => setIsDialogOpen(false)

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={openDialog}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <FiSettings className="text-gray-500 dark:text-gray-400" size={16} />
        <span className="text-gray-700 dark:text-gray-300">Settings</span>
        <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
          {settings.useOffline ? (
            <>
              <FiWifiOff size={12} className="text-blue-600 dark:text-blue-400" />
              <span className="text-blue-600 dark:text-blue-400">Offline</span>
            </>
          ) : (
            <>
              <FiWifi size={12} className="text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">Online</span>
            </>
          )}
        </div>
      </button>

      {/* Dialog Overlay */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <FiSettings className="mr-2 text-gray-500 dark:text-gray-400" />
                Processing Settings
              </h3>
              <button
                onClick={closeDialog}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-4">
              {/* Processing Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    File Processing Mode
                  </label>
                  <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    {settings.useOffline ? (
                      <>
                        <FiWifiOff size={12} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-600 dark:text-blue-400">Offline</span>
                      </>
                    ) : (
                      <>
                        <FiWifi size={12} className="text-green-600 dark:text-green-400" />
                        <span className="text-green-600 dark:text-green-400">Online</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <input
                      type="radio"
                      name="processingMode"
                      checked={settings.useOffline}
                      onChange={() => handleSettingChange('useOffline', true)}
                      className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-600 dark:bg-gray-700"
                    />
                    <div className="flex items-center space-x-2">
                      <FiWifiOff className="text-blue-600 dark:text-blue-400" size={16} />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Use Offline</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Process files locally for faster response and privacy
                        </p>
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    <input
                      type="radio"
                      name="processingMode"
                      checked={!settings.useOffline}
                      onChange={() => handleSettingChange('useOffline', false)}
                      className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-600 dark:bg-gray-700"
                    />
                    <div className="flex items-center space-x-2">
                      <FiWifi className="text-green-600 dark:text-green-400" size={16} />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Use Online</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Upload files to server for processing (requires internet)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  {settings.useOffline ? (
                    <>
                      <p>• Files are processed locally on your device</p>
                      <p>• Only file paths are sent to the API</p>
                      <p>• Faster processing and better privacy</p>
                    </>
                  ) : (
                    <>
                      <p>• Files are uploaded to the server for processing</p>
                      <p>• Requires stable internet connection</p>
                      <p>• May provide more advanced processing features</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeDialog}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProcessingSettings