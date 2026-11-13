-- Z.MKT schema v3 (ĐÍCH ĐẾN, đã duyệt 13/11/2026, áp từng bước). Phủ đủ 21 story của MVP.
-- Tài liệu đi kèm: docs/database.md. Phần đã áp nằm ở db/schema.sql (tiến độ: docs/database.md mục 10).
--
-- Quy ước chung
--   * Postgres 15+ (Supabase) và PGlite. Khoá chính uuid, sinh bằng gen_random_uuid().
--   * Tiền: bigint, đơn vị VND, không dùng số thực. Chi phí AI: micro-USD (1 USD = 1.000.000).
--   * Thời gian: timestamptz (UTC). Ngày báo cáo theo giờ Việt Nam tính ở tầng truy vấn.
--   * Trạng thái: text + check, không dùng kiểu enum của Postgres để dễ thêm giá trị.
--   * Mọi bảng nghiệp vụ có brand_id để tách dữ liệu theo thương hiệu và viết RLS.

-- =====================================================================
-- P0. NỀN TẢNG
-- =====================================================================

-- B2 · Người dùng và phiên đăng nhập
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  name          text not null,
  password_hash text not null,              -- scrypt$N$r$p$salt$hash
  zalo_user_id  text,                       -- nhận cảnh báo qua Zalo (B5)
  locale        text not null default 'vi',
  disabled_at   timestamptz,
  created_at    timestamptz not null default now()
);
create unique index users_email_key on users (lower(email));

