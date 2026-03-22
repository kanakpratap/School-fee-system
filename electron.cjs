const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
    title: "School Management System"
  });

  // Wait for the local server to start, then load the URL
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Set up the persistent data directory
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'database');

  // Start the Express server
  serverProcess = fork(path.join(__dirname, 'dist', 'server.js'), [], {
    cwd: __dirname,
    env: {
      ...process.env,
      DATA_DIR: dataDir,
      NODE_ENV: 'production'
    }
  });

  // Give the server a couple of seconds to start before opening the window
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  // Kill the server when the app is closed
  if (serverProcess) {
    serverProcess.kill();
  }
});
