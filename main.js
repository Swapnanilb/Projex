const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Database = require('sqlite3').Database;
const fs = require('fs');

// Function to calculate folder size
function getFolderSize(folderPath) {
  let totalSize = 0;
  
  function calculateSize(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // Skip node_modules and other large directories for performance
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
            calculateSize(itemPath);
          }
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  calculateSize(folderPath);
  return totalSize;
}

// Format bytes to human readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

let mainWindow;
let db;

// Initialize SQLite database
function initDatabase() {
  const dbPath = path.join(__dirname, 'backend', 'projects.db');
  
  // Ensure backend directory exists
  const backendDir = path.join(__dirname, 'backend');
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }

  db = new Database(dbPath);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT UNIQUE NOT NULL,
      tags TEXT DEFAULT '',
      dateAdded DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastOpened DATETIME,
      isFavorite INTEGER DEFAULT 0,
      folderSize INTEGER DEFAULT 0,
      isArchived INTEGER DEFAULT 0
    )
  `);
  
  // Add columns if they don't exist (for existing databases)
  db.run(`ALTER TABLE projects ADD COLUMN folderSize INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE projects ADD COLUMN isArchived INTEGER DEFAULT 0`, () => {});
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend/build/index.html'));
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result;
});

ipcMain.handle('add-project', async (event, projectData) => {
  return new Promise((resolve, reject) => {
    const { name, path: projectPath, tags } = projectData;
    const tagsString = Array.isArray(tags) ? tags.join(',') : tags;
    
    // Add project immediately without size calculation
    db.run(
      'INSERT INTO projects (name, path, tags, folderSize) VALUES (?, ?, ?, ?)',
      [name, projectPath, tagsString, 0],
      function(err) {
        if (err) {
          reject(err);
        } else {
          const projectId = this.lastID;
          resolve({ id: projectId, ...projectData, folderSize: 0 });
          
          // Calculate size in background
          setTimeout(() => {
            const folderSize = getFolderSize(projectPath);
            db.run(
              'UPDATE projects SET folderSize = ? WHERE id = ?',
              [folderSize, projectId],
              (updateErr) => {
                if (!updateErr) {
                  // Notify renderer about size update
                  event.sender.send('project-size-updated', { id: projectId, folderSize });
                }
              }
            );
          }, 100);
        }
      }
    );
  });
});

ipcMain.handle('get-projects', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM projects ORDER BY dateAdded DESC', (err, rows) => {
      if (err) reject(err);
      else {
        const projects = rows.map(row => ({
          ...row,
          tags: row.tags ? row.tags.split(',') : []
        }));
        resolve(projects);
      }
    });
  });
});

ipcMain.handle('update-project', async (event, { id, updates }) => {
  return new Promise((resolve, reject) => {
    const processedUpdates = { ...updates };
    
    if (processedUpdates.tags && Array.isArray(processedUpdates.tags)) {
      processedUpdates.tags = processedUpdates.tags.join(',');
    }
    
    const fields = Object.keys(processedUpdates);
    const values = Object.values(processedUpdates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    db.run(
      `UPDATE projects SET ${setClause} WHERE id = ?`,
      [...values, id],
      function(err) {
        if (err) reject(err);
        else resolve({ id, ...processedUpdates });
      }
    );
  });
});

ipcMain.handle('delete-project', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve(id);
    });
  });
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  shell.openPath(folderPath);
});

ipcMain.handle('update-last-opened', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE projects SET lastOpened = CURRENT_TIMESTAMP WHERE id = ?',
      [id],
      function(err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
});

ipcMain.handle('get-formatted-size', async (event, bytes) => {
  return formatBytes(bytes);
});

ipcMain.handle('is-directory', async (event, folderPath) => {
  try {
    return fs.statSync(folderPath).isDirectory();
  } catch {
    return false;
  }
});