<!-- Generated: 2026-11-13 | Files scanned: 4 | Token estimate: ~300 -->
# Phụ thuộc

## Thư viện chạy
next 15.5, react 19, react-dom 19
@electric-sql/pglite   Postgres nhúng, khai báo ở serverExternalPackages (next.config.ts)
postgres               chỉ dùng khi đặt DATABASE_URL
zod                    kiểm thân request
@anthropic-ai/sdk      chat
server-only            chặn nhập mã máy chủ vào client

## Dịch vụ ngoài
Claude API        chat; không có khoá thì chat trả lời rằng chưa nối AI
Claude Code CLI   thay cho API khi ZMKT_AI=claude-code (chỉ để thử trên máy cá nhân)
Google Fonts      Archivo qua next/font
Meta Ads          chưa nối; đang dùng Simulator

## Công cụ phát triển
typescript 5.6
ECC (.claude/): quy tắc, agent, lệnh, skill. Xem CLAUDE.md
