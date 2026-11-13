# Hướng dẫn phát triển

## Cài đặt

Cần Node.js 20 trở lên. Không cần Docker.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở http://localhost:3210, đăng nhập `test@zmkt.vn` / `zmkt12345`.

## Lệnh

<!-- AUTO-GENERATED: từ package.json -->
| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy máy chủ phát triển ở cổng 3210 |
| `npm run build` | Build bản production |
| `npm run start` | Chạy bản đã build ở cổng 3210 |
| `npm run typecheck` | Kiểm kiểu bằng `tsc --noEmit` |
<!-- /AUTO-GENERATED -->

## Kiểm thử

Dự án chưa có bộ test. Trước khi báo xong một thay đổi:

1. `npm run typecheck` phải sạch.
2. Mở màn hình liên quan trên trình duyệt và thử đúng thao tác vừa đổi.
3. Thay đổi đụng tới tiền thì thử cả ba trường hợp: duyệt bình thường, duyệt khi đang dừng chi, duyệt vượt trần.

Khi thêm test, theo skill `tdd-workflow` và `e2e-testing` trong `.claude/skills/`.

## Quy ước mã

Quy tắc dự án ở `CLAUDE.md`. Quy tắc chung của ECC ở `.claude/rules/ecc/`. Hai bên trái nhau thì theo `CLAUDE.md`.

## Trước khi gửi thay đổi

- [ ] `npm run typecheck` sạch
- [ ] Không có khoá bí mật trong mã hay log
- [ ] Route mới đã bọc `withUser` hoặc `withBrand` và kiểm thân bằng zod
- [ ] Đổi schema thì đã tăng `SCHEMA_VERSION` và cập nhật `docs/CODEMAPS/data.md`
- [ ] Đổi cấu trúc mã thì đã chạy `/update-codemaps`
- [ ] Quyết định kiến trúc mới đã ghi vào `docs/adr/`
