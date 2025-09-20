const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const initSqlJs = require('sql.js');
const fs = require('fs');

// Function to calculate folder size for specific file types
async function getFolderSizeByTypes(folderPath, fileTypes = []) {
  const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'target', 'bin', 'obj', '.vscode', '.idea']);
  
  async function calculateSize(dirPath, depth = 0) {
    if (depth > 8) return 0;
    
    let size = 0;
    
    try {
      const items = await fs.promises.readdir(dirPath);
      
      for (const item of items) {
        if (item.startsWith('.') && item !== '.git') continue;
        
        const itemPath = path.join(dirPath, item);
        
        try {
          const stats = await fs.promises.stat(itemPath);
          
          if (stats.isDirectory()) {
            if (!skipDirs.has(item)) {
              size += await calculateSize(itemPath, depth + 1);
            }
          } else if (stats.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (fileTypes.length === 0 || fileTypes.includes(ext)) {
              console.log(`Adding ${fileTypes.length ? 'filtered' : 'all'} file: ${itemPath} (${stats.size} bytes)`);
              size += stats.size;
            }
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      return 0;
    }
    
    return size;
  }
  
  try {
    await fs.promises.access(folderPath, fs.constants.R_OK);
    const stats = await fs.promises.stat(folderPath);
    
    if (!stats.isDirectory()) {
      return 0;
    }
    
    const totalSize = await calculateSize(folderPath);
    console.log(`Calculated ${fileTypes.length ? 'filtered' : 'total'} size for ${folderPath}: ${totalSize} bytes`);
    return totalSize;
  } catch (error) {
    console.error('Error calculating folder size for', folderPath, ':', error.message);
    return -1;
  }
}

// Function to calculate folder size asynchronously (ALL FILES)
async function getFolderSize(folderPath, includeAll = true) {
  const skipDirs = includeAll ? new Set() : new Set(['node_modules', '.git', 'dist', 'build', '.next', 'target', 'bin', 'obj']);
  
  async function calculateSize(dirPath, depth = 0) {
    if (depth > 15) return 0; // Increased depth limit
    
    let size = 0;
    
    try {
      const items = await fs.promises.readdir(dirPath);
      
      for (const item of items) {
        // Only skip .vscode and .idea hidden dirs
        if (item.startsWith('.') && ['.vscode', '.idea'].includes(item)) continue;
        
        const itemPath = path.join(dirPath, item);
        
        try {
          const stats = await fs.promises.stat(itemPath);
          
          if (stats.isDirectory()) {
            if (!skipDirs.has(item)) {
              size += await calculateSize(itemPath, depth + 1);
            } else {
              console.log(`Skipping directory: ${itemPath}`);
            }
          } else if (stats.isFile()) {
            size += stats.size;
          }
        } catch (error) {
          // Skip files/directories that can't be accessed
          continue;
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be accessed
      return 0;
    }
    
    return size;
  }
  
  try {
    // Verify path exists first
    await fs.promises.access(folderPath, fs.constants.R_OK);
    const stats = await fs.promises.stat(folderPath);
    
    if (!stats.isDirectory()) {
      return 0;
    }
    
    const totalSize = await calculateSize(folderPath);
    console.log(`Calculated size for ${folderPath}: ${totalSize} bytes`);
    return totalSize;
  } catch (error) {
    console.error('Error calculating folder size for', folderPath, ':', error.message);
    return -1;
  }
}

// Format bytes to human readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes === -1) return 'Error';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

let mainWindow;
let db;
let SQL;

// Initialize SQLite database
async function initDatabase() {
  try {
    const dbPath = path.join(__dirname, 'backend', 'projects.db');
    
    // Ensure backend directory exists
    const backendDir = path.join(__dirname, 'backend');
    if (!fs.existsSync(backendDir)) {
      fs.mkdirSync(backendDir, { recursive: true });
    }

    SQL = await initSqlJs();
    
    // Load existing database or create new one
    let data;
    try {
      data = fs.readFileSync(dbPath);
    } catch {
      data = null;
    }
    
    db = new SQL.Database(data);
    
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
    try {
      db.run(`ALTER TABLE projects ADD COLUMN folderSize INTEGER DEFAULT 0`);
    } catch {}
    try {
      db.run(`ALTER TABLE projects ADD COLUMN isArchived INTEGER DEFAULT 0`);
    } catch {}
    
    // Save database to file
    saveDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Create a simple in-memory database as fallback
    SQL = await initSqlJs();
    db = new SQL.Database();
    db.run(`
      CREATE TABLE projects (
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
  }
}

function saveDatabase() {
  try {
    const dbPath = path.join(__dirname, 'backend', 'projects.db');
    const data = db.export();
    fs.writeFileSync(dbPath, data);
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

function createWindow() {
  const isDev = !app.isPackaged;
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDev
    },
    show: false,
    icon: path.join(__dirname, 'assets/icons/app-icon.png')
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Remove menu bar in production only
  if (!isDev) {
    mainWindow.setMenuBarVisibility(false);
  }
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend/build/index.html'));
  }
}

app.whenReady().then(async () => {
  try {
    await initDatabase();
    createWindow();
  } catch (error) {
    console.error('App initialization failed:', error);
    createWindow(); // Try to create window anyway
  }
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
  try {
    const { name, path: projectPath, tags } = projectData;
    const tagsString = Array.isArray(tags) ? tags.join(',') : tags;
    
    // Verify path exists before adding
    try {
      await fs.promises.access(projectPath, fs.constants.R_OK);
      const stats = await fs.promises.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }
    } catch (error) {
      throw new Error(`Invalid project path: ${error.message}`);
    }
    
    // Add project immediately without size calculation
    db.run('INSERT INTO projects (name, path, tags, folderSize) VALUES (?, ?, ?, ?)', [name, projectPath, tagsString, 0]);
    const result = db.exec('SELECT last_insert_rowid() as id')[0];
    const projectId = result.values[0][0];
    
    saveDatabase();
    
    // Calculate size in background with timeout
    setTimeout(async () => {
      console.log(`Starting size calculation for project ${projectId}: ${projectPath}`);
      
      try {
        const folderSize = await Promise.race([
          getFolderSize(projectPath),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Calculation timeout after 60 seconds')), 60000)
          )
        ]);
        
        console.log(`Size calculation completed for project ${projectId}: ${folderSize} bytes`);
        
        db.run('UPDATE projects SET folderSize = ? WHERE id = ?', [folderSize, projectId]);
        saveDatabase();
        
        // Notify renderer about size update
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('project-size-updated', { id: projectId, folderSize });
        }
      } catch (error) {
        console.error(`Failed to calculate size for project ${projectId}:`, error.message);
        // Set size to -1 to indicate calculation failed
        db.run('UPDATE projects SET folderSize = ? WHERE id = ?', [-1, projectId]);
        saveDatabase();
        
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('project-size-updated', { id: projectId, folderSize: -1 });
        }
      }
    }, 500); // Small delay to ensure project is added first
    
    return { id: projectId, ...projectData, folderSize: 0 };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle('get-projects', async () => {
  try {
    if (!db) return [];
    const result = db.exec('SELECT * FROM projects ORDER BY dateAdded DESC');
    if (!result || !result[0]) return [];
    
    const projects = result[0].values.map(row => {
      const project = {};
      result[0].columns.forEach((col, index) => {
        project[col] = row[index];
      });
      project.tags = project.tags ? project.tags.split(',') : [];
      return project;
    });
    return projects;
  } catch (err) {
    console.error('Get projects error:', err);
    return [];
  }
});

ipcMain.handle('update-project', async (event, { id, updates }) => {
  try {
    const processedUpdates = { ...updates };
    
    if (processedUpdates.tags && Array.isArray(processedUpdates.tags)) {
      processedUpdates.tags = processedUpdates.tags.join(',');
    }
    
    const fields = Object.keys(processedUpdates);
    const values = Object.values(processedUpdates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    db.run(`UPDATE projects SET ${setClause} WHERE id = ?`, [...values, id]);
    saveDatabase();
    
    return { id, ...processedUpdates };
  } catch (err) {
    throw err;
  }
});

ipcMain.handle('delete-project', async (event, id) => {
  try {
    db.run('DELETE FROM projects WHERE id = ?', [id]);
    saveDatabase();
    return id;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  shell.openPath(folderPath);
});

ipcMain.handle('update-last-opened', async (event, id) => {
  try {
    db.run('UPDATE projects SET lastOpened = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle('get-formatted-size', async (event, bytes) => {
  return formatBytes(bytes);
});

ipcMain.handle('get-folder-size-by-types', async (event, folderPath, fileTypes) => {
  console.log(`Calculating size for specific file types in ${folderPath}:`, fileTypes);
  
  try {
    const size = await getFolderSizeByTypes(folderPath, fileTypes);
    return { size, formatted: formatBytes(size) };
  } catch (error) {
    console.error('Error calculating filtered size:', error);
    return { size: -1, formatted: 'Error' };
  }
});

ipcMain.handle('recalculate-all-sizes', async (event) => {
  try {
    const result = db.exec('SELECT id, path FROM projects');
    if (!result || !result[0]) return;
    
    const projects = result[0].values.map(row => ({
      id: row[0],
      path: row[1]
    }));
    
    for (const project of projects) {
      setImmediate(async () => {
        try {
          const folderSize = await Promise.race([
            getFolderSize(project.path),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 30000)
            )
          ]);
          
          db.run('UPDATE projects SET folderSize = ? WHERE id = ?', [folderSize, project.id]);
          saveDatabase();
          
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('project-size-updated', { id: project.id, folderSize });
          }
        } catch (error) {
          console.error(`Failed to recalculate size for project ${project.id}:`, error.message);
          db.run('UPDATE projects SET folderSize = ? WHERE id = ?', [-1, project.id]);
          saveDatabase();
          
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('project-size-updated', { id: project.id, folderSize: -1 });
          }
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to recalculate all sizes:', error);
    return false;
  }
});

ipcMain.handle('is-directory', async (event, folderPath) => {
  try {
    const stats = await fs.promises.stat(folderPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
});

ipcMain.handle('recalculate-project-size', async (event, projectId, projectPath) => {
  console.log(`Recalculating size for project ${projectId}: ${projectPath}`);
  
  try {
    const folderSize = await Promise.race([
      getFolderSize(projectPath),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Recalculation timeout after 60 seconds')), 60000)
      )
    ]);
    
    console.log(`Recalculation completed for project ${projectId}: ${folderSize} bytes`);
    
    db.run('UPDATE projects SET folderSize = ? WHERE id = ?', [folderSize, projectId]);
    saveDatabase();
    
    // Notify renderer about size update
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('project-size-updated', { id: projectId, folderSize });
    }
    
    return folderSize;
  } catch (error) {
    console.error(`Failed to recalculate size for project ${projectId}:`, error.message);
    db.run('UPDATE projects SET folderSize = ? WHERE id = ?', [-1, projectId]);
    saveDatabase();
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('project-size-updated', { id: projectId, folderSize: -1 });
    }
    
    return -1;
  }
});