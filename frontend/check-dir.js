// Script kiểm tra xem có đang ở đúng thư mục không
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const electronMainPath = path.join(__dirname, 'electron-main.js');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ LỖI: Không tìm thấy package.json!');
  console.error('📁 Bạn đang ở thư mục:', __dirname);
  console.error('💡 Hãy chạy lệnh từ thư mục frontend:');
  console.error('   cd frontend');
  console.error('   npm run electron:dev');
  process.exit(1);
}

if (!fs.existsSync(electronMainPath)) {
  console.error('❌ LỖI: Không tìm thấy electron-main.js!');
  console.error('💡 Hãy chạy lệnh từ thư mục frontend:');
  console.error('   cd frontend');
  console.error('   npm run electron:dev');
  process.exit(1);
}

// Tất cả OK
process.exit(0);
