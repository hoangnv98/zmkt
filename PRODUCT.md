# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript. Bản thử chạy local. Kế hoạch sau: Supabase (Postgres, đăng nhập, lưu file), Inngest (việc nền), Claude (AI), Sentry. Nguồn: mục 10 của tài liệu kế hoạch, người dùng đã đồng ý "chạy local trước, lên giao diện trước".

## Users

- **Người dùng đầu tiên của bản thử (đã xác nhận):** đội marketing nội bộ của công ty, 2 người, rành quảng cáo, đang ra doanh số bằng cách làm tay. Họ dùng Z.MKT để so với cách làm tay: có ra đơn rẻ hơn và tốn ít giờ hơn không.
- **Khách hàng mục tiêu về sau:** chủ shop online và hộ kinh doanh 1-5 người; thương hiệu nhỏ có 1-3 người marketing; creator và chuyên gia bán hàng dựa trên uy tín cá nhân. Họ không có đội marketing và không rành công cụ quảng cáo.
- **Thiết bị (đã xác nhận):** máy tính là chính. Điện thoại xem được nhưng không phải trọng tâm.

## Product Purpose

Z.MKT nhận phần marketing thay thương hiệu: hiểu thương hiệu, lên kế hoạch, triển khai, đo kết quả. Thương hiệu giữ ý tưởng, sản phẩm, giá trị, và quyền duyệt kế hoạch cùng ngân sách. Thành công của MVP: một luồng trọn vẹn chạy được (chat, hồ sơ, chiến lược, duyệt, chạy 1 kênh, đơn hàng và chi phí mỗi đơn), và sau 2 tuần chạy thử có kết luận đạt hay không so với tiêu chí chi phí mỗi đơn.

## Positioning

Một khung chat và ba bước (Thương hiệu, Thị trường, Triển khai) thay cho cả bộ công cụ quảng cáo. Thương hiệu chỉ duyệt ở tầm chiến lược; Z.MKT tự chạy trong khung đã duyệt và chỉ hỏi khi vượt khung. Mọi khoản chi phải được duyệt và không vượt trần.

## Operating Context

- Người dùng trò chuyện với Z.MKT ở khung chat; khung làm việc bên cạnh hiện kết quả của bước đang xem.
- Mỗi chiến dịch trả lời một câu hỏi rõ ràng (ví dụ: "Video vẽ tay có ra đơn với chi phí dưới 150.000 ₫ không?").
- Vòng lặp: chạy thử 2 tuần với ngân sách nhỏ, đạt thì mở rộng, chưa đạt thì dừng. Lộ trình ngân sách tăng dần trong trần: Thử, Mở rộng, Tăng tốc.
- Kênh quảng cáo đầu tiên: Meta Ads (đã xác nhận).
- Báo cáo CEO hằng tuần dựa trên chi phí mỗi đơn và chi phí AI.

## Capabilities and Constraints

- Phạm vi MVP (21 story, 100 điểm): nền tảng B1-B6, trợ lý A1-A7, quảng cáo Q1-Q3 trên 1 kênh, nội dung chữ N1-N2, đo lường D1-D3.
- Chưa có ở MVP: sức khoẻ thương hiệu (A8), tăng ngân sách trong chat (A9), A/B test, tự tối ưu, kênh thứ hai và thứ ba, ảnh AI, video AI, inbox, KOC, GEO, đồng bộ catalog, báo cáo đa kênh.
- Thuật ngữ cố định: Thương hiệu, Thị trường, Triển khai; Hồ sơ, Sức khoẻ, Kết nối; Tiềm năng, Chiến lược; Tổng quan, Công việc, Nội dung; "chạy thử", "trần ngân sách", "chi phí mỗi đơn", "tiêu chí".
- Mức quyền của mỗi kết nối: toàn quyền, đọc dữ liệu, chỉ link.
- Quy tắc an toàn tiền: không lệnh chi nào chạy khi chưa duyệt hoặc vượt trần; có nút dừng; chiến dịch tự dừng khi chạm trần.
- Giao diện tiếng Việt, tiền Việt Nam đồng.

## Brand Commitments

- Tên: Z.MKT.
- Cấu trúc từ mockup được giữ (đã xác nhận): ba bước, khung làm việc bên trái và chat bên phải, **màu cam dành riêng cho việc chờ người dùng quyết**.
- Phần nhìn (màu, chữ, kiểu thành phần) được làm lại, không bắt buộc theo mockup.
- Yêu cầu của người dùng: giao diện không được trông như do AI làm.
- Giọng: xưng "mình", gọi "bạn", câu ngắn, nói bằng số.

## Evidence on Hand

- Slide và mockup: `/Volumes/DATA/CLIP/Z.MKT — Slide & mockup sản phẩm.pdf` (mockup ở trang 12-21).
- Kế hoạch sản phẩm: `/Volumes/DATA/CLIP/Z.MKT - San pham, ke hoach trien khai va nguon luc.html`.
- Dữ liệu mẫu trong mockup là thương hiệu ví dụ "Gốm Lam" (gốm men lam vẽ tay, Bát Tràng). Đây là dữ liệu minh hoạ, không phải khách thật.
- Chưa có: logo chính thức, ảnh sản phẩm thật, khách hàng thật, số liệu chiến dịch thật. Không được bịa các thứ này thành sự thật.

## Product Principles

1. Người dùng quyết ở tầm chiến lược, Z.MKT làm phần còn lại.
2. Tiền luôn an toàn: duyệt trước, có trần, dừng được.
3. Kết quả nói bằng số: đơn, đã chi, chi phí mỗi đơn so với tiêu chí.
4. Việc cần người dùng quyết phải nổi lên trước mọi thứ khác.
5. Thử nhỏ trước, có kết quả mới tăng.
