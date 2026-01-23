# Talkie Desktop App

Ứng dụng desktop được xây dựng bằng Electron.

## ⚠️ QUAN TRỌNG: Phải chạy lệnh từ thư mục `frontend`

Tất cả các lệnh npm phải được chạy từ thư mục `frontend`, không phải từ thư mục root `App`.

## Cài đặt Dependencies

```bash
cd frontend
npm install
```

## Chạy ứng dụng trong Development Mode

**Cách 1: Từ thư mục frontend (Khuyến nghị)**
```bash
cd frontend
npm run electron:dev
```

**Cách 2: Từ thư mục root (Windows)**
```bash
# Chạy file .bat từ thư mục App
run-electron.bat
```

**Cách 3: Từ thư mục root (macOS/Linux)**
```bash
# Chạy file .sh từ thư mục App
chmod +x run-electron.sh
./run-electron.sh
```

Lệnh này sẽ:
1. Khởi động Vite dev server (http://localhost:5173)
2. Chờ server sẵn sàng
3. Mở Electron window với ứng dụng

## Build ứng dụng Desktop

### Build cho Windows:
```bash
npm run electron:build:win
```

### Build cho macOS:
```bash
npm run electron:build:mac
```

### Build cho Linux:
```bash
npm run electron:build:linux
```

### Build cho tất cả platforms:
```bash
npm run electron:build
```

File executable sẽ được tạo trong thư mục `release/`.

## Cấu trúc Files

- `electron-main.js` - Main process của Electron (quản lý windows, app lifecycle)
- `electron-preload.js` - Preload script (bridge giữa main và renderer)
- `package.json` - Cấu hình Electron Builder

## Lưu ý

- Trong development mode, app sẽ kết nối đến `http://localhost:5173`
- Trong production, app sẽ load từ file `dist/index.html`
- Đảm bảo backend server đang chạy khi test app
- Có thể cần cập nhật URL API trong `src/services/api.js` nếu backend chạy trên server khác
