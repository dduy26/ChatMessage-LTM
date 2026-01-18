#!/bin/sh
npx prisma generate
npx prisma db push # Ép cấu trúc schema vào DB ngay khi khởi động
node server.js