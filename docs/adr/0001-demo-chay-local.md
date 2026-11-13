# ADR-0001: Bản demo chạy local trước

**Ngày:** 2026-11-13
**Trạng thái:** accepted
**Người quyết định:** chủ dự án

## Bối cảnh

Z.MKT đang ở giai đoạn demo. Mục tiêu trước mắt là cho người xem thấy luồng lập chiến lược, duyệt tiền và chạy thử, chưa phải phục vụ người dùng thật. Thiết kế cơ sở dữ liệu v3 (`docs/database.md`) đã viết xong và đang chờ duyệt.

## Quyết định

Ưu tiên chạy trên máy cá nhân. Cụ thể:

- Cơ sở dữ liệu là Postgres nhúng PGlite ở `.data/pg`, không dựng Supabase hay Postgres riêng.
- Đăng nhập dùng bản tự viết đang chạy (`lib/server/auth.ts`).
- Kênh quảng cáo dùng bộ giả lập sau giao diện `AdsChannel`.
- Chat có thể dùng gói Claude qua Claude Code (`ZMKT_AI=claude-code`) khi thử.

## Phương án đã cân nhắc

### Dựng Supabase ngay
- **Được:** có sẵn đăng nhập, phân quyền theo dòng, sao lưu.
- **Mất:** thêm việc cấu hình và phụ thuộc mạng cho một bản chỉ để demo.
- **Lý do chưa chọn:** chưa có người dùng thật. Mã đã chạy được trên Postgres qua `DATABASE_URL` nên chuyển sau không phải viết lại.

### Nối Meta Ads thật ngay
- **Được:** số liệu thật.
- **Mất:** cần tài khoản quảng cáo, xét duyệt ứng dụng, và tiêu tiền thật khi demo.
- **Lý do chưa chọn:** rủi ro tiền thật không đáng cho một buổi demo.

## Hệ quả

### Tích cực
- Chạy bằng một lệnh, không cần Docker hay tài khoản dịch vụ nào.
- Demo không tiêu tiền thật.

### Tiêu cực
- Dữ liệu chỉ nằm trên một máy, xoá `.data/pg` là mất.
- Chưa kiểm được phân quyền nhiều người, hàng đợi lệnh quảng cáo, hay tải thật.

### Rủi ro
- PGlite và Postgres thật có thể khác nhau ở vài điểm. Giảm bằng cách chỉ dùng SQL chuẩn Postgres và giữ đường `DATABASE_URL` hoạt động.
- Chế độ `ZMKT_AI=claude-code` không được dùng khi đưa cho người khác.
