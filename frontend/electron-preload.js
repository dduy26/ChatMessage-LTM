// Preload script - Cầu nối giữa renderer process và main process
const { contextBridge } = require('electron');

// Expose protected methods cho renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Có thể thêm các API cần thiết ở đây nếu cần
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
