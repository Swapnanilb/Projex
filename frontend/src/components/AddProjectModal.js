import React, { useState } from 'react';
import { PlusIcon, FolderIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline';

const AddProjectModal = ({ isOpen, onClose, onAdd, initialData }) => {
  const [projectName, setProjectName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [tags, setTags] = useState('');

  React.useEffect(() => {
    if (initialData) {
      setProjectName(initialData.name || '');
      setProjectPath(initialData.path || '');
      setTags(initialData.tags ? initialData.tags.join(', ') : '');
    }
  }, [initialData]);

  const handleSelectFolder = async () => {
    try {
      const result = await window.electronAPI.selectFolder();
      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        const folderName = folderPath.split('\\').pop() || folderPath.split('/').pop();
        setProjectPath(folderPath);
        setProjectName(folderName);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleSubmit = () => {
    if (projectName && projectPath) {
      onAdd({
        name: projectName,
        path: projectPath,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      handleClose();
    }
  };

  const handleClose = () => {
    if (!initialData) {
      setProjectName('');
      setProjectPath('');
      setTags('');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <PlusIcon className="w-5 h-5 text-blue-500" />
            Add New Project
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Project Folder
            </label>
            <button
              onClick={handleSelectFolder}
              className="w-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-xl p-4 text-left transition-colors flex items-center gap-3"
            >
              <FolderIcon className="w-5 h-5 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-300">
                {projectPath || 'Click to select folder...'}
              </span>
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name
            </label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all"
              placeholder="Enter project name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Tags (Optional)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, personal, react, nodejs (comma separated)"
              className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate multiple tags with commas
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSubmit}
            disabled={!projectName || !projectPath}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            Add Project
          </button>
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal;