import React from 'react';
import { TagIcon, FunnelIcon, Bars3BottomLeftIcon, StarIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ allTags, tagUsageCount, selectedTags, onTagToggle, sortBy, onSortChange, showFavoritesOnly, onToggleFavorites, showArchived, onToggleArchived, projects }) => {
  return (
    <div className="w-72 bg-gray-50 dark:bg-gray-900 p-6 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-gray-800 dark:text-white">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <FunnelIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          Filters
        </h3>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-4 space-y-2">
          <button
            onClick={onToggleFavorites}
            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 group ${
              showFavoritesOnly
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg transform scale-105'
                : 'hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-yellow-900/20 dark:hover:to-orange-900/20 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              showFavoritesOnly 
                ? 'bg-white/20' 
                : 'bg-yellow-100 dark:bg-yellow-900 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800'
            }`}>
              <StarIcon className={`w-5 h-5 ${
                showFavoritesOnly 
                  ? 'text-white' 
                  : 'text-yellow-600 dark:text-yellow-400'
              }`} />
            </div>
            <div className="text-left">
              <div className="font-semibold">Favorites</div>
              <div className={`text-xs ${
                showFavoritesOnly 
                  ? 'text-white/80' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {showFavoritesOnly ? 'Showing starred projects' : 'Show starred projects only'}
              </div>
            </div>
          </button>
          
          <button
            onClick={onToggleArchived}
            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 group ${
              showArchived
                ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg transform scale-105'
                : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800/20 dark:hover:to-gray-700/20 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            <div className={`p-2 rounded-lg transition-colors ${
              showArchived 
                ? 'bg-white/20' 
                : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
            }`}>
              <ArchiveBoxIcon className={`w-5 h-5 ${
                showArchived 
                  ? 'text-white' 
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div className="text-left">
              <div className="font-semibold">Archive</div>
              <div className={`text-xs ${
                showArchived 
                  ? 'text-white/80' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {showArchived ? 'Showing archived projects' : 'Show archived projects'}
              </div>
            </div>
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <TagIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Tags</span>
            {selectedTags.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                {selectedTags.length}
              </span>
            )}
          </div>
          
          <div className="space-y-3 max-h-48 overflow-y-auto scrollbar-thin" style={{scrollbarWidth: 'thin'}}>
            {allTags.length > 0 ? (
              allTags.map(tag => (
                <label key={tag} className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => onTagToggle(tag)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex-1">
                    {tag}
                  </span>
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full font-medium">
                    {tagUsageCount[tag]}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No tags available</p>
            )}
          </div>
          
          {selectedTags.length > 0 && (
            <button
              onClick={() => onTagToggle(null)}
              className="w-full mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-gray-800 dark:text-white">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Bars3BottomLeftIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          Sort
        </h3>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="dateAdded">📅 Date Added (Newest)</option>
            <option value="name">🔤 Name (A-Z)</option>
            <option value="lastOpened">⏰ Last Opened</option>
          </select>
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
          <span className="text-blue-500">📊</span>
          Statistics
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Total Projects:</span>
            <span className="font-medium text-gray-800 dark:text-white">{projects.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Total Size:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {(() => {
                const totalBytes = projects.reduce((sum, p) => sum + (p.folderSize || 0), 0);
                if (totalBytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(totalBytes) / Math.log(k));
                return parseFloat((totalBytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
              })()}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;