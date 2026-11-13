# Sổ tay vận hành (bản demo local)

Chưa có môi trường triển khai. Mục này chỉ nói về chạy trên máy cá nhân.

## Chạy demo

```bash
npm run dev
```

Vào http://localhost:3210. Thương hiệu mẫu Gốm Lam có ô chọn giai đoạn (trước khi chạy, đang chạy thử, sau 2 tuần) và nút "Giả lập +1 ngày" dưới ô chat.

## Đưa về trạng thái ban đầu

| Muốn | Làm |
|---|---|
| Đưa Gốm Lam về một giai đoạn | Chọn giai đoạn dưới ô chat, hoặc `POST /api/demo {stage}` |
| Xoá hết dữ liệu, kể cả tài khoản | Dừng máy chủ, xoá thư mục `.data/pg`, chạy lại |

## Lỗi hay gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Đổi `db/schema.sql` mà không thấy tác dụng | Kết nối cơ sở dữ liệu được giữ trong bộ nhớ | Dừng và chạy lại `npm run dev` |
| `ENOENT mkdir .data/pg` | Thư mục dữ liệu bị xoá khi máy chủ đang chạy | Chạy lại máy chủ |
| Chat trả lời "chưa nối được AI" | Thiếu `ANTHROPIC_API_KEY` và không đặt `ZMKT_AI` | Xem `docs/ENV.md` |
| Chat chậm khi `ZMKT_AI=claude-code` | Mỗi tin nhắn mở một tiến trình `claude` | Bình thường ở chế độ thử |
| Nút duyệt bị khoá | Đang "Dừng mọi chi tiêu" | Bấm "Bật lại chi tiêu" |
| API trả 409 kèm câu tiếng Việt | Lỗi nghiệp vụ, ví dụ vượt trần | Đọc câu báo lỗi, không phải lỗi hệ thống |

## Kiểm tra máy chủ còn sống

`GET /api/state` trả 401 khi chưa đăng nhập và 200 khi đã chọn thương hiệu. Cả hai đều nghĩa là máy chủ đang chạy.
