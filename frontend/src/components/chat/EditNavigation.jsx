import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function EditNavigation({ 
  currentEditIndex, 
  totalEdits, 
  onPreviousEdit, 
  onNextEdit 
}) {
  return (
    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
      <div className="flex items-center">
        <span>Edit {currentEditIndex + 1} of {totalEdits}</span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onPreviousEdit}
          disabled={currentEditIndex === 0}
          className={`p-1 rounded ${
            currentEditIndex === 0 
              ? 'text-gray-400 dark:text-gray-600' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label="Previous edit"
        >
          <FiChevronLeft size={16} />
        </button>
        <button 
          onClick={onNextEdit}
          disabled={currentEditIndex === totalEdits - 1}
          className={`p-1 rounded ${
            currentEditIndex === totalEdits - 1 
              ? 'text-gray-400 dark:text-gray-600' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label="Next edit"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default EditNavigation;