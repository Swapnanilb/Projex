import { useState, useEffect } from 'react';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('dateAdded');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadProjects();
    
    // Listen for background size updates
    const cleanup = window.electronAPI.onProjectSizeUpdated(({ id, folderSize }) => {
      setProjects(prev => prev.map(project => 
        project.id === id ? { ...project, folderSize } : project
      ));
    });
    
    return cleanup;
  }, []);

  const loadProjects = async () => {
    try {
      const projectList = await window.electronAPI.getProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (folderPath) => {
    const folderName = folderPath.split('\\').pop() || folderPath.split('/').pop();
    const projectData = {
      name: folderName,
      path: folderPath,
      tags: []
    };

    try {
      await window.electronAPI.addProject(projectData);
      await loadProjects();
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const updateProject = async (id, updates) => {
    try {
      await window.electronAPI.updateProject(id, updates);
      await loadProjects();
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const deleteProject = async (id) => {
    try {
      await window.electronAPI.deleteProject(id);
      await loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const openProject = async (project) => {
    try {
      await window.electronAPI.updateLastOpened(project.id);
      await window.electronAPI.openFolder(project.path);
      await loadProjects();
    } catch (error) {
      console.error('Failed to open project:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => project.tags.includes(tag));
    const matchesArchive = showArchived ? project.isArchived : !project.isArchived;
    return matchesSearch && matchesTags && matchesArchive;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lastOpened':
        return new Date(b.lastOpened || 0) - new Date(a.lastOpened || 0);
      case 'dateAdded':
      default:
        return new Date(b.dateAdded) - new Date(a.dateAdded);
    }
  });

  const allTags = [...new Set(projects.flatMap(p => p.tags))].filter(Boolean);
  
  const tagUsageCount = allTags.reduce((acc, tag) => {
    acc[tag] = projects.filter(p => p.tags.includes(tag)).length;
    return acc;
  }, {});

  return {
    projects: sortedProjects,
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
    addProject,
    updateProject,
    deleteProject,
    openProject,
    loadProjects
  };
};