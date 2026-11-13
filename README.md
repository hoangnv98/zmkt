# Z.MKT (bản thử chạy local)

Trên macOS hoặc Linux (Windows xem mục bên dưới):

```bash
npm install
cp .env.example .env.local   # điền ANTHROPIC_API_KEY nếu muốn chat trả lời bằng AI
npm run dev                  # http://localhost:3210
```

Không cần Docker. Cơ sở dữ liệu là Postgres nhúng (PGlite), nằm ở `.data/pg`. Xoá thư mục đó là về trạng thái ban đầu (mất cả tài khoản đã tạo).
Đặt `DATABASE_URL` thì chạy trên Postgres thật hoặc Supabase, cùng một `db/schema.sql`.

## Chạy trên Windows

Hướng dẫn này viết theo mã nguồn, chưa được chạy thử trên một máy Windows thật. Gặp lỗi ngoài bảng bên dưới thì báo lại.

**Cần cài trước**

- [Node.js](https://nodejs.org) bản LTS, từ 20 trở lên. Kiểm bằng `node -v`.
- [Git for Windows](https://git-scm.com/download/win).

**Các bước** (mở PowerShell)

```powershell
git clone https://github.com/hoangnv98/zmkt.git C:\dev\zmkt
cd C:\dev\zmkt
npm install
Copy-Item .env.example .env.local
notepad .env.local          # điền ANTHROPIC_API_KEY nếu muốn chat trả lời bằng AI, rồi lưu
npm run dev
```

Mở http://localhost:3210 và đăng nhập bằng `test@zmkt.vn` / `zmkt12345`. Dừng máy chủ bằng `Ctrl + C`.

Dùng Command Prompt thay cho PowerShell thì đổi dòng sao chép thành `copy .env.example .env.local`.

**Lưu ý riêng cho Windows**

- Đặt dự án ở đường dẫn ngắn, không dấu, ví dụ `C:\dev\zmkt`. Đừng đặt trong OneDrive hay Google Drive: cơ sở dữ liệu nằm ở `.data\pg` và phần mềm đồng bộ có thể khoá file khi đang ghi.
- Không cần Docker, không cần cài Postgres hay WSL.
- Để chat trả lời bằng AI, dùng `ANTHROPIC_API_KEY`. Chế độ `ZMKT_AI=claude-code` gọi lệnh `claude` trực tiếp và có thể không tìm thấy lệnh này trên Windows; nếu vẫn muốn dùng, đặt `ZMKT_CLAUDE_BIN` thành đường dẫn đầy đủ tới `claude.exe`.
- File đơn hàng xuất từ Excel: chọn kiểu lưu "CSV UTF-8 (Comma delimited)", nếu không tên cột tiếng Việt sẽ lỗi dấu.

**Lỗi hay gặp**

| Hiện tượng | Cách xử lý |
|---|---|
| `npm : File ...\npm.ps1 cannot be loaded because running scripts is disabled` | Chạy `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` rồi mở lại PowerShell, hoặc gõ `npm.cmd` thay cho `npm` |
| `EADDRINUSE` hoặc cổng 3210 đang bận | `netstat -ano \| findstr :3210` để lấy PID, rồi `taskkill /PID <PID> /F` |
| Muốn xoá dữ liệu về ban đầu | Dừng máy chủ trước, rồi `Remove-Item -Recurse -Force .data` |
| Trang báo lỗi sau khi cập nhật mã (`git pull`) | Dừng máy chủ, chạy `npm install`, rồi `npm run dev` lại. Khi schema đổi, dữ liệu local được dựng lại từ đầu |
| Tường lửa Windows hỏi quyền cho Node.js | Chọn cho phép trên mạng riêng. Ứng dụng chỉ chạy trên máy bạn |

## Đăng nhập

Lần đầu chạy, máy tự tạo tài khoản thử `test@zmkt.vn` / `zmkt12345`. Tạo tài khoản mới ở trang đăng nhập.
Mỗi tài khoản có sẵn thương hiệu ví dụ Gốm Lam (có dữ liệu mẫu) và thêm được thương hiệu của mình.

- Mật khẩu băm bằng scrypt, không lưu bản gốc.
- Phiên đăng nhập 30 ngày, cookie `zmkt_session` httpOnly; cơ sở dữ liệu chỉ giữ băm SHA-256 của token.
- Mọi API kiểm tra phiên, và chỉ cho đụng vào thương hiệu mà người đăng nhập là thành viên. Chỉ chủ và người duyệt mới duyệt được tiền.

## Backend

| Phần | File |
|---|---|
| Schema v3 bước 4 (28 bảng, 2 view; còn thiếu ai_calls, job_runs, alerts) | `db/schema.sql` |
| Nối CSDL (PGlite hoặc Postgres) | `lib/server/db.ts` |
| Nghiệp vụ và an toàn tiền | `lib/server/zmkt.ts` |
| Lệnh gửi kênh quảng cáo, ghi số liệu theo giờ | `lib/server/adsops.ts` |
| Tổng kết chạy thử | `lib/server/review.ts` |
| Nhập đơn hàng từ file CSV (file mẫu ở `public/mau-don-hang.csv`) | `lib/server/orders.ts` |
| Dữ liệu mẫu Gốm Lam | `lib/server/sample.ts` |
| Cổng quảng cáo: giả lập Meta Ads, chỗ để nối Meta thật | `lib/server/ads.ts` |
| Chat bằng Claude | `lib/server/agent.ts` |
| Đăng nhập, phiên, chọn thương hiệu | `lib/server/auth.ts` |

An toàn tiền nằm ở `lib/server/zmkt.ts`:
- Mọi khoản giữ chỗ (`commit`) bị từ chối khi đang "Dừng mọi chi tiêu" hoặc khi tổng giữ chỗ vượt trần tháng của thương hiệu (đặt khi tạo thương hiệu; Gốm Lam là 30 triệu ₫).
- Bộ giả lập không bao giờ ghi một khoản chi làm vượt trần; chạm trần thì dừng chiến dịch.
- Trần tính theo tháng dương lịch. Cơ sở dữ liệu có trigger lặp lại hai cửa trên.
- Sổ `ledger_entries` chỉ thêm, không sửa, không xoá. Đổi quyết định thì ghi một dòng `release`.
- Chat không đổi được tiền; chỉ nút duyệt của người dùng mới đổi được.

## API

Mọi route trả lại toàn bộ trạng thái sau khi đổi. Lỗi nghiệp vụ trả 409 kèm `error` tiếng Việt.

| Route | Thân | Việc |
|---|---|---|
| `POST /api/auth/login` | `{email, password}` | Đăng nhập, đặt cookie |
| `POST /api/auth/register` | `{name, email, password}` | Tạo tài khoản, đăng nhập luôn |
| `POST /api/auth/logout` | | Đăng xuất |
| `GET /api/brands` | | Thương hiệu của tài khoản |
| `POST /api/brands` | `{name, shopUrl?, capTr}` | Thêm thương hiệu, trần tính bằng triệu ₫ |
| `POST /api/brands/select` | `{id}` | Chọn thương hiệu đang làm việc |
| `GET /api/state` | | Trạng thái của thương hiệu đang chọn |
| `POST /api/decisions` | `{approvalId, choice}`. `approvalId` lấy từ `approvals` trong trạng thái. `choice` là một lựa chọn của lần xin duyệt đó, hoặc `pending` để mở lại. | Duyệt, từ chối, hoặc mở lại |
| `POST /api/halt` | `{halted: boolean}` | Dừng hoặc bật lại mọi chi tiêu |
| `POST /api/channels` | `{kind: "meta_ads", connected: boolean}` | Nối hoặc ngắt Meta Ads |
| `POST /api/chat` | `{text}` | Gửi tin, Z.MKT trả lời |
| `POST /api/sim` | `{days?: 1..14}` | Giả lập Meta Ads chạy thêm N ngày |
| `POST /api/orders/import` | `{fileName, source, csv}` | Nhập đơn hàng từ file CSV (tối đa 2 MB, 5.000 dòng) |
| `POST /api/demo` | `{stage: "before"\|"running"\|"after"}` | Nạp lại dữ liệu mẫu |

## Tài liệu

Tổ chức theo quy ước của [ECC](https://github.com/affaan-m/ECC).

| Tài liệu | Nội dung |
|---|---|
| `CLAUDE.md` | Quy tắc bắt buộc của dự án, cấu trúc, quy trình làm việc với ECC |
| `docs/CODEMAPS/` | Sơ đồ mã: kiến trúc, backend, frontend, dữ liệu, phụ thuộc |
| `docs/database.md` | Thiết kế cơ sở dữ liệu v3 (đã duyệt, đang áp từng bước) |
| `docs/adr/` | Quyết định kiến trúc |
| `docs/CONTRIBUTING.md` | Cài đặt, lệnh, danh sách kiểm trước khi gửi |
| `docs/ENV.md` | Biến môi trường |
| `docs/RUNBOOK.md` | Chạy demo, đưa về ban đầu, lỗi hay gặp |
| `PRODUCT.md`, `DESIGN.md` | Bối cảnh sản phẩm và hệ thống giao diện |

ECC cài ở `.claude/`: 4 bộ quy tắc (common, typescript, react, web), 12 agent, 10 lệnh, 17 skill. Chưa bật hook.
