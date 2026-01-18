npx prisma migrate dev
npx prisma generate
npm run dev

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

# 1. Dừng và xóa sạch Container, Networks và đặc biệt là Volume (-v)
docker-compose down -v
# 2. Xóa các bản build cũ để Docker đóng gói lại từ đầu
docker-compose build --no-cache
# 3. Khởi động lại hệ thống
docker-compose up -d
# 4. Đẩy Schema Prisma vào Database mới (chatapp_db)
docker exec -it chat-app-backend npx prisma db push
docker-compose up --build
docker-compose up
docker-compose up -d --build
docker-compose exec backend npx prisma db push