# ADR-0002: Cơ sở dữ liệu v3 và năm lựa chọn đi kèm

**Ngày:** 2026-11-13
**Trạng thái:** accepted
**Người quyết định:** chủ dự án

## Bối cảnh

Schema v2 đủ cho bản thử nhưng không phủ hết 21 story của MVP: một thương hiệu chỉ có một chủ, lần duyệt tiền chỉ là một cặp khoá và lựa chọn, an toàn tiền chỉ nằm trong mã. Thiết kế v3 ở `docs/database.md` và `db/schema.v3.proposed.sql` đã được trình duyệt cùng sáu câu hỏi. Câu 1 (đăng nhập) đã trả lời ở ADR-0001.

## Quyết định

Áp dụng v3 theo năm bước, và chốt:

1. **Trần tính theo tháng dương lịch**, giờ Việt Nam. Mỗi dòng sổ có cột `month`.
2. **Chưa thêm bảng `accounts`.** Thuê bao theo thương hiệu hay theo công ty quyết ở v1.0.
3. **Chỉ lưu trích đoạn đánh giá**, không lưu toàn bộ đánh giá của shop.
4. **Số liệu theo giờ giữ 90 ngày**, sau đó gộp theo ngày.
5. **Chỉ `owner` và `approver` duyệt được tiền.** `member` làm việc nhưng không duyệt, `viewer` chỉ xem.

## Phương án đã cân nhắc

### Trần theo 30 ngày trượt
- **Được:** chặt hơn, không có chuyện tiêu dồn cuối tháng này và đầu tháng sau.
- **Mất:** khó giải thích cho chủ shop, truy vấn phức tạp hơn.
- **Lý do không chọn:** chủ shop nghĩ ngân sách theo tháng.

### Thêm `accounts` ngay
- **Được:** agency quản nhiều thương hiệu dễ hơn.
- **Mất:** thêm một tầng khi chưa có yêu cầu tính tiền.
- **Lý do không chọn:** chưa cần ở MVP.

### Lưu toàn bộ đánh giá
- **Được:** phân tích lại được về sau.
- **Mất:** tốn dung lượng, giữ dữ liệu của người mua.
- **Lý do không chọn:** trích đoạn đã đủ cho hồ sơ thương hiệu.

### Cho `member` duyệt tiền
- **Được:** còn ba vai, đơn giản hơn.
- **Mất:** không tách được người làm việc với người chịu trách nhiệm về tiền.
- **Lý do không chọn:** duyệt tiền là quyền cần giới hạn.

## Hệ quả

### Tích cực
- An toàn tiền có hai lớp: mã (`commit()` trong `lib/server/zmkt.ts`) và trigger `check_commit` trong cơ sở dữ liệu.
- Mỗi lần duyệt có người duyệt, số tiền và lịch sử mở lại.

### Tiêu cực
- Dữ liệu v2 bị bỏ, tài khoản và thương hiệu đã tạo phải tạo lại.
- Trong lúc chuyển, một số bảng còn ở dạng v2 và có cột tạm (liệt kê ở `docs/database.md` mục 10).

### Rủi ro
- Một lần duyệt "mỗi tháng" hiện chỉ giữ chỗ cho một tháng. Việc nền ghi cam kết cho tháng sau thuộc bước 5, chưa có.
- Thương hiệu thật đã có dòng sổ không xoá được, chỉ lưu trữ.
