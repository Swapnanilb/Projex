import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, SunIcon, MoonIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';
import { useProjects } from './hooks/useProjects';
import { useTheme } from './hooks/useTheme';
import ProjectCard from './components/ProjectCard';
import ProjectListItem from './components/ProjectListItem';
import Sidebar from './components/Sidebar';
import AddProjectModal from './components/AddProjectModal';

function App() {
  const {
    projects,
    loading,
    searchTerm,
    setSearchTerm,
    selectedTags,
    setSelectedTags,
    sortBy,
    setSortBy,
    showArchived,
    setShowArchived,
    allTags,
    tagUsageCount,
    updateProject,
    deleteProject,
    openProject,
    loadProjects
  } = useProjects();
  
  const { isDark, toggleTheme } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedProject, setDraggedProject] = useState(null);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleAddProject = async (projectData) => {
    try {
      await window.electronAPI.addProject(projectData);
      await loadProjects();
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProjects(displayProjects.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedProjects([]);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedProjects) {
      await deleteProject(id);
    }
    setSelectedProjects([]);
    setShowBulkActions(false);
  };

  const handleBulkFavorite = async () => {
    for (const id of selectedProjects) {
      await updateProject(id, { isFavorite: 1 });
    }
    setSelectedProjects([]);
    setShowBulkActions(false);
  };

  const handleBulkUnfavorite = async () => {
    for (const id of selectedProjects) {
      await updateProject(id, { isFavorite: 0 });
    }
    setSelectedProjects([]);
    setShowBulkActions(false);
  };

  const handleRecalculateAllSizes = async () => {
    try {
      await window.electronAPI.recalculateAllSizes();
    } catch (error) {
      console.error('Failed to recalculate all sizes:', error);
    }
  };

  const handleTagToggle = (tag) => {
    if (tag === null) {
      setSelectedTags([]);
    } else {
      setSelectedTags(prev => 
        prev.includes(tag) 
          ? prev.filter(t => t !== tag)
          : [...prev, tag]
      );
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const firstFile = files[0];
    
    if (firstFile && firstFile.path && await window.electronAPI.isDirectory(firstFile.path)) {
      setDraggedProject({
        name: firstFile.name,
        path: firstFile.path,
        tags: []
      });
      setShowAddModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700 dark:text-gray-300">Loading projects...</div>
        </div>
      </div>
    );
  }

  const favoriteProjects = projects.filter(p => p.isFavorite);
  
  const displayProjects = showFavoritesOnly ? favoriteProjects : projects;

  return (
    <div 
      className={`flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors relative ${
        isDragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-dashed border-blue-500 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <PlusIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Drop Folder Here</h3>
            <p className="text-gray-600 dark:text-gray-400">Release to add as a new project</p>
          </div>
        </div>
      )}
      <Sidebar
        allTags={allTags}
        tagUsageCount={tagUsageCount}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived(!showArchived)}
        projects={projects}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                  <img src="./assets/app_logo.png" alt="Projex Logo" className="w-full h-full object-contain p-1" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Projex</h1>
                <p className="text-gray-600 dark:text-gray-400">A modern desktop project manager for developers, creators, and teams</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <SunIcon className="w-5 h-5 text-yellow-500" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowBulkActions(!showBulkActions);
                  if (showBulkActions) {
                    setSelectedProjects([]);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  showBulkActions 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                Select
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <PlusIcon className="w-5 h-5" />
                Add Project
              </button>
            </div>
          </div>
          
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search projects by name, path, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg transition-colors"
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                Total: {projects.length}
              </span>
              {favoriteProjects.length > 0 && (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  Favorites: {favoriteProjects.length}
                </span>
              )}
              {selectedTags.length > 0 && (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  Filtered: {projects.length}
                </span>
              )}
              {selectedProjects.length > 0 && (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Selected: {selectedProjects.length}
                </span>
              )}
            </div>
            
            {selectedProjects.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Deselect All
                </button>
                <button
                  onClick={handleBulkFavorite}
                  className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                >
                  ⭐ Favorite
                </button>
                <button
                  onClick={handleBulkUnfavorite}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Remove ⭐
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {displayProjects.length === 0 ? (
            <div className="text-center py-20">
              <div className="mb-8">
                <div className="w-32 h-32 rounded-3xl mx-auto mb-6 overflow-hidden shadow-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 p-2 transform hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
                    <img src="./assets/app_logo.png" alt="Projex Logo" className="w-full h-full object-contain p-2" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {searchTerm || selectedTags.length > 0 ? 'No projects match your search' : 'No projects yet'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                  {searchTerm || selectedTags.length > 0 
                    ? 'Try adjusting your search terms or filters'
                    : 'Start by adding your first project to get organized'
                  }
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Add Your First Project
              </button>
            </div>
          ) : (
            <div>
              {showFavoritesOnly ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      ⭐ Favorite Projects
                      <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-sm font-medium">
                        {favoriteProjects.length}
                      </span>
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRecalculateAllSizes}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        title="Recalculate all folder sizes"
                      >
                        🔄
                      </button>
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg transition-colors ${
                            viewMode === 'grid'
                              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title="Grid view"
                        >
                          <Squares2X2Icon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg transition-colors ${
                            viewMode === 'list'
                              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title="List view"
                        >
                          <ListBulletIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="animate-fade-in">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favoriteProjects.map(project => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onUpdate={updateProject}
                            onDelete={deleteProject}
                            onOpen={openProject}
                            showBulkActions={showBulkActions}
                            isSelected={selectedProjects.includes(project.id)}
                            onSelect={handleSelectProject}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {favoriteProjects.map(project => (
                          <ProjectListItem
                            key={project.id}
                            project={project}
                            onUpdate={updateProject}
                            onDelete={deleteProject}
                            onOpen={openProject}
                            showBulkActions={showBulkActions}
                            isSelected={selectedProjects.includes(project.id)}
                            onSelect={handleSelectProject}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      📁 All Projects
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm font-medium">
                        {projects.length}
                      </span>
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRecalculateAllSizes}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        title="Recalculate all folder sizes"
                      >
                        🔄
                      </button>
                      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg transition-colors ${
                            viewMode === 'grid'
                              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title="Grid view"
                        >
                          <Squares2X2Icon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg transition-colors ${
                            viewMode === 'list'
                              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title="List view"
                        >
                          <ListBulletIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="animate-fade-in">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {projects.map(project => (
                          <ProjectCard
                            key={project.id}
                            project={project}
                            onUpdate={updateProject}
                            onDelete={deleteProject}
                            onOpen={openProject}
                            showBulkActions={showBulkActions}
                            isSelected={selectedProjects.includes(project.id)}
                            onSelect={handleSelectProject}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {projects.map(project => (
                          <ProjectListItem
                            key={project.id}
                            project={project}
                            onUpdate={updateProject}
                            onDelete={deleteProject}
                            onOpen={openProject}
                            showBulkActions={showBulkActions}
                            isSelected={selectedProjects.includes(project.id)}
                            onSelect={handleSelectProject}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setDraggedProject(null);
        }}
        onAdd={handleAddProject}
        initialData={draggedProject}
      />
    </div>
  );
}

export default App;