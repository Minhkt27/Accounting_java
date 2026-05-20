# Accounting OS — Hướng Dẫn Khởi Chạy

## Bước 0 — Cài Docker Desktop (nếu chưa có)

1. Tải Docker Desktop tại: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Cài đặt và **khởi động Docker Desktop**, chờ cho đến khi icon Docker dưới thanh taskbar chuyển sang màu xanh (running).
3. Kiểm tra Docker đã chạy chưa bằng cách mở terminal (CMD hoặc PowerShell) và chạy:
   ```bash
   docker --version
   ```
   Nếu hiện ra phiên bản là ổn.

> [!IMPORTANT]
> Đảm bảo các port sau chưa bị ứng dụng khác chiếm: **1433**, **8888**, **3000**.

---

## Bước 1 — Mở terminal tại thư mục dự án

Mở **CMD** hoặc **PowerShell**, điều hướng vào thư mục chứa source code:

```bash
cd đường-dẫn-tới-thư-mục-dự-án
```

Ví dụ: `cd D:\Accounting_java`

---

## Bước 2 — Khởi động SQL Server

```bash
docker compose up -d sqlserver-db
```

> Chờ khoảng **15–20 giây** để SQL Server khởi động hoàn tất trước khi sang bước tiếp theo.

---

## Bước 3 — Tạo database (chỉ làm 1 lần duy nhất)

```bash
docker exec accounting_db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "AccountingApp@123" -C -Q "CREATE DATABASE accounting_db"
```

> [!IMPORTANT]
> Nếu lệnh trên báo lỗi `cannot connect` hoặc tương tự, nghĩa là SQL Server chưa khởi động xong — hãy đợi thêm 10–15 giây rồi chạy lại.

---

## Bước 4 — Khởi động toàn bộ hệ thống

```bash
docker compose up --build
```

> Lần đầu tiên sẽ tự động tải dependencies (Maven + npm), có thể mất **3–5 phút**. Những lần sau sẽ nhanh hơn.
>
> Khi thấy log không còn cuộn nữa và không có lỗi đỏ → hệ thống đã sẵn sàng.

---

## Bước 5 — Truy cập ứng dụng

Mở trình duyệt và vào địa chỉ:

- **Giao diện chính**: [http://localhost:3000](http://localhost:3000)

---

## Tài Khoản Đăng Nhập Mặc Định

| Vai trò | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| HR | `nhansu` | `123456` |
| Kế toán Tiền lương | `ketoan_luong` | `123456` |
| Kế toán Vốn bằng tiền | `ketoan_tien` | `123456` |
| Kế toán Trưởng | `ketoan_truong` | `123456` |

---

## Xử Lý Lỗi Thường Gặp

**Lỗi "container name already in use"**

```bash
docker rm -f accounting_db
```
Sau đó chạy lại từ **Bước 2**.

**Lỗi database sau khi cập nhật code mới** (missing columns/tables)

Reset sạch database và chạy lại từ đầu:

```bash
docker compose down -v
```

Sau đó lặp lại từ **Bước 2**.

> [!WARNING]
> Lệnh `docker compose down -v` sẽ **xóa toàn bộ dữ liệu** trong database. Sao lưu trước nếu cần.
