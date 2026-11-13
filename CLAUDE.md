# Z.MKT — CLAUDE.md của dự án

> Viết theo mẫu `examples/saas-nextjs-CLAUDE.md` của ECC. Đây là file đầu tiên mọi phiên làm việc đọc.

## Tổng quan

**Sản phẩm:** Z.MKT là trợ lý marketing AI cho chủ shop Việt Nam. Nó lập chiến lược, chạy quảng cáo, và chỉ tiêu tiền khi người dùng đã duyệt. Bối cảnh sản phẩm ở `PRODUCT.md`, giao diện ở `DESIGN.md`.

**Giai đoạn:** bản demo, chạy local. Chưa triển khai lên máy chủ (xem `docs/adr/0001-demo-chay-local.md`).

**Stack:** Next.js 15 (App Router), React 19, TypeScript, CSS thuần (token trong `app/globals.css`), Postgres nhúng PGlite (`.data/pg`), SQL thô qua `lib/server/db.ts`, zod, `@anthropic-ai/sdk`.

**Kiến trúc:** Server Component tải trạng thái, một `StoreProvider` phía client giữ trạng thái, mọi thay đổi đi qua `app/api/*` rồi trả lại toàn bộ trạng thái. Sơ đồ ở `docs/CODEMAPS/`.

## Quy tắc bắt buộc

### Tiền

- Tiền là số nguyên ₫ (bigint). Không dùng số thực cho tiền ở phía máy chủ.
- Mọi khoản giữ chỗ đi qua `commit()` trong `lib/server/zmkt.ts`. Hàm này từ chối khi đang "Dừng mọi chi tiêu" hoặc vượt trần tháng. Không viết đường tắt nào ghi thẳng vào `ledger_entries`. Trigger `check_commit` trong cơ sở dữ liệu lặp lại hai cửa này.
- Trần tính theo tháng dương lịch, giờ Việt Nam.
- Sổ `ledger_entries` chỉ thêm. Đổi quyết định thì ghi một dòng `release`, không sửa và không xoá dòng cũ.
- Chat không được đổi tiền. Chỉ nút duyệt của người dùng (`POST /api/decisions`) mới đổi được, và chỉ vai `owner` hoặc `approver`.
- Bộ giả lập không ghi khoản chi làm vượt trần.
- Đơn hàng nhập từ file không phải tiền quảng cáo: `lib/server/orders.ts` không ghi vào `ledger_entries`.
- Mọi thao tác trên kênh quảng cáo đi qua `lib/server/adsops.ts` và để lại một dòng `ad_commands`. Lệnh tăng tiền phải có lần duyệt đứng sau.

### Cơ sở dữ liệu

- Schema đang chạy là `db/schema.sql` (v3, bước 4 trên 5). Đích đến là `db/schema.v3.proposed.sql`, đã được duyệt (ADR-0002). Tiến độ từng bước ở `docs/database.md` mục 10.
- Đổi schema thì tăng `SCHEMA_VERSION` trong `lib/server/db.ts`. PGlite sẽ xoá và dựng lại dữ liệu.
- Mọi truy vấn dùng tham số (`$1`, `$2`), không nối chuỗi. Mọi truy vấn theo thương hiệu phải lọc `brand_id`.

### Đăng nhập và quyền

- Route cần đăng nhập bọc bằng `withUser`, route theo thương hiệu bọc bằng `withBrand` (`lib/server/http.ts`). Không viết route đọc cookie trực tiếp.
- Mật khẩu băm scrypt. Cơ sở dữ liệu chỉ giữ SHA-256 của token phiên.
- Không in, không ghi log `ANTHROPIC_API_KEY` hay nội dung `.env.local`.

### Mã nguồn

- Thân request kiểm bằng zod trước khi dùng.
- Lỗi nghiệp vụ ném `ZError` kèm câu tiếng Việt cho người dùng, API trả 409.
- Mã chỉ chạy ở máy chủ nằm trong `lib/server/` và có `import "server-only"`.
- Chữ trên giao diện là tiếng Việt, xưng "mình", gọi "bạn". Không dùng markdown trong câu trả lời của chat.

### Giao diện

- Theo `DESIGN.md`: nền xám, khung trắng bo tròn, navy là màu chính, cam chỉ dành cho việc đang chờ người dùng.
- Một phông Archivo, chữ thân 16px. Màu và bo góc lấy từ token, không viết màu rời.

## Cấu trúc thư mục

```
app/
  (app)/            # Màn hình sau đăng nhập: ho-so, ket-noi, tiem-nang, chien-luoc, trien-khai
  api/              # auth, brands, state, decisions, halt, channels, chat, sim, demo, orders/import
  dang-nhap/        # Đăng nhập, đăng ký
  chon-thuong-hieu/ # Chọn hoặc thêm thương hiệu
  globals.css       # Token và toàn bộ CSS
components/         # TopBar, Chat, Decisions, NewBrand, Icon
lib/
  server/           # db, auth, http, zmkt (nghiệp vụ), adsops (lệnh quảng cáo), review (tổng kết chạy thử), orders (nhập đơn từ file), brandview, campaignview, sample, ads (giả lập Meta), agent (chat)
  store.tsx         # Trạng thái phía client
  types.ts          # Kiểu dùng chung
  data.ts           # Lịch tuần và hàm định dạng cho giao diện
db/                 # schema.sql (đang chạy), schema.v3.proposed.sql (đề xuất)
docs/               # CODEMAPS, adr, database.md, CONTRIBUTING, ENV, RUNBOOK
.claude/            # Quy tắc, agent, lệnh, skill lấy từ ECC
```

## Lệnh

```bash
npm run dev        # http://localhost:3210
npm run typecheck  # tsc --noEmit
npm run build
```

Tài khoản thử: `test@zmkt.vn` / `zmkt12345`. Biến môi trường ở `docs/ENV.md`.

## Quy trình làm việc với ECC

| Việc | Dùng |
|---|---|
| Lên kế hoạch tính năng | `/plan`, agent `planner` |
| Viết yêu cầu sản phẩm | `/plan-prd` |
| Làm tính năng từ đầu đến cuối | `/feature-dev` |
| Rà mã sau khi viết | `/code-review`, agent `typescript-reviewer`, `react-reviewer` |
| Đổi schema hoặc viết SQL | agent `database-reviewer`, skill `postgres-patterns`, `database-migrations` |
| Đụng tới đăng nhập, tiền, khoá bí mật | agent `security-reviewer`, skill `security-review` |
| Build hoặc typecheck lỗi | `/build-fix` |
| Sau khi đổi cấu trúc mã | `/update-codemaps`, `/update-docs` |
| Ghi một quyết định kiến trúc | skill `architecture-decision-records`, lưu ở `docs/adr/` |

Quy tắc ECC nằm ở `.claude/rules/ecc/` (common, typescript, react, web). Khi quy tắc ECC trái với mục "Quy tắc bắt buộc" ở trên thì theo file này.

## Chỗ còn thiếu

- Chưa có bộ test trong dự án. `npm test` chưa tồn tại, nên yêu cầu độ phủ 80% của ECC chưa áp được.
- Chưa gọi Meta Marketing API thật, mới có bộ giả lập sau giao diện `AdsChannel`.
- Thương hiệu mới (không phải mẫu) mới chỉ có màn trống: Z.MKT chưa tự đọc shop để dựng hồ sơ, nhóm khách, chiến lược, chiến dịch.
- Dự án chưa là kho git.
