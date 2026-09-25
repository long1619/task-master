#!/bin/sh
set -e

# Thư mục "uploads" được bind-mount từ host (docker-compose.yml). Nếu thư mục này
# chưa tồn tại trên host, Docker sẽ tự tạo nó bằng quyền root khi mount, khiến user
# "node" (không phải root, chạy app bên dưới) không có quyền ghi -> lỗi EACCES khi
# import Excel / upload file đính kèm. Vì vậy container luôn khởi động bằng root
# để tự sửa quyền sở hữu trước, rồi mới hạ quyền xuống "node" để chạy app thật sự.
mkdir -p /app/uploads
chown -R node:node /app/uploads

exec su-exec node "$@"
