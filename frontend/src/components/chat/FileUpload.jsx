import { useState, useRef } from 'react'
import { FiUpload, FiFile, FiX, FiCheck, FiFileText } from 'react-icons/fi'
import { FaFilePdf } from 'react-icons/fa'

function FileUpload({
  onFileUpload,
  onFileRemove,
  uploadedFiles = [],
  isProcessing = false,
  isDialogOpen = false,
  onDialogClose = null
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [internalDialogOpen, setInternalDialogOpen] = useState(false)
  const fileInputRef = useRef(null)

  // Use external dialog state if provided, otherwise use internal state
  const dialogOpen = onDialogClose ? isDialogOpen : internalDialogOpen

  // Supported file types
  const supportedTypes = {
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'text/markdown': '.md'
  }

  const supportedExtensions = ['.pdf', '.txt', '.md']

  const validateFile = (file) => {
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    const isValidType = Object.keys(supportedTypes).includes(file.type) ||
      supportedExtensions.includes(fileExtension)

    if (!isValidType) {
      throw new Error('Invalid file type. Please upload a PDF, TXT, or MD file.')
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Please upload files smaller than 10MB.')
    }

    return true
  }

  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      try {
        validateFile(file)

        // Set initial progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

        // Simulate upload progress and call onFileUpload
        await onFileUpload(file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        })

        // Clear progress after successful upload
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })

      } catch (error) {
        console.error('File upload error:', error)
        // Clear progress on error
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
        // You might want to show an error toast here
        alert(error.message)
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleFileInputChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleRemoveFile = (fileId) => {
    onFileRemove(fileId)
  }



  const closeDialog = () => {
    if (onDialogClose) {
      onDialogClose()
    } else {
      setInternalDialogOpen(false)
    }
  }



  return (
    <>

      {/* Dialog Overlay */}
      {dialogOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeDialog}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <FiUpload className="mr-2 text-gray-500 dark:text-gray-400" />
                Upload Files
              </h2>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-6">
              {/* Upload Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
                  ${isDragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg transform scale-[1.02]'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:shadow-md'
                  }
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isProcessing}
                />

                <div className="flex flex-col items-center space-y-5 py-4">
                  {isDragOver ? (
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-md">
                      <FiUpload className="text-4xl text-blue-500" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-4">
                      <FaFilePdf className="text-3xl text-red-500" />
                      <FiFileText className="text-3xl text-blue-500" />
                      <FiFileText className="text-3xl text-gray-500" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                      {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      PDF, TXT, MD files up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Uploaded Files ({uploadedFiles.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uploadedFiles.map((file) => (
                      <FilePreview
                        key={file.id}
                        file={file}
                        onRemove={handleRemoveFile}
                        progress={uploadProgress[file.name]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Files being uploaded */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Uploading...
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                      <div key={fileName} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <FiFile className="text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {fileName}
                          </p>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progress * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(progress * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// File Preview Component
function FilePreview({ file, onRemove, progress }) {
  const getFileIcon = (fileName) => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
    switch (extension) {
      case '.pdf':
        return <FaFilePdf className="text-red-500" size={22} />
      case '.txt':
        return <FiFileText className="text-gray-500" size={22} />
      case '.md':
        return <FiFileText className="text-blue-500" size={22} />
      default:
        return <FiFile className="text-gray-500" size={22} />
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeLabel = (fileName) => {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
    switch (extension) {
      case '.pdf':
        return 'PDF Document'
      case '.txt':
        return 'Text File'
      case '.md':
        return 'Markdown File'
      default:
        return 'Document'
    }
  }

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
      <div className="flex-shrink-0">
        {getFileIcon(file.name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {file.name}
          </p>
          <div className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full px-2 py-0.5">
            <FiCheck className="mr-1" size={14} />
            <span>{file.processingMode === 'offline' ? 'Ready (Offline)' : 'Processed'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{getFileTypeLabel(file.name)}</span>
          <span>•</span>
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
            {file.processingMode === 'offline'
              ? 'Using local file path'
              : 'Uploaded to server'}
          </span>
        </div>
      </div>

      <button
        onClick={() => onRemove(file.id)}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Remove file"
      >
        <FiX size={18} />
      </button>
    </div>
  )
}

export default FileUpload