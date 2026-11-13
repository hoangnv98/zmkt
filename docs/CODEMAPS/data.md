<!-- Generated: 2026-11-13 | Files scanned: 3 | Token estimate: ~500 -->
# Dữ liệu

## Đang chạy: db/schema.sql (v3, bước 4 trên 5, 28 bảng)
Tài khoản
users, sessions, brands, brand_members, invitations
Hồ sơ và thị trường
brand_sources, products, review_snippets, brand_profiles (một dòng is_current), segments
Chiến lược và tiền
strategies, strategy_stages (trial, expand, accelerate)
approval_requests  việc chờ duyệt: options jsonb, choice, amount_vnd, resolved_by
ledger_entries     chỉ thêm: commit (bắt buộc approval_id), release, spend (campaign_id, spend_date); month
Quảng cáo
channel_connections  meta_ads, shopee…: access_level, status, token mã hoá
assets, ad_copies    ảnh, video, lời quảng cáo
campaigns            seq, budget_vnd (trần riêng), stage_id, status, stop_reason, tracking_code
ad_groups, ads       ads = một asset + một lời; status running | off | planned
ad_commands          mọi lệnh gửi kênh; lệnh tăng tiền bắt buộc approval_id; idempotency_key
ad_metrics_hourly    PK (ad_id, hour): spend_vnd, impressions, clicks
campaign_tasks       công việc theo phase, owner, status
Đo lường
order_imports, orders (campaign_id, tracking_code, match_method)
Khác
messages, audit_events (chỉ thêm)
trial_reviews: ảnh chụp kết quả và đề xuất lúc hết chạy thử (thẻ kết quả trong chat đọc từ đây)
Chưa có: ai_calls, job_runs, alerts (bước 5)

## View và trigger
brand_budget_month   committed_vnd, spent_vnd theo thương hiệu và tháng
campaign_daily       một dòng mỗi chiến dịch mỗi ngày: spend, impressions, clicks, orders (gộp từ số liệu giờ và đơn hàng)
check_commit         từ chối commit khi halted hoặc vượt cap_month_vnd của tháng
ledger_guard         cấm sửa; chỉ cho xoá dòng của thương hiệu ví dụ
forbid_change        audit_events chỉ thêm

## Quan hệ
users n—n brands qua brand_members
segments 1—n strategies 1—n strategy_stages 1—n campaigns 1—n ad_groups 1—n ads 1—n ad_metrics_hourly
approval_requests 1—n ledger_entries; approval_requests 1—n ad_commands
campaigns 1—n (ad_commands, campaign_tasks, orders, ledger_entries.spend)

## Tiền của đợt chạy thử
5 tr: strategy_stages.budget_vnd → approval_requests.amount_vnd → ledger_entries commit
3 tr + 2 tr: campaigns.budget_vnd; lúc đẩy ghi ad_commands.amount_vnd (launch)
đã chi: ad_metrics_hourly.spend_vnd (giờ) và ledger_entries spend (ngày)

## Phiên bản schema
Bảng schema_version. lib/server/db.ts: SCHEMA_VERSION = 5.
Lệch phiên bản trên PGlite → xoá schema public và dựng lại. Trên Postgres thật → báo lỗi, không tự xoá.

## Đích đến: db/schema.v3.proposed.sql
31 bảng, 3 view. Tiến độ ở docs/database.md mục 10. Quyết định ở docs/adr/0002.

## Nơi lưu
Local: .data/pg (PGlite). Xoá thư mục là về trạng thái ban đầu.
