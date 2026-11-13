# Biến môi trường

Nguồn: `.env.example`. Sao thành `.env.local` rồi điền. `.env.local` không đưa vào git.

<!-- AUTO-GENERATED: từ .env.example và process.env trong lib/ -->
| Biến | Bắt buộc | Ý nghĩa | Ví dụ |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Không | Khoá Claude API cho chat. Thiếu thì chat báo chưa nối AI. | `sk-ant-...` |
| `ZMKT_MODEL` | Không | Mô hình cho chat. Mặc định `claude-opus-5-5`. | `claude-opus-5-5` |
| `ZMKT_AI` | Không | Đặt `claude-code` để chat dùng gói Claude qua Claude Code trên máy này. Chỉ để thử. | `claude-code` |
| `ZMKT_CLI_MODEL` | Không | Mô hình khi dùng Claude Code. | `sonnet` |
| `ZMKT_CLAUDE_BIN` | Không | Đường dẫn lệnh `claude` nếu không nằm trong PATH. | `/usr/local/bin/claude` |
| `DATABASE_URL` | Không | Đặt thì dùng Postgres thật. Không đặt thì dùng PGlite. | `postgres://postgres:postgres@127.0.0.1:54322/postgres` |
| `PGLITE_DIR` | Không | Thư mục dữ liệu PGlite. Mặc định `.data/pg`. | `.data/pg` |
| `ADS_MODE` | Không | `simulator` (mặc định) hoặc `meta` (chưa viết phần gọi API). | `simulator` |
<!-- /AUTO-GENERATED -->

Bản demo local chỉ cần một trong hai: `ANTHROPIC_API_KEY`, hoặc `ZMKT_AI=claude-code`.
