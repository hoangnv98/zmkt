<!-- Generated: 2026-11-13 | Files scanned: 41 | Token estimate: ~600 -->
# Kiến trúc

Một ứng dụng Next.js, chạy local, một tiến trình.

## Luồng dữ liệu
Trình duyệt → app/(app)/layout.tsx (Server Component: currentSession → getState) → StoreProvider
Thao tác người dùng → lib/store.tsx call() → POST /api/* → lib/server/http.ts (withUser | withBrand) → lib/server/zmkt.ts → lib/server/db.ts → PGlite (.data/pg)
Mọi route trả lại toàn bộ AppState. Store thay trạng thái bằng bản mới.

## Ranh giới
Giao diện: app/, components/, lib/store.tsx
Nghiệp vụ và an toàn tiền: lib/server/zmkt.ts
Đăng nhập: lib/server/auth.ts, lib/server/http.ts
Kênh quảng cáo: lib/server/ads.ts (interface AdsChannel; Simulator đang dùng, MetaAds chưa viết)
Chat AI: lib/server/agent.ts (API Claude, hoặc Claude Code khi ZMKT_AI=claude-code)
Dữ liệu: lib/server/db.ts, db/schema.sql

## Điều hướng khi chưa đủ điều kiện
Chưa đăng nhập → /dang-nhap
Đã đăng nhập, chưa chọn thương hiệu → /chon-thuong-hieu
API 401 → /dang-nhap; API 409 không kèm state → /chon-thuong-hieu

## Chi tiết
backend.md, frontend.md, data.md, dependencies.md
