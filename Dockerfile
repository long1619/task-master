# ============================================================
#  Dockerfile - TaskMaster Pro (Node.js + Express + Prisma)
#  Base: node:22-alpine (nhẹ, phù hợp VPS cấu hình thấp)
# ============================================================
FROM node:22-alpine

# Prisma Query Engine cần OpenSSL để chạy được trên nền Alpine (musl)
RUN apk add --no-cache openssl

WORKDIR /app

# 1. Cài dependencies trước - tận dụng cache layer của Docker
#    (chỉ chạy lại npm ci khi package.json/package-lock.json thay đổi)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 2. Copy toàn bộ mã nguồn còn lại vào image
COPY . .

# 3. Sinh Prisma Client đúng với nền tảng Alpine bên trong container
#    (postinstall đã tự chạy ở bước npm ci, chạy lại ở đây để chắc chắn
#     khớp với toàn bộ schema sau khi COPY . . )
RUN npx prisma generate

# 4. Tạo thư mục uploads (sẽ được mount volume đè lên khi chạy thật)
#    và chuyển quyền sở hữu source code cho user "node" (không chạy bằng root)
RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 5000

# Kiểm tra "sức khỏe" container qua endpoint health check có sẵn của API
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/v1/health || exit 1

# Áp dụng migration (nếu có) rồi mới khởi chạy server - an toàn khi deploy lại
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
