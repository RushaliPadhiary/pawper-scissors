const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets/images/cat1_stone.png')
  });

  // Load your HTML file
  win.loadFile('index.html');
  
  // Method 1: Intercept window.open()
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('letterboxd.com')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
  
  // Method 2: Intercept ALL navigation
  win.webContents.on('will-navigate', (event, url) => {
    if (url.includes('letterboxd.com')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  
  // Method 3: Intercept new window creation (most comprehensive)
  win.webContents.on('new-window', (event, url) => {
    if (url.includes('letterboxd.com')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});