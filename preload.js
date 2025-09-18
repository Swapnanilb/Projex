const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  addProject: (projectData) => ipcRenderer.invoke('add-project', projectData),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  updateProject: (id, updates) => ipcRenderer.invoke('update-project', { id, updates }),
  deleteProject: (id) => ipcRenderer.invoke('delete-project', id),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  updateLastOpened: (id) => ipcRenderer.invoke('update-last-opened', id),
  getFormattedSize: (bytes) => ipcRenderer.invoke('get-formatted-size', bytes),
  onProjectSizeUpdated: (callback) => {
    ipcRenderer.on('project-size-updated', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('project-size-updated');
  },
  isDirectory: (path) => ipcRenderer.invoke('is-directory', path)
});