<!-- Generated: 2026-11-13 | Files scanned: 18 | Token estimate: ~800 -->
# Backend

## Routes
POST /api/auth/login      → open → auth.login
POST /api/auth/register   → open → auth.register
POST /api/auth/logout     → open → auth.logout
GET  /api/brands          → withUser → zmkt.listBrands
POST /api/brands          → withUser → zmkt.createBrand
POST /api/brands/select   → withUser → auth.selectBrand (kiểm chủ sở hữu)
GET  /api/state           → withBrand → zmkt.getState (+ brandview, campaignview)
POST /api/decisions       → withBrand → zmkt.decide({approvalId, choice}) → commit | release (ledger_entries)
POST /api/halt            → withBrand → zmkt.setHalted → adsops.pauseAll | resumeAll
POST /api/channels        → withBrand → zmkt.setMetaConnected
POST /api/chat            → withBrand → zmkt.addChat → agent.reply → zmkt.addChat
POST /api/sim             → withBrand → zmkt.tick (1..14 ngày) → adsops.recordDay (số liệu giờ, đơn, sổ)
POST /api/orders/import   → withBrand → orders.importOrders (đọc CSV, ghép đơn về chiến dịch bằng mã theo dõi)
POST /api/demo            → withBrand → zmkt.reseed

## Lớp bọc (lib/server/http.ts)
open      không cần phiên
withUser  cần phiên, 401 nếu thiếu
withBrand cần phiên, thương hiệu đang chọn và vai thành viên; truyền Actor {userId, role}; trả AppState; ZError → {error, state}

## Quyền theo vai
decide (duyệt tiền)   owner, approver
bật lại chi tiêu      owner, approver
dừng chi, đổi kết nối mọi vai trừ viewer

## An toàn tiền (lib/server/zmkt.ts + trigger trong db/schema.sql)
commit(): từ chối khi brands.halted, hoặc khi cam kết của tháng + khoản mới > cap_month_vnd
tháng: tháng dương lịch giờ Việt Nam; thương hiệu ví dụ dùng 2026-10-01
decide(): số tiền lấy từ approval_requests.options; choice "pending" → release, dòng cũ thành reopened, tạo dòng pending mới
tick(): chi tiêu giả lập bị kẹp ở trần; chạm trần thì dừng chiến dịch (stop_reason = cap)
adsops.command(): lệnh tăng tiền cần approval_id, thương hiệu không dừng chi, Meta đang kết nối, tổng ngân sách chiến dịch ≤ số tiền lần duyệt
ledger_entries: chỉ thêm (commit, release, spend); trigger check_commit lặp lại hai cửa trên

## Key Files
lib/server/zmkt.ts (duyệt, dừng chi, nạp dữ liệu mẫu, bộ giả lập theo ngày, đọc trạng thái)
lib/server/adsops.ts (lệnh gửi kênh quảng cáo, ghi số liệu một ngày)
lib/server/campaignview.ts (đọc chiến dịch, số liệu ngày, công việc, nội dung)
lib/server/review.ts (zmkt.finishTrial gọi writeTrialReview; getState gọi loadTrialReview)
lib/server/orders.ts (đọc CSV, nhập đơn, các lần nhập gần đây)
lib/server/brandview.ts (đọc hồ sơ, sản phẩm, nhóm khách, chiến lược)
lib/server/sample.ts (dữ liệu mẫu Gốm Lam: tin nhắn, lựa chọn duyệt, chiến dịch, số liệu 14 ngày)
lib/server/ads.ts (AdsChannel, Simulator; MetaAds chưa viết)
lib/server/auth.ts (scrypt, phiên, thành viên, tài khoản thử)
lib/server/agent.ts (prompt hệ thống, brief trạng thái, gọi Claude)
lib/server/db.ts (PGlite | postgres, dựng schema theo SCHEMA_VERSION)
lib/server/http.ts (open, withUser, withBrand), lib/server/errors.ts (ZError)
