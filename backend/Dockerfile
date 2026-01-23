FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Sau khi cài openssl, lệnh này mới tạo ra Client chạy được trên Alpine
RUN npx prisma generate
# Đảm bảo start.sh có quyền thực thi
RUN chmod +x start.sh
EXPOSE 5000
# Sử dụng start.sh để đảm bảo db push chạy trước khi start server
CMD ["sh", "start.sh"]