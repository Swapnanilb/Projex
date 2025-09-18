import React, { useState } from 'react';
import { StarIcon, FolderIcon, PencilIcon, TrashIcon, ClockIcon, CalendarIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const ProjectCard = ({ project, onUpdate, onDelete, onOpen, showBulkActions, isSelected, onSelect }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editTags, setEditTags] = useState(project.tags.join(', '));
  const [editPath, setEditPath] = useState(project.path);

  const handleSave = () => {
    const updatedTags = typeof editTags === 'string' 
      ? editTags.split(',').map(tag => tag.trim()).filter(Boolean)
      : editTags;
    
    onUpdate(project.id, {
      name: editName,
      path: editPath,
      tags: updatedTags
    });
    setIsEditing(false);
  };

  const handleSelectFolder = async () => {
    try {
      const result = await window.electronAPI.selectFolder();
      if (!result.canceled && result.filePaths.length > 0) {
        setEditPath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const toggleFavorite = () => {
    onUpdate(project.id, { isFavorite: project.isFavorite ? 0 : 1 });
  };

  const toggleArchive = () => {
    onUpdate(project.id, { isArchived: project.isArchived ? 0 : 1 });
  };



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 border animate-fade-in group relative cursor-pointer ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onClick={showBulkActions ? () => onSelect(project.id) : undefined}
      onDoubleClick={!showBulkActions ? () => onOpen(project) : undefined}
    >

      
      <div className="flex justify-between items-start mb-3">
        <h3 className={`text-lg font-bold flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight ${
          isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'
        }`}>
          {project.name}
        </h3>
        
        <div className={`flex gap-1 transition-opacity ml-2 ${
          showBulkActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <button
            onClick={toggleFavorite}
            className="p-1.5 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900 text-yellow-500 hover:text-yellow-600 transition-all"
            title={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {project.isFavorite ? <StarSolidIcon className="w-4 h-4" /> : <StarIcon className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-500 hover:text-blue-600 transition-all"
            title="Edit project"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleArchive}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-600 transition-all"
            title={project.isArchived ? 'Unarchive project' : 'Archive project'}
          >
            <ArchiveBoxIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(project.id)}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-500 hover:text-red-600 transition-all"
            title="Delete project"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-300 break-all font-mono">{project.path}</p>
      </div>



      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <PencilIcon className="w-5 h-5 text-blue-500" />
              Edit Project
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all"
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Directory
                </label>
                <div className="flex gap-2">
                  <input
                    value={editPath}
                    onChange={(e) => setEditPath(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-gray-700 dark:text-white px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-all"
                    placeholder="Enter project path"
                  />
                  <button
                    onClick={handleSelectFolder}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl transition-colors"
                  >
                    Browse
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
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
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      


      {!isEditing && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1 mb-2">
            {project.tags.length > 0 ? (
              project.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-xs italic">No tags</span>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg space-y-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Added: {formatDate(project.dateAdded)}</span>
          </div>
          {project.lastOpened && (
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              <span>Opened: {formatDate(project.lastOpened)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-500">📁</span>
          <span>
            Size: {project.folderSize > 0 ? formatBytes(project.folderSize) : (
              <span className="text-gray-400 italic">Calculating...</span>
            )}
          </span>
        </div>
      </div>

      <button
        onClick={() => onOpen(project)}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        <FolderIcon className="w-5 h-5" />
        Open Project Folder
      </button>
    </div>
  );
};

export default ProjectCard;