---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

# Z.MKT app shell và các màn hình MVP

Scope: toàn bộ màn hình làm việc của bản thử (Thương hiệu, Thị trường, Triển khai, đăng nhập, chọn thương hiệu). Mode: Operate. Máy tính là chính.

Audience: đội marketing nội bộ, rành quảng cáo. Job: duyệt chiến lược, theo dõi chạy thử, quyết mở rộng hay dừng. Constraint: giữ 3 bước, khung làm việc trái, chat phải, cam chỉ cho việc chờ quyết. Dữ liệu mẫu Gốm Lam là minh hoạ.

Unresolved: logo chính thức, ảnh sản phẩm thật, dữ liệu thật từ Meta Ads.

## Direction contract

THESIS: Chiến dịch là những thanh ngang trên trục tuần, như bảng flight plan của agency; tiền đã chi, tiền dự kiến và trần nằm trên cùng một lưới. Từ chối bố cục "bốn ô số liệu bo tròn trên nền be" của mockup.

OWN-WORLD: thanh trên cùng màu đá phiến #1d2733; nền lưới xám lạnh #e9edf2; mặt giấy trắng kẻ ô 1px; xanh #2c6fdb cho thứ đã chạy và thứ chọn được; xanh nhạt viền liền cho thứ đã duyệt nhưng chưa chi; thanh gạch chéo nét đứt cho thứ mới là kế hoạch, chưa duyệt; xanh lá #16794c cho con số đạt tiêu chí; cam #f28c1a chỉ cho việc chờ người dùng quyết; đỏ chỉ cho vạch trần và số vượt tiêu chí. Chữ Barlow, số và nhãn cột Barlow Semi Condensed, số dạng bảng. Góc 2-3px, không bóng đổ.

STORY: người dùng thấy ngay việc nào chờ mình, tiền đang ở đâu so với trần, chiến dịch nào đạt tiêu chí; tin vì mọi con số đều có đơn vị và tiêu chí kèm theo; bấm một nút để duyệt, thử thêm, hoặc dừng.

FIRST VIEWPORT (Triển khai, 1440x900): thanh trên 52px gồm tên, thương hiệu, 3 bước, số việc chờ, tiền đã chi so với trần, nút dừng. Trái: tiêu đề cùng tab và ba số tóm tắt trên một dòng; bảng tuần 8 cột với thanh chiến dịch và ba cột số bên phải; hàng cột ngân sách theo tuần có vạch trần; thanh quyết định màu cam ở dưới với ba nút. Phải: chat 372px.

FORM: bảng kế hoạch media (flight plan), vị trí 1 trong danh sách của mình; người dùng tự chọn trên trang quyết định. seed:05dc3be4cf1df274. Nét riêng: thanh flight chuyển từ gạch chéo nét đứt sang nền liền viền liền khi được duyệt, và lặp lại ở Chiến lược (lộ trình ngân sách) cùng chi tiết chiến dịch (kết quả theo ngày).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
