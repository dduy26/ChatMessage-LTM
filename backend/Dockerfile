FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Sau khi cài openssl, lệnh này mới tạo ra Client chạy được trên Alpine
RUN npx prisma generate
EXPOSE 5000
# Copy và set quyền cho start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh
CMD ["/app/start.sh"]