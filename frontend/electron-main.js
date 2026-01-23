const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'public', 'vite.svg'), // Có thể thay bằng icon riêng sau
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    titleBarStyle: 'default',
    show: false, // Ẩn cửa sổ cho đến khi sẵn sàng
    backgroundColor: '#ffffff'
  });

  // Load ứng dụng
  if (isDev) {
    // Development: Load từ Vite dev server
    // Đợi một chút để đảm bảo Vite server đã sẵn sàng
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:5173');
    }, 1000);
    mainWindow.webContents.openDevTools(); // Mở DevTools trong dev mode
  } else {
    // Production: Load từ file build
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Hiển thị cửa sổ khi đã sẵn sàng
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus vào cửa sổ
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Xử lý khi cửa sổ đóng
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Xử lý navigation (ngăn mở link bên ngoài trong app)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Tạo menu bar (tùy chọn)
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Hoàn tác' },
        { role: 'redo', label: 'Làm lại' },
        { type: 'separator' },
        { role: 'cut', label: 'Cắt' },
        { role: 'copy', label: 'Sao chép' },
        { role: 'paste', label: 'Dán' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Tải lại' },
        { role: 'forceReload', label: 'Tải lại mạnh' },
        { role: 'toggleDevTools', label: 'Công cụ phát triển' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Đặt lại thu phóng' },
        { role: 'zoomIn', label: 'Phóng to' },
        { role: 'zoomOut', label: 'Thu nhỏ' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toàn màn hình' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', label: 'Thu nhỏ' },
        { role: 'close', label: 'Đóng' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Khi Electron đã sẵn sàng
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    // Trên macOS, tạo lại cửa sổ khi click vào icon trong dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Thoát khi tất cả cửa sổ đóng (trừ macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Xử lý certificate errors (cho development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // Trong dev mode, bỏ qua lỗi certificate
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
