Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án
# Cách 1: Chạy thủ công (Dành cho Development)
1. Yêu cầu hệ thống

Node.js: phiên bản v18 trở lên
PostgreSQL: đã cài đặt và đang chạy

2. Cấu hình Backend

cd backend
npm install

Tạo file .env trong thư mục backend và cấu hình các biến môi trường cần thiết:

DATABASE_URL=postgresql://chatapp:password@localhost:5432/chatapp_db
JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret


Khởi tạo Prisma và cơ sở dữ liệu:

npx prisma generate
npx prisma db push

Chạy server backend:
# npm run dev

3. Cấu hình Frontend
Mở terminal mới:

cd frontend
npm install
npm run dev

Ứng dụng frontend sẽ chạy tại:
http://localhost:5173

# Cách 2: Chạy bằng Docker (Nên dùng)
Yêu cầu :
Cài docker và docker desktop

Luồng triển khai chuẩn
1. Khởi động các dịch vụ
docker-compose up -d --build
docker-compose up --build

2. Đẩy cấu trúc bảng vào Database trong Docker
docker-compose exec backend npx prisma db push

Ứng dụng frontend sẽ chạy tại:
http://localhost:5173
# Tới đây là xong nếu muốn xem log realtime thì dùng
# docker logs -f chat-app-backend




-> Chạy migrate (tạo bảng từ schema.prisma)
npx prisma migrate dev --name init

-> Generate client (nếu chưa)
npx prisma generate

Tạo user
CREATE USER chatapp WITH PASSWORD '1234';

Tạo database trống
CREATE DATABASE chatapp_db OWNER chatapp;

Cấp quyền database
GRANT ALL PRIVILEGES ON DATABASE chatapp_db TO chatapp;

Cấp quyền mặc định trong DB mới
GRANT ALL ON SCHEMA public TO chatapp;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO chatapp;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO chatapp;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON FUNCTIONS TO chatapp;



-> Thêm cấp quyền trong postgres 
ALTER ROLE chatapp CREATEDB;

npm install dotenv
npm install socket.io

# 1. Dừng và xóa sạch Container , db, Networks và đặc biệt là Volume (-v)
docker-compose down -v
# 2. Xóa các bản build cũ để Docker đóng gói lại từ đầu
docker-compose build --no-cache
# 3. Khởi động lại hệ thống
docker-compose up -d
# 4. Đẩy Schema Prisma vào Database mới (chatapp_db)
docker exec -it chat-app-backend npx prisma db push
# run docker
# Build lại image ,chạy container
docker-compose up --build
# Chạy container k build lại 
docker-compose up
# Build + chạy nền (nên dùng lệnh này )
docker-compose up -d --build
docker-compose exec backend npx prisma db push
# Xem log realtime
docker logs -f chat-app-backend
