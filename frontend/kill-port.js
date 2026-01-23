// Script để kill process trên port 5173 (Windows)
const { exec } = require('child_process');
const os = require('os');

const port = 5173;
const platform = os.platform();

function killPort(port) {
  return new Promise((resolve, reject) => {
    if (platform === 'win32') {
      // Windows: Tìm PID của process đang dùng port
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          console.log(`Port ${port} không có process nào đang sử dụng.`);
          resolve();
          return;
        }

        // Lấy PID từ output
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 0) {
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
              pids.add(pid);
            }
          }
        });

        if (pids.size === 0) {
          console.log(`Port ${port} không có process nào đang sử dụng.`);
          resolve();
          return;
        }

        // Kill từng process
        let killed = 0;
        pids.forEach(pid => {
          exec(`taskkill /PID ${pid} /F`, (killError) => {
            if (!killError) {
              console.log(`Đã kill process PID: ${pid}`);
              killed++;
            }
            if (killed === pids.size) {
              resolve();
            }
          });
        });
      });
    } else if (platform === 'darwin' || platform === 'linux') {
      // macOS/Linux: Dùng lsof
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (error || !stdout) {
          console.log(`Port ${port} không có process nào đang sử dụng.`);
          resolve();
          return;
        }

        const pids = stdout.trim().split('\n').filter(Boolean);
        if (pids.length === 0) {
          resolve();
          return;
        }

        pids.forEach(pid => {
          exec(`kill -9 ${pid}`, (killError) => {
            if (!killError) {
              console.log(`Đã kill process PID: ${pid}`);
            }
          });
        });
        resolve();
      });
    } else {
      console.log(`Platform ${platform} không được hỗ trợ.`);
      resolve();
    }
  });
}

killPort(port)
  .then(() => {
    console.log(`Đã xử lý xong port ${port}.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Lỗi:', err);
    process.exit(1);
  });
