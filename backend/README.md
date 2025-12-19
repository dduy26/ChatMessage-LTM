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

