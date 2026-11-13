<!-- Generated: 2026-11-13 | Files scanned: 17 | Token estimate: ~600 -->
# Frontend

## Cây trang
/                      → chuyển hướng theo phiên
/dang-nhap             đăng nhập, đăng ký
/chon-thuong-hieu      danh sách, thêm thương hiệu, đăng xuất
(app)/layout.tsx       khung: TopBar + vùng làm việc + Chat
  /ho-so               Hồ sơ thương hiệu
  /ket-noi             Kết nối (banner % bức tranh, 5 nhóm)
  /tiem-nang           Thị trường tiềm năng
  /chien-luoc          Chiến lược, duyệt chạy thử
  /trien-khai          Danh sách chiến dịch, kết quả chạy thử
  /trien-khai/[id]     Chi tiết: Tổng quan / Công việc / Nội dung
Thương hiệu không phải mẫu → NewBrand thay cho nội dung trang

## Thành phần
TopBar     thương hiệu, việc chờ duyệt, đã chi, Dừng mọi chi tiêu, 3 bước, bật tắt chat
Chat       tin nhắn, thẻ kết quả (đọc state.trialReview), ô nhập, chọn giai đoạn mẫu, Giả lập +1 ngày
Decisions  các thẻ duyệt (first, expand, tet)
OrderImport  khối nhập đơn hàng từ file CSV ở màn Kết nối
NewBrand   màn trống cho thương hiệu mới
Icon       bộ biểu tượng SVG

## Trạng thái (lib/store.tsx)
StoreProvider({initial}) giữ AppState từ máy chủ
call(url, body, optimistic): cập nhật lạc quan → POST → thay bằng state trả về
pending: thương hiệu mẫu tính tại chỗ từ stage/expand/tet; thương hiệu khác lấy pendingCount

## Kiểu và dữ liệu
lib/types.ts  AppState, ChatMsg, DecisionInput, Stage
lib/data.ts   lịch tuần của màn kế hoạch, hàm định dạng, phép chia tiền theo tuần để vẽ biểu đồ
Mọi nội dung hiển thị đọc từ store: source, profile, products, segments, strategies, campaigns
/trien-khai/[id] dùng số thứ tự chiến dịch (seq) trên đường dẫn

## CSS
app/globals.css (327 dòng): token màu, bo góc, mọi class. Không dùng thư viện CSS.
