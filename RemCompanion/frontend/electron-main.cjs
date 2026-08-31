const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'dist/index.html')}`;
  win.loadURL(startUrl);

  // Allow the React app to send ipc messages to move the window
  ipcMain.on('window-move', (e, { x, y }) => {
    const [currentX, currentY] = win.getPosition();
    win.setPosition(currentX + x, currentY + y);
  });

  // Reliable background cursor polling from the Main process
  const { screen } = require('electron');
  setInterval(() => {
    if (!win.isDestroyed()) {
      const point = screen.getCursorScreenPoint();
      const bounds = win.getBounds();
      win.webContents.send('global-cursor-update', {
        localX: point.x - bounds.x,
        localY: point.y - bounds.y
      });
    }
  }, 16);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