create table sessions (
  token_hash   text primary key,            -- SHA-256 của token trong cookie httpOnly
  user_id      uuid not null references users(id) on delete cascade,
  brand_id     uuid,                        -- thương hiệu đang mở
  user_agent   text,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
create index sessions_user_idx on sessions (user_id);

-- B2 · Thương hiệu, thành viên, lời mời
create table brands (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  sample           boolean not null default false,     -- thương hiệu ví dụ
  -- B4 · an toàn tiền quảng cáo
  cap_month_vnd    bigint not null check (cap_month_vnd > 0),
  halted           boolean not null default false,      -- nút "Dừng mọi chi tiêu"
  halted_at        timestamptz,
  halted_by        uuid references users(id),
  -- B3 · trần chi cho AI
  ai_cap_month_vnd bigint not null default 500000 check (ai_cap_month_vnd >= 0),
  stage            text not null default 'profile'
                   check (stage in ('profile', 'market', 'trial', 'running')),
  timezone         text not null default 'Asia/Ho_Chi_Minh',
  created_by       uuid not null references users(id),
  archived_at      timestamptz,
  created_at       timestamptz not null default now()
);

create table brand_members (
  brand_id   uuid not null references brands(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  role       text not null check (role in ('owner', 'approver', 'member', 'viewer')),
  -- owner: mọi quyền · approver: duyệt được tiền · member: làm việc, không duyệt tiền · viewer: chỉ xem
  created_at timestamptz not null default now(),
  primary key (brand_id, user_id)
);
create index brand_members_user_idx on brand_members (user_id);

create table invitations (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references brands(id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('approver', 'member', 'viewer')),
  token_hash  text not null unique,
  invited_by  uuid not null references users(id),
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);
create index invitations_brand_idx on invitations (brand_id);

-- B3 · Mỗi lời gọi AI một dòng, có chi phí và thương hiệu
create table ai_calls (
  id                 uuid primary key default gen_random_uuid(),
  brand_id           uuid not null references brands(id) on delete cascade,
  purpose            text not null,          -- chat, read_shop, build_profile, segments, strategy, ad_copy, trial_review
  model              text not null,
  input_tokens       int not null default 0,
  output_tokens      int not null default 0,
  cache_read_tokens  int not null default 0,
  cache_write_tokens int not null default 0,
  cost_usd_micro     bigint not null default 0,
  cost_vnd           bigint not null default 0,          -- quy đổi tại thời điểm gọi
  status             text not null check (status in ('ok', 'refused', 'error', 'blocked_by_cap')),
  duration_ms        int,
  request_id         text,                               -- id phía nhà cung cấp, để tra lỗi
  error              text,
  created_at         timestamptz not null default now()
);
create index ai_calls_brand_time_idx on ai_calls (brand_id, created_at);

-- B6 + A3 · Kết nối kênh, token được mã hoá
create table channel_connections (
  id                 uuid primary key default gen_random_uuid(),
  brand_id           uuid not null references brands(id) on delete cascade,
  kind               text not null check (kind in ('meta_ads', 'shopee', 'website', 'orders_csv')),
  external_id        text,                   -- id tài khoản quảng cáo, id shop
  display_name       text not null,
  access_level       text not null check (access_level in ('full', 'read', 'link')),
  status             text not null check (status in ('connected', 'disconnected', 'expired', 'error')),
  -- Token không bao giờ lưu bản rõ. AES-256-GCM, khoá nằm ngoài cơ sở dữ liệu.
  token_ciphertext   bytea,
  token_nonce        bytea,
  token_key_version  int,
  token_expires_at   timestamptz,
  scopes             text[],
  connected_by       uuid references users(id),
  connected_at       timestamptz,
  last_sync_at       timestamptz,
  last_error         text,
  created_at         timestamptz not null default now(),
  unique (brand_id, kind, external_id)
);

-- B5 · Việc nền và cảnh báo
create table job_runs (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id) on delete cascade,   -- null: việc toàn hệ thống
  job         text not null,               -- pull_metrics, match_orders, enforce_cap, trial_review, read_shop
  status      text not null check (status in ('running', 'ok', 'failed')),
  attempt     int not null default 1,
  error       text,
  stats       jsonb not null default '{}'::jsonb,
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);
create index job_runs_job_time_idx on job_runs (job, started_at desc);
create index job_runs_failed_idx on job_runs (started_at desc) where status = 'failed';

create table alerts (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id) on delete cascade,
  kind        text not null,               -- job_failed, cap_reached, token_expired, decision_waiting
  severity    text not null check (severity in ('info', 'warning', 'critical')),
  title       text not null,
  body        text not null,
  channel     text not null check (channel in ('zalo', 'email', 'in_app')),
  recipient   text,
  status      text not null check (status in ('queued', 'sent', 'failed')),
  job_run_id  uuid references job_runs(id) on delete set null,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index alerts_brand_time_idx on alerts (brand_id, created_at desc);

-- Nhật ký: ai làm gì, lúc nào. Chỉ thêm.
create table audit_events (
  id         bigint generated always as identity primary key,
  brand_id   uuid references brands(id) on delete cascade,
  actor_type text not null check (actor_type in ('user', 'ai', 'system', 'job')),
  actor_id   uuid,
  action     text not null,
  subject    text,                          -- "campaign:<id>"
  payload    jsonb not null default '{}'::jsonb,
  at         timestamptz not null default now()
);
create index audit_brand_time_idx on audit_events (brand_id, at desc);

-- =====================================================================
-- P1. TRỢ LÝ Z.MKT
-- =====================================================================

-- Chat. Mỗi thương hiệu một dòng hội thoại liên tục.
create table messages (
  id         bigint generated always as identity primary key,
  brand_id   uuid not null references brands(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant', 'note', 'card')),
  user_id    uuid references users(id),     -- ai gõ (role = user)
  text       text not null,
  meta       jsonb not null default '{}'::jsonb,   -- nhãn, thẻ link, loại thẻ kết quả
  route      text,                          -- người dùng đang xem màn nào lúc gửi
  ai_call_id uuid references ai_calls(id) on delete set null,
  created_at timestamptz not null default now()
);
create index messages_brand_idx on messages (brand_id, id);

-- A1, A10 · Nguồn Z.MKT đã đọc
create table brand_sources (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references brands(id) on delete cascade,
  kind          text not null check (kind in ('shop', 'website', 'chat', 'file')),
  url           text,
  status        text not null check (status in ('queued', 'reading', 'read', 'failed')),
  products_seen int not null default 0,
  reviews_seen  int not null default 0,
  summary       text,
  last_read_at  timestamptz,
  error         text,
  created_at    timestamptz not null default now()
);
create index brand_sources_brand_idx on brand_sources (brand_id);

create table products (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid not null references brands(id) on delete cascade,
  source_id    uuid references brand_sources(id) on delete set null,
  external_id  text,
  name         text not null,
  price_vnd    bigint check (price_vnd >= 0),
  review_count int not null default 0,
  rating       numeric(2,1),
  image_url    text,
  url          text,
  recognized   boolean not null default true,     -- Z.MKT nhận ra và dùng trong hồ sơ
  created_at   timestamptz not null default now(),
  unique (brand_id, source_id, external_id)
);

create table review_snippets (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references brands(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  rating     int check (rating between 1 and 5),
  text       text not null,
  theme      text,                          -- "làm quà", "vẽ tay"…
  created_at timestamptz not null default now()
);
create index review_snippets_brand_idx on review_snippets (brand_id);

-- A1, A2 · Hồ sơ thương hiệu có phiên bản. Sửa trong chat = thêm một phiên bản mới.
create table brand_profiles (
  id                uuid primary key default gen_random_uuid(),
  brand_id          uuid not null references brands(id) on delete cascade,
  version           int not null,
  is_current        boolean not null default false,
  essence           text,                   -- Bản chất
  difference        text,                   -- Khác biệt
  brand_values      text,                   -- Giá trị
  personality       text,                   -- Tính cách
  best_fit          text,                   -- Hợp nhất với
  price_min_vnd     bigint,
  price_max_vnd     bigint,
  voice             text,                   -- giọng viết, dùng cho N1
  understanding_pct int check (understanding_pct between 0 and 100),
  missing           text[],                 -- còn muốn biết thêm
  changed_by        text not null check (changed_by in ('ai', 'user')),
  change_note       text,
  message_id        bigint references messages(id) on delete set null,
  confirmed_at      timestamptz,            -- người dùng bấm "Đúng rồi"
  created_at        timestamptz not null default now(),
  unique (brand_id, version)
);
create unique index brand_profiles_current_key on brand_profiles (brand_id) where is_current;

-- A4 · Nhóm khách tiềm năng theo thứ tự ưu tiên
create table segments (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references brands(id) on delete cascade,
  name       text not null,
  rank       int not null,                  -- 1 = ưu tiên cao nhất
  tier       text not null check (tier in ('priority', 'experiment')),
  who        text not null,
  why        text not null,
  gap        text,
  fit_score  int check (fit_score between 0 and 100),
  status     text not null default 'proposed' check (status in ('proposed', 'has_strategy', 'testing', 'active', 'dropped')),
  ai_call_id uuid references ai_calls(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (brand_id, rank)
);

-- A5 · Chiến lược cho một nhóm khách
create table strategies (
  id                uuid primary key default gen_random_uuid(),
  brand_id          uuid not null references brands(id) on delete cascade,
  segment_id        uuid not null references segments(id) on delete cascade,
  name              text not null,
  message           text not null,          -- thông điệp cho nhóm này
  brand_root        text,                   -- gốc từ thương hiệu
  question          text,                   -- câu hỏi cần trả lời
  channel           text not null default 'meta_ads',
  goal_orders_month int,
  criterion_vnd     bigint not null check (criterion_vnd > 0),   -- chi phí mỗi đơn phải dưới mức này
  budget_month_vnd  bigint not null check (budget_month_vnd >= 0),
  starts_on         date,
  ends_on           date,
  status            text not null default 'draft'
                    check (status in ('draft', 'waiting', 'trial', 'active', 'declined', 'stopped', 'done')),
  created_at        timestamptz not null default now()
);
create index strategies_brand_idx on strategies (brand_id);

-- A5 · Lộ trình trong trần: Thử → Mở rộng → Tăng tốc
create table strategy_stages (
  id               uuid primary key default gen_random_uuid(),
  brand_id         uuid not null references brands(id) on delete cascade,
  strategy_id      uuid not null references strategies(id) on delete cascade,
  position         int not null,
  kind             text not null check (kind in ('trial', 'expand', 'accelerate')),
  name             text not null,
  budget_vnd       bigint not null check (budget_vnd >= 0),
  budget_period    text not null check (budget_period in ('total', 'month')),
  starts_on        date,
  ends_on          date,
  entry_condition  text not null,           -- "Chạy thử đạt dưới 150.000 ₫ mỗi đơn và bạn đồng ý"
  status           text not null default 'planned'
                   check (status in ('planned', 'waiting', 'approved', 'running', 'done', 'skipped', 'stopped')),
  unique (strategy_id, position)
);

-- A6, A7, D3 · Việc chờ người dùng quyết (màu cam). Nguồn duy nhất của mọi lần duyệt tiền.
create table approval_requests (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references brands(id) on delete cascade,
  kind          text not null check (kind in ('approve_strategy', 'expand_after_trial', 'raise_budget', 'reconnect_channel')),
  strategy_id   uuid references strategies(id) on delete cascade,
  stage_id      uuid references strategy_stages(id) on delete cascade,
  title         text not null,
  detail        text,
  options       jsonb not null,             -- [{key, label, amount_vnd, period}]
  status        text not null default 'pending' check (status in ('pending', 'resolved', 'reopened', 'expired')),
  choice        text,
  amount_vnd    bigint,                     -- số tiền của lựa chọn đã chốt
  requested_by  text not null check (requested_by in ('ai', 'system')),
  resolved_by   uuid references users(id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index approvals_pending_idx on approval_requests (brand_id) where status = 'pending';

-- =====================================================================
-- P0/B4. SỔ TIỀN
-- =====================================================================

-- Chỉ thêm, không sửa, không xoá (có trigger chặn ở cuối file).
--   commit  : một lần duyệt giữ chỗ tiền trong trần tháng
--   release : trả lại phần giữ chỗ (đổi quyết định, hết giai đoạn)
--   spend   : tiền kênh quảng cáo đã tiêu thật, ghi theo số liệu kéo về
create table ledger_entries (
  id            bigint generated always as identity primary key,
  brand_id      uuid not null references brands(id) on delete cascade,
  kind          text not null check (kind in ('commit', 'release', 'spend')),
  amount_vnd    bigint not null check (amount_vnd > 0),
  month         date not null,              -- ngày đầu tháng mà khoản này tính vào trần
  approval_id   uuid references approval_requests(id),
  campaign_id   uuid,                       -- khoá ngoại thêm sau khi có bảng campaigns
  spend_date    date,                       -- kind = spend: ngày tiêu
  idempotency_key text unique,              -- chống ghi trùng khi việc nền chạy lại
  note          text not null,
  created_at    timestamptz not null default now(),
  check (kind <> 'commit' or approval_id is not null)   -- không có cam kết nào thiếu lần duyệt
);
create index ledger_brand_month_idx on ledger_entries (brand_id, month, kind);

-- =====================================================================
-- P3. NHÀ MÁY NỘI DUNG
-- =====================================================================

-- N2 · Thư viện ảnh và video người dùng tải lên
create table assets (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid not null references brands(id) on delete cascade,
  kind         text not null check (kind in ('image', 'video')),
  origin       text not null default 'upload' check (origin in ('upload', 'shop', 'ai')),
  title        text not null,
  storage_path text not null,               -- đường dẫn trong kho file (Supabase Storage)
  mime         text not null,
  bytes        bigint not null,
  width        int,
  height       int,
  duration_ms  int,
  status       text not null default 'ready' check (status in ('uploading', 'ready', 'rejected', 'archived')),
  uploaded_by  uuid references users(id),
  created_at   timestamptz not null default now()
);
create index assets_brand_idx on assets (brand_id, created_at desc);

-- N1 · Lời quảng cáo AI viết theo giọng thương hiệu
create table ad_copies (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references brands(id) on delete cascade,
  strategy_id uuid references strategies(id) on delete set null,
  label       text not null,                -- "Lời A · chiếc duy nhất"
  headline    text,
  body        text not null,
  profile_id  uuid references brand_profiles(id) on delete set null,   -- viết theo phiên bản hồ sơ nào
  status      text not null default 'draft' check (status in ('draft', 'ready', 'in_use', 'retired')),
  ai_call_id  uuid references ai_calls(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index ad_copies_brand_idx on ad_copies (brand_id);

-- =====================================================================
-- P2. QUẢNG CÁO TỰ ĐỘNG
-- =====================================================================

-- Q1 · Chiến dịch → nhóm quảng cáo → mẫu quảng cáo, khớp cấu trúc của Meta Ads
create table campaigns (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references brands(id) on delete cascade,
  strategy_id   uuid not null references strategies(id) on delete cascade,
  stage_id      uuid references strategy_stages(id) on delete set null,
  connection_id uuid references channel_connections(id) on delete set null,
  seq           int not null,               -- số thứ tự hiển thị "#1"
  name          text not null,
  question      text,                       -- chiến dịch này trả lời câu hỏi gì
  idea          text,
  format        text,                       -- reels, carousel…
  budget_vnd    bigint not null check (budget_vnd >= 0),   -- trần riêng của chiến dịch
  starts_on     date,
  ends_on       date,
  status        text not null default 'planned'
                check (status in ('planned', 'pushing', 'running', 'paused', 'stopped', 'done', 'failed')),
  stop_reason   text check (stop_reason in ('user', 'halt', 'cap', 'criterion', 'ended', 'channel_error')),
  external_id   text,                       -- id bên Meta
  tracking_code text not null,              -- gắn vào link để ghép đơn (D1)
  created_at    timestamptz not null default now(),
  unique (brand_id, seq),
  unique (brand_id, tracking_code)
);
create index campaigns_strategy_idx on campaigns (strategy_id);
alter table ledger_entries add constraint ledger_campaign_fk foreign key (campaign_id) references campaigns(id) on delete set null;

create table ad_groups (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references brands(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name        text not null,
  targeting   jsonb not null default '{}'::jsonb,
  status      text not null default 'planned' check (status in ('planned', 'running', 'paused', 'stopped')),
  external_id text
);
create index ad_groups_campaign_idx on ad_groups (campaign_id);

create table ads (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references brands(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  ad_group_id uuid not null references ad_groups(id) on delete cascade,
  asset_id    uuid references assets(id) on delete set null,
  copy_id     uuid references ad_copies(id) on delete set null,
  status      text not null default 'planned' check (status in ('planned', 'running', 'off', 'rejected')),
  off_reason  text,
  external_id text,
  created_at  timestamptz not null default now()
);
create index ads_campaign_idx on ads (campaign_id);

-- B4, Q1, Q3 · Mọi lệnh gửi sang kênh quảng cáo đều ghi ở đây TRƯỚC khi gửi.
-- Lệnh làm tăng tiền (launch, set_budget tăng, resume) bắt buộc trỏ tới một lần duyệt.
create table ad_commands (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references brands(id) on delete cascade,
  campaign_id     uuid not null references campaigns(id) on delete cascade,
  kind            text not null check (kind in ('launch', 'set_budget', 'pause', 'resume', 'stop', 'toggle_ad')),
  spends_money    boolean not null,
  approval_id     uuid references approval_requests(id),
  amount_vnd      bigint,
  reason          text not null check (reason in ('approved', 'user', 'halt', 'cap', 'criterion', 'ended', 'optimize')),
  status          text not null default 'queued' check (status in ('queued', 'sent', 'done', 'failed', 'blocked')),
  blocked_reason  text,                     -- halted, over_cap, no_approval, channel_disconnected
  idempotency_key text not null unique,
  attempts        int not null default 0,
  response        jsonb,
  created_at      timestamptz not null default now(),
  finished_at     timestamptz,
  check (not spends_money or approval_id is not null)
);
create index ad_commands_queue_idx on ad_commands (status, created_at) where status in ('queued', 'sent');

-- Q2 · Số liệu kéo về mỗi giờ, mức mẫu quảng cáo
create table ad_metrics_hourly (
  brand_id    uuid not null references brands(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  ad_id       uuid not null references ads(id) on delete cascade,
  hour        timestamptz not null,
  spend_vnd   bigint not null default 0 check (spend_vnd >= 0),
  impressions int not null default 0,
  clicks      int not null default 0,
  pulled_at   timestamptz not null default now(),
  primary key (ad_id, hour)
);
create index ad_metrics_campaign_hour_idx on ad_metrics_hourly (campaign_id, hour);

-- Công việc của chiến dịch (tab Công việc)
create table campaign_tasks (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references brands(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  phase       text not null check (phase in ('prepare', 'produce', 'run', 'optimize')),
  title       text not null,
  owner       text not null check (owner in ('zmkt', 'user')),
  status      text not null default 'scheduled' check (status in ('scheduled', 'waiting_user', 'done', 'skipped')),
  due_note    text,                         -- "hằng giờ", "sau khi bạn quyết"
  done_at     timestamptz,
  position    int not null default 0
);
create index campaign_tasks_campaign_idx on campaign_tasks (campaign_id, position);

-- =====================================================================
-- P6. ĐO LƯỜNG
-- =====================================================================

-- D1 · Đơn hàng từ nơi bán đầu tiên
create table order_imports (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references brands(id) on delete cascade,
  connection_id uuid references channel_connections(id) on delete set null,
  method        text not null check (method in ('csv', 'api')),
  file_name     text,
  rows_total    int not null default 0,
  rows_new      int not null default 0,
  rows_matched  int not null default 0,
  status        text not null check (status in ('processing', 'done', 'failed')),
  error         text,
  imported_by   uuid references users(id),
  created_at    timestamptz not null default now()
);

create table orders (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references brands(id) on delete cascade,
  import_id     uuid references order_imports(id) on delete set null,
  source        text not null,              -- shopee, website…
  external_id   text not null,
  ordered_at    timestamptz not null,
  amount_vnd    bigint not null check (amount_vnd >= 0),
  status        text not null check (status in ('placed', 'paid', 'cancelled', 'returned')),
  tracking_code text,                       -- mã trong link khách bấm
  -- Kết quả ghép đơn
  campaign_id   uuid references campaigns(id) on delete set null,
  ad_id         uuid references ads(id) on delete set null,
  match_method  text check (match_method in ('tracking_code', 'time_window', 'manual')),
  matched_at    timestamptz,
  created_at    timestamptz not null default now(),
  unique (brand_id, source, external_id)
);
create index orders_campaign_time_idx on orders (campaign_id, ordered_at) where campaign_id is not null;
create index orders_unmatched_idx on orders (brand_id, ordered_at) where campaign_id is null;

-- D3 · Tổng kết sau chạy thử, sinh ra một việc chờ duyệt
create table trial_reviews (
  id             uuid primary key default gen_random_uuid(),
  brand_id       uuid not null references brands(id) on delete cascade,
  strategy_id    uuid not null references strategies(id) on delete cascade,
  stage_id       uuid not null references strategy_stages(id) on delete cascade,
  period_start   date not null,
  period_end     date not null,
  orders         int not null,
  spend_vnd      bigint not null,
  cost_per_order_vnd bigint,
  findings       jsonb not null,            -- [{campaign_id, verdict: met|missed, cost_per_order_vnd, note}]
  recommendation text not null check (recommendation in ('expand', 'extend', 'stop')),
  summary        text not null,
  approval_id    uuid references approval_requests(id) on delete set null,
  ai_call_id     uuid references ai_calls(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- =====================================================================
-- VIEW ĐỌC NHANH
-- =====================================================================

-- D2 · Một dòng mỗi chiến dịch mỗi ngày: đã chi, hiển thị, click, đơn
create view campaign_daily as
select c.brand_id, c.id as campaign_id, d.day,
       coalesce(m.spend_vnd, 0) as spend_vnd, coalesce(m.impressions, 0) as impressions, coalesce(m.clicks, 0) as clicks,
       coalesce(o.orders, 0) as orders, coalesce(o.revenue_vnd, 0) as revenue_vnd
from campaigns c
join lateral (
  select (hour at time zone 'Asia/Ho_Chi_Minh')::date as day from ad_metrics_hourly where campaign_id = c.id
  union
  select (ordered_at at time zone 'Asia/Ho_Chi_Minh')::date from orders where campaign_id = c.id
) d on true
left join lateral (
  select sum(spend_vnd) as spend_vnd, sum(impressions) as impressions, sum(clicks) as clicks
  from ad_metrics_hourly where campaign_id = c.id and (hour at time zone 'Asia/Ho_Chi_Minh')::date = d.day
) m on true
left join lateral (
  select count(*) as orders, sum(amount_vnd) as revenue_vnd
  from orders where campaign_id = c.id and status in ('placed', 'paid') and (ordered_at at time zone 'Asia/Ho_Chi_Minh')::date = d.day
) o on true;

-- B4 · Tình hình trần của từng thương hiệu trong từng tháng
create view brand_budget_month as
select b.id as brand_id, l.month, b.cap_month_vnd,
       sum(case l.kind when 'commit' then l.amount_vnd when 'release' then -l.amount_vnd else 0 end) as committed_vnd,
       sum(case l.kind when 'spend' then l.amount_vnd else 0 end) as spent_vnd
from brands b join ledger_entries l on l.brand_id = b.id
group by b.id, l.month, b.cap_month_vnd;

-- B3 · Chi phí AI theo thương hiệu theo tháng
create view brand_ai_month as
select brand_id, date_trunc('month', created_at at time zone 'Asia/Ho_Chi_Minh')::date as month,
       count(*) as calls, sum(cost_vnd) as cost_vnd, sum(input_tokens) as input_tokens, sum(output_tokens) as output_tokens
from ai_calls group by 1, 2;

-- =====================================================================
-- RÀNG BUỘC BẰNG TRIGGER
-- =====================================================================

-- Sổ tiền và nhật ký chỉ được thêm.
create function forbid_change() returns trigger language plpgsql as $$
begin
  raise exception '% chỉ được thêm, không sửa, không xoá', tg_table_name;
end $$;
create trigger ledger_append_only before update or delete on ledger_entries for each row execute function forbid_change();
create trigger audit_append_only before update or delete on audit_events for each row execute function forbid_change();

-- Cửa an toàn ở tầng dữ liệu: không ghi được cam kết khi đang dừng hoặc khi vượt trần tháng.
create function check_commit() returns trigger language plpgsql as $$
declare b record; committed bigint;
begin
  if new.kind <> 'commit' then return new; end if;
  select halted, cap_month_vnd into b from brands where id = new.brand_id for update;
  if b.halted then raise exception 'Thương hiệu đang dừng mọi chi tiêu'; end if;
  select coalesce(sum(case kind when 'commit' then amount_vnd when 'release' then -amount_vnd else 0 end), 0)
    into committed from ledger_entries where brand_id = new.brand_id and month = new.month;
  if committed + new.amount_vnd > b.cap_month_vnd then
    raise exception 'Vượt trần tháng: % + % > %', committed, new.amount_vnd, b.cap_month_vnd;
  end if;
  return new;
end $$;
create trigger ledger_check_commit before insert on ledger_entries for each row execute function check_commit();
