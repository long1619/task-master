# Hướng dẫn Deploy TaskMaster Pro lên VPS bằng Docker

## 1. Yêu cầu trên VPS

- VPS chạy Ubuntu 22.04 (khuyến nghị) hoặc tương đương, tối thiểu 1 vCPU / 1GB RAM.
- Đã cài **Docker Engine** + **Docker Compose plugin**:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # để chạy docker không cần sudo (cần đăng nhập lại)
docker compose version          # kiểm tra đã có compose v2
```

## 2. Đưa mã nguồn lên VPS

Chọn 1 trong 2 cách:

```bash
# Cách A: qua Git (khuyến nghị nếu đã đẩy code lên GitHub/GitLab)
git clone <url-repo-cua-ban>.git taskmaster-pro
cd taskmaster-pro

# Cách B: copy trực tiếp từ máy local bằng scp
scp -r ./ user@your-vps-ip:/home/user/taskmaster-pro
```

> Không cần copy `node_modules/` hay `.env` thật — `.dockerignore` đã loại chúng ra khỏi build, và `.env` phải tạo riêng ở bước 3 (không commit lên Git).

## 3. Tạo file `.env` thật trên VPS

```bash
cp .env.example .env
nano .env
```

Điền các giá trị **thật** vào các biến sau (bắt buộc phải đổi, không dùng giá trị mẫu):

| Biến | Ghi chú |
|---|---|
| `DB_ROOT_PASSWORD` | Mật khẩu root MySQL — tạo ngẫu nhiên mạnh, VD: `openssl rand -base64 24` |
| `DB_USER` / `DB_PASSWORD` | Tài khoản DB riêng cho app (không đặt `DB_USER=root`) |
| `JWT_SECRET` | Chuỗi bí mật ký JWT — tạo bằng `openssl rand -base64 48` |
| `SMTP_USER` / `SMTP_PASS` | Thông tin email gửi thông báo (có thể để trống nếu chưa cần) |
| `GEMINI_API_KEY` | API Key Google Gemini (nếu dùng tính năng AI) |

## 4. Build & khởi chạy

```bash
docker compose build
docker compose up -d
```

Lệnh này sẽ:
- Build image ứng dụng từ `Dockerfile` (cài dependencies, sinh Prisma Client cho Alpine).
- Khởi chạy container MySQL 8.4, chờ đến khi khỏe (`healthcheck`) mới khởi chạy container app.
- Container app tự chạy `prisma migrate deploy` để đồng bộ schema, rồi mới `node server.js`.

Kiểm tra trạng thái & log:

```bash
docker compose ps
docker compose logs -f app
```

Khi thấy dòng `🚀 TaskMaster Pro Server đang khởi chạy thành công` là đã chạy xong.

## 5. Mở cổng & truy cập

Mở firewall cổng ứng dụng (mặc định `5000`, có thể đổi qua biến `PORT` trong `.env`):

```bash
sudo ufw allow 5000/tcp
```

Truy cập: `http://<địa-chỉ-ip-vps>:5000`

## 6. (Khuyến nghị cho production) Gắn tên miền + HTTPS qua Nginx reverse proxy

Không nên expose thẳng cổng 5000 ra Internet lâu dài. Cài Nginx trên VPS (ngoài Docker) làm reverse proxy + Certbot cấp SSL miễn phí:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Tạo file `/etc/nginx/sites-available/taskmaster`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/taskmaster /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com   # tự động cấu hình HTTPS
```

Sau đó chỉ mở cổng 80/443 ra ngoài, đóng cổng 5000 với firewall (`sudo ufw deny 5000/tcp` sau khi Nginx đã chạy ổn).

## 7. Các lệnh vận hành thường dùng

```bash
docker compose logs -f app        # xem log ứng dụng real-time
docker compose restart app        # khởi động lại app (không mất dữ liệu DB)
docker compose down               # dừng toàn bộ (dữ liệu DB vẫn giữ trong volume mysql_data)
docker compose up -d --build      # deploy phiên bản code mới (sau khi git pull)
docker compose exec db mysql -u root -p   # vào MySQL CLI để kiểm tra dữ liệu
```

## 8. Backup dữ liệu

```bash
# Backup toàn bộ database
docker compose exec db sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" taskmaster_db' > backup_$(date +%F).sql

# Backup file đính kèm người dùng tải lên
tar -czf uploads_backup_$(date +%F).tar.gz uploads/
```
