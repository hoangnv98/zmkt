---
name: Z.MKT
description: Hai tấm bo tròn trên nền xám ấm; tấm trắng để làm việc và duyệt tiền, tấm xám nhạt để trò chuyện với Z.MKT.
colors:
  ground: "#e8e7e3"
  panel: "#ffffff"
  chatbg: "#f3f2ef"
  soft: "#f7f6f3"
  soft-2: "#ecebe7"
  line: "#e3e1dc"
  line-2: "#d6d3cc"
  ink: "#1a2130"
  ink-2: "#5b6372"
  ink-3: "#80868f"
  navy: "#1e3a6b"
  navy-2: "#2a4d86"
  navy-l: "#e4ebf6"
  blue: "#1a73e8"
  blue-d: "#1558b8"
  blue-l: "#e3eefc"
  grey-bar: "#9aa1ac"
  orange: "#e9a13b"
  orange-l: "#fdf5e7"
  orange-line: "#ebc887"
  orange-d: "#8a5300"
  step-apricot: "#f6c27c"
  green-l: "#cdeeb4"
  green-d: "#2d6a14"
  ok: "#1e7a45"
  bad: "#b03232"
typography:
  display:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 800
  numeral-lg:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.15
    fontFeature: "tnum"
  logo:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    letterSpacing: "-0.01em"
  statement:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.3
  title:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
  page-title:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    letterSpacing: "0.07em"
  section-title:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    letterSpacing: "0.06em"
  sheet-title:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 800
    letterSpacing: "0.06em"
  body:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-chat:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  numeral:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    fontFeature: "tnum"
  button:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  button-sm:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
  nav:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  label:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 700
  badge:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  micro:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 700
rounded:
  panel: "16px"
  bubble: "14px"
  card: "12px"
  field: "10px"
  control: "9px"
  inner: "8px"
  tab: "7px"
  pill: "999px"
spacing:
  shell: "12px"
  gutter: "24px"
  block: "16px"
  section: "24px"
  cell-y: "12px"
  cell-x: "14px"
  chat: "384px"
components:
  panel-work:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "8px 24px 28px"
  panel-chat:
    backgroundColor: "{colors.chatbg}"
    rounded: "{rounded.panel}"
    width: "{spacing.chat}"
    padding: "16px 16px 14px"
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.panel}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.navy-2}"
  button-ghost:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-sm:
    typography: "{typography.button-sm}"
    rounded: "{rounded.control}"
    padding: "5px 12px"
  button-disabled:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink-3}"
  top-button:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
  top-button-halted:
    backgroundColor: "{colors.bad}"
    textColor: "{colors.panel}"
  stepper:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    typography: "{typography.nav}"
    rounded: "{rounded.pill}"
    padding: "4px"
  stepper-active:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.panel}"
    rounded: "{rounded.pill}"
    padding: "6px 16px 6px 6px"
  stepper-active-number:
    backgroundColor: "{colors.step-apricot}"
    rounded: "{rounded.pill}"
    size: "24px"
  wait-chip:
    backgroundColor: "{colors.orange-l}"
    textColor: "{colors.orange-d}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  tabs:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.field}"
    padding: "3px"
  tabs-item:
    rounded: "{rounded.tab}"
    padding: "5px 13px"
  tabs-active:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  pill-full:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.panel}"
    typography: "{typography.badge}"
    rounded: "{rounded.pill}"
    padding: "3px 11px"
  pill-read:
    backgroundColor: "{colors.blue-l}"
    textColor: "{colors.blue-d}"
    typography: "{typography.badge}"
    rounded: "{rounded.pill}"
    padding: "3px 11px"
  pill-link:
    backgroundColor: "{colors.soft-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.badge}"
    rounded: "{rounded.pill}"
    padding: "3px 11px"
  pill-rec:
    backgroundColor: "{colors.green-l}"
    textColor: "{colors.green-d}"
    typography: "{typography.badge}"
    rounded: "{rounded.pill}"
    padding: "3px 11px"
  count:
    backgroundColor: "{colors.navy-l}"
    textColor: "{colors.navy}"
    typography: "{typography.micro}"
    rounded: "{rounded.pill}"
    padding: "1px 8px"
  count-wait:
    backgroundColor: "{colors.orange}"
  sheet:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.card}"
  sheet-wait:
    backgroundColor: "{colors.orange-l}"
    rounded: "{rounded.card}"
  grid-header:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "10px 14px"
  grid-cell:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "12px 14px"
  grid-group:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.navy}"
    padding: "8px 14px"
  grid-row-wait:
    backgroundColor: "{colors.orange-l}"
  decide-card:
    backgroundColor: "{colors.orange-l}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  notice:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "12px 16px"
  empty:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.card}"
    padding: "32px 20px"
  banner:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.panel}"
    rounded: "{rounded.card}"
    padding: "16px 18px 14px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px 13px"
  flight-done:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.panel}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "32px"
    padding: "0 12px"
  flight-approved:
    backgroundColor: "{colors.navy-l}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    height: "32px"
  flight-plan-ok:
    backgroundColor: "{colors.navy-l}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    height: "32px"
  flight-plan-wait:
    backgroundColor: "{colors.orange-l}"
    textColor: "{colors.orange-d}"
    rounded: "{rounded.pill}"
    height: "32px"
  flight-off:
    backgroundColor: "{colors.grey-bar}"
    textColor: "{colors.panel}"
    rounded: "{rounded.pill}"
    height: "32px"
  chat-avatar:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.panel}"
    size: "24px"
  chat-bubble:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.body-chat}"
    rounded: "{rounded.bubble}"
    padding: "10px 14px"
  chat-bubble-me:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.panel}"
  chat-ask:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.bubble}"
    padding: "6px 6px 6px 8px"
  send-button:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.panel}"
    rounded: "{rounded.pill}"
    size: "38px"
  send-button-hover:
    backgroundColor: "{colors.blue-d}"
---

# Design System: Z.MKT

## Overview

**Creative North Star: "Hai tấm trên bàn"**

Z.MKT là hai tấm bo tròn đặt cạnh nhau trên một mặt bàn xám ấm (`ground`). Tấm trắng bên trái (`panel`) là chỗ làm việc: hồ sơ thương hiệu, kết nối, chiến lược, kế hoạch tuần và mọi khoản tiền cần duyệt. Tấm xám nhạt bên phải (`chatbg`) là cuộc trò chuyện với Z.MKT. Người dùng luôn thấy cả hai: thứ Z.MKT đang làm và thứ Z.MKT đang nói.

Hệ thống này thay cho hướng "tờ flight plan" trước đó (thanh trên màu đá phiến, tờ kẻ góc vuông, Barlow và Barlow Semi Condensed). Người dùng đã từ chối hướng đó vì chữ quá nhỏ và trông như máy làm, rồi đưa ảnh tham chiếu của riêng họ. Bản dựng hiện tại đi theo ảnh đó: một họ chữ Archivo, chữ thân 16px, góc bo rõ, viên thuốc cho mọi nhãn trạng thái, tiêu đề chữ hoa màu navy giãn chữ.

Màu vẫn mang nghĩa về tiền và về việc. Navy là tiền đã chi và thứ đã cam kết; sọc chéo viền đứt là kế hoạch chưa hỏi; vàng cam là thứ đang chờ bạn; đỏ là vạch trần, thứ vượt tiêu chí và lệnh dừng chi; xanh lá là thứ đạt tiêu chí. Ngoài các nghĩa đó, giao diện gần như chỉ có trắng, xám ấm và navy.

**Key Characteristics:**
- Hai tấm bo 16px trên nền xám ấm, cách nhau và cách mép 12px; chat rộng 384px bên phải.
- Một họ chữ Archivo cho mọi thứ; chữ thân 16px, không có chữ nào dưới 12px.
- Tiêu đề trang và tiêu đề mục là chữ hoa navy đậm 800, giãn chữ 0.06 đến 0.07em.
- Mọi nhãn trạng thái là viên thuốc bo 999px; bốn mức quyền kết nối có bốn màu cố định.
- Thanh bước dạng viên thuốc, bước hiện tại nền navy với số trong vòng tròn màu mơ.
- Việc chờ bạn là thẻ vàng nhạt viền đứt; cam chỉ xuất hiện khi có việc chờ.
- Lưới kế hoạch tuần vẫn là nơi đọc tiền theo thời gian, nay với thanh bo tròn hoàn toàn.

## Colors

Bảng màu ấm và ít: xám ấm làm nền, trắng làm tấm, navy làm giọng chính, một xanh dương cho hành động trong chat và ô nhập, vàng cam cho việc chờ bạn, đỏ và xanh lá để phán.

### Primary
- **Navy** (`navy`): màu chính của hệ thống. Nút chính, tab bước hiện tại, tiêu đề trang và tiêu đề mục, chữ số trong hàng nhóm, viên thuốc "Toàn quyền", ô chữ "Z" của Z.MKT, nền dải tiến độ kết nối, nền vùng bôi chọn. Trên lưới tiền: thanh và cột đã chi.
- **Navy sáng** (`navy-2`): hover của nút chính; viền liền của thanh đã duyệt và viền đứt của thanh kế hoạch.
- **Navy nhạt** (`navy-l`): nền thanh đã duyệt và sọc của thanh kế hoạch, nền tiêu đề cột tuần hiện tại, nền thẻ đếm và nhãn tiêu đề thẻ trong chat.

### Secondary
- **Xanh hành động** (`blue`): bong bóng chat của người dùng, nút gửi tròn, viền ô nhập khi focus, vòng focus bàn phím, con trỏ nhập.
- **Xanh đậm** (`blue-d`): chữ liên kết trong dòng, chữ viên thuốc "Đọc dữ liệu", hover của nút gửi, chữ ngày Chủ nhật trên biểu đồ ngày.
- **Xanh nhạt** (`blue-l`): nền viên thuốc "Đọc dữ liệu" và quầng focus 3px của ô nhập.

### Tertiary
- **Cam chờ** (`orange`): nền thẻ đếm khi có việc chờ, viền đứt của thanh tuần và cột tiền chờ bạn, vòng focus của thẻ quyết định.
- **Vàng nhạt** (`orange-l`): nền thẻ quyết định, nhãn chờ trên thanh trên, hàng bảng đang chờ, thẻ kết quả trong chat khi còn chờ, nhóm kết nối được đề xuất.
- **Viền vàng** (`orange-line`): viền đứt 1.5px của thẻ quyết định và thẻ chờ, viền của nhãn chờ.
- **Nâu cam** (`orange-d`): chữ trên nền vàng nhạt.
- **Mơ bước** (`step-apricot`): chỉ nền và viền vòng tròn số của bước hiện tại, chữ số nâu đậm. Đây là chi tiết lấy từ ảnh tham chiếu của người dùng; nó không mang nghĩa "chờ bạn".
- **Xanh lá đạt** (`ok`): số và kết luận đạt tiêu chí, trạng thái đã xong hoặc đã duyệt.
- **Đỏ trần** (`bad`): vạch trần nét đứt và nhãn của nó, số và kết luận vượt tiêu chí, dòng báo lỗi dưới ô nhập, chữ nút "Dừng mọi chi tiêu" và nền của nút đó khi đang dừng.
- **Lá non** (`green-l`) và **Lá đậm** (`green-d`): nền và chữ viên thuốc "Nên kết nối".
- **Xám đã dừng** (`grey-bar`): thanh tuần và cột ngày của chiến dịch không đạt đã dừng, phần phụ của thanh chia ngân sách.

### Neutral
- **Nền bàn** (`ground`): nền trang, lộ ra quanh và giữa hai tấm.
- **Tấm trắng** (`panel`): tấm làm việc, thẻ, bảng, bong bóng của Z.MKT, ô nhập.
- **Tấm chat** (`chatbg`): tấm trò chuyện và cột bên phải của trang đăng nhập.
- **Nền mềm** (`soft`): hàng tiêu đề cột, hàng nhóm, cột nhãn của bảng định nghĩa, nền nhóm tab và thanh bước, thông báo, khối rỗng.
- **Xám đá** (`soft-2`): nền viên thuốc "Chỉ link", hover của bước, rãnh thanh mức độ. Trong CSS đây vẫn là giá trị viết thẳng, chưa có custom property.
- **Nét kẻ** (`line`) và **nét đậm** (`line-2`): viền thẻ, bảng và nét ngăn ô dùng `line`; viền nút phụ, ô nhập, ô hỏi và đường kẻ dưới đầu chat dùng `line-2`.
- **Mực** (`ink`), **mực phụ** (`ink-2`), **mực mờ** (`ink-3`): chữ chính; dòng phụ, nhãn cột, chú thích; chữ bị khóa, số thứ tự, placeholder.

### Named Rules
**Quy tắc Cam Chờ Quyết.** Cam và vàng nhạt chỉ xuất hiện ở thứ đang chờ người dùng quyết hoặc làm: nhãn chờ, thẻ đếm chờ, thẻ quyết định, hàng bảng chờ, thanh tuần chờ, cột tiền chờ, nhóm kết nối được đề xuất. Không có việc chờ thì màn hình không có cam. Vòng số mơ của bước hiện tại là ngoại lệ duy nhất đã được người dùng chọn và dùng màu riêng (`step-apricot`), không dùng `orange`.

**Quy tắc Chất Liệu Của Tiền.** Trên lưới tuần, một khoản tiền có đúng một chất liệu. Nền navy liền: đã chạy, đã chi. Nền navy nhạt viền liền 1.5px `navy-2`: đã duyệt, chưa chi. Sọc chéo 135 độ navy nhạt và trắng, viền đứt 1.5px `navy-2`: kế hoạch, chưa hỏi người dùng. Nền vàng nhạt viền đứt 1.5px `orange`: đang chờ người dùng. Nền `grey-bar` liền: đã chạy nhưng không đạt, đã dừng. Viền liền là đã cam kết; viền đứt là chưa.

**Quy tắc Đỏ Và Xanh Lá.** `bad` thuộc về vạch trần, thứ vượt tiêu chí, lỗi nhập và lệnh dừng chi. `ok` thuộc về thứ đạt tiêu chí và việc đã xong. Cả hai tô chữ, số, biểu tượng và nét kẻ; khối nền đỏ duy nhất là nút dừng chi khi đang dừng. Viên thuốc "Nên kết nối" dùng cặp lá non riêng (`green-l`, `green-d`), không dùng `ok`.

**Quy tắc Bốn Mức Quyền.** Quyền kết nối luôn là viên thuốc với bốn màu cố định: Toàn quyền nền `navy` chữ trắng; Đọc dữ liệu nền `blue-l` chữ `blue-d`; Chỉ link nền `soft-2` chữ `ink-2`; Nên kết nối nền `green-l` chữ `green-d`. Không thêm mức thứ năm bằng một màu mới.

## Typography

**Display Font:** Archivo (dự phòng Segoe UI, system-ui, sans-serif)
**Body Font:** Archivo, cùng họ
**Label/Mono Font:** Archivo; không có font mono, số dùng `tabular-nums`.

Archivo nạp qua `next/font` dạng biến, bộ ký tự latin và vietnamese, `display: swap`, có nạp trục độ rộng `wdth`.

**Character:** Một họ grotesque chắc, đọc rõ dấu tiếng Việt. Thứ bậc đến từ độ đậm (400, 600, 700, 800) và chữ hoa giãn chữ, không đến từ họ chữ thứ hai.

### Hierarchy
- **Display** (800, 34px, 1.15, -0.015em, navy): chỉ tiêu đề trang đăng nhập.
- **Headline** (800, 26px, navy): câu lớn ở cột phải trang đăng nhập.
- **Numeral lớn** (800, 24px, 1.15, số dạng bảng): các số tóm tắt cạnh tiêu đề trang, nhãn giải thích 14px nằm dưới.
- **Logo** (800, 22px, -0.01em, navy): chữ Z.MKT.
- **Statement** (800, 20px, 1.3, navy): câu chính trong bảng định nghĩa.
- **Title** (800, 17px, navy): tên trong đầu khung chat; dòng chính của dải tiến độ kết nối dùng 17px 700. Tên khối rỗng là 19px 800.
- **Page title** (800, 16px, chữ hoa, 0.07em, navy): tiêu đề mỗi trang, một cái một trang.
- **Section title** (800, 15px, chữ hoa, 0.06em, navy): tiêu đề mục trong trang.
- **Sheet title** (800, 13.5px, chữ hoa, 0.06em, navy): dải tên trên đầu thẻ; hàng nhóm của bảng và lưới tuần dùng cùng kiểu ở 13px.
- **Body** (400, 16px, 1.5): câu văn, nội dung ô, tên chiến dịch (700). Đoạn dẫn tối đa 70ch.
- **Body chat** (400, 15.5px): tin nhắn, ô hỏi, tên kết nối (700).
- **Body nhỏ** (400, 14px): dòng phụ dưới tên, chú thích, nhãn số tóm tắt.
- **Numeral** (700, 16px, số dạng bảng, căn phải): số trong ô bảng và lưới tuần.
- **Button** (700, 15px; cỡ nhỏ 14px): nhãn nút. Thanh bước dùng 600 15px; tab dùng 600 14.5px.
- **Label** (700, 13.5px): nhãn cột, nhãn thanh tuần, nhãn trên thanh chia ngân sách.
- **Badge** (700, 13px): viên thuốc quyền và số trong vòng tròn bước.
- **Micro** (700, 12.5px): thẻ đếm, nhãn tiêu đề thẻ trong chat, nhãn vạch trần. Thẻ phiên bản dùng 600 12.5px.

### Named Rules
**Quy tắc Một Họ Chữ.** Mọi chữ là Archivo. Không thêm họ chữ thứ hai cho tiêu đề, số hay nhãn.

**Quy tắc Tiêu Đề Chữ Hoa Navy.** Tiêu đề trang, tiêu đề mục, dải tên thẻ và hàng nhóm là chữ hoa, 800, giãn chữ 0.06 đến 0.07em, màu `navy`, cỡ từ 13 đến 16px. Câu văn và tên riêng không bao giờ viết hoa toàn bộ.

**Quy tắc Số Là Bảng.** Mọi con số tiền, đơn, phần trăm dùng `font-variant-numeric: tabular-nums` và căn phải trong cột. Số không đứng một mình: đơn vị đi liền (₫, tr, đơn) và tiêu chí hoặc trần nằm ở dòng nhỏ ngay dưới hoặc ở cột bên cạnh.

**Quy tắc Sàn 12px.** Không có chữ nào nhỏ hơn 12px. Chữ đọc nhỏ nhất là 12.5px; 12px chỉ dành cho chữ cái viết tắt trong ô avatar.

## Layout

Khung ứng dụng là lưới hai cột cao đúng `100dvh` với đệm và khe 12px: tấm làm việc co giãn bên trái, tấm chat 384px bên phải. Trong tấm làm việc, thanh trên (đệm 16px 24px 12px) nằm trên cùng và không cuộn; vùng làm việc bên dưới tự cuộn với đệm 8px 24px 28px. Thanh trên chứa, từ trái sang: nút chọn thương hiệu, nhóm giữa (nhãn chờ, dòng "đã chi / trần", nút dừng chi tiêu), thanh bước đẩy sang phải.

Mỗi trang mở bằng một hàng đầu trang: tiêu đề chữ hoa, tab, và nhóm bên phải (tab con hoặc số tóm tắt) trên cùng một dòng, cách khối dưới 16px. Các thẻ xếp chồng cách nhau 12px; thẻ quyết định và thông báo cách khối trên 16px; tiêu đề mục cách trên 24px, cách dưới 10px. Bố cục hai cột trong trang dùng tỉ lệ 1.4 : 1 với khe 14px; trang kết nối dùng hai cột bằng nhau với khe 12px.

Nhịp ô: ô bảng đệm 12px 14px, hàng tiêu đề cột 10px 14px. Lưới tuần có cột tên 206px, tám cột tuần tối thiểu 56px, rồi ba cột số (64, 84, 112px) hoặc một cột ghi chú 260px; ô cao tối thiểu 58px, thanh tuần cao 32px; chiều rộng tối thiểu 930px, cuộn ngang trong khung riêng. Hàng ngân sách bên dưới dùng đúng lưới cột đó, cột tiền cao 100px với 7px mỗi triệu.

Trang đăng nhập dùng cùng ngữ pháp hai tấm: tấm form trắng 380 đến 500px bên trái, tấm `chatbg` bên phải. Trang chọn thương hiệu là một cột tối đa 900px.

Thay đổi theo chiều rộng:
- Dưới 1540px: ẩn dòng "đã chi / trần" trên thanh trên.
- Dưới 1100px: tấm chat thành ngăn trượt từ phải (0.25s), mở bằng nút Chat; bố cục hai cột trong trang thành một cột.
- Dưới 760px: bỏ đệm và khe của khung, tấm làm việc mất góc bo; thanh bước xuống hàng riêng, chỉ bước hiện tại hiện tên; cột tên của lưới tuần còn 150px và dính bên trái; bảng định nghĩa còn hai cột; trang đăng nhập thành một cột.

## Elevation & Depth

Gần như phẳng. Chiều sâu đến từ tông nền: hai tấm (`panel`, `chatbg`) nằm trên `ground`, thẻ nằm trong tấm bằng viền 1px `line`, các dải nhãn hạ xuống `soft`. Bóng đổ chỉ xuất hiện ở bốn chỗ có lý do chức năng: tab đang chọn được nhấc nhẹ khỏi nhóm tab, ô nhập khi focus có quầng 3px `blue-l`, ngăn chat trượt ở màn hình hẹp có bóng để tách khỏi tấm làm việc, và cột tên dính bên trái dùng bóng 1px thay nét kẻ.

### Shadow Vocabulary
- **Tab nhấc** (`box-shadow: 0 1px 2px rgba(26, 33, 48, 0.12), 0 0 0 1px var(--line)`): mục tab hoặc nút chọn cách xem đang chọn.
- **Quầng focus** (`box-shadow: 0 0 0 3px var(--blue-l)`): ô nhập của form khi focus.
- **Ngăn chat** (`box-shadow: 0 12px 40px rgba(26, 33, 48, 0.22)`): chỉ khi chat là ngăn trượt dưới 1100px.
- **Nét dính** (`box-shadow: 1px 0 0 var(--line)`): cột tên dính bên trái của lưới tuần dưới 760px.

### Named Rules
**Quy tắc Tấm Trên Nền.** Tách hai thứ bằng tông nền hoặc một nét 1px, không bằng bóng. Bóng chỉ dùng cho trạng thái (tab đang chọn, focus) hoặc cho lớp nổi thật (ngăn chat trượt).

## Shapes

Góc bo theo cỡ: vật càng lớn góc càng lớn. Hai tấm 16px. Bong bóng chat, thẻ trong chat và ô hỏi 14px. Thẻ, bảng, lưới tuần, thẻ quyết định, thông báo, khối rỗng và dải tiến độ 12px. Ô nhập form, nhóm tab và nút chọn thương hiệu 10px. Nút 9px. Ô vuông biểu tượng và nút đính kèm 8px; mục tab và ô chữ của nút chọn thương hiệu 7px; ô "Z" trong dòng chat 6px; đầu cột biểu đồ ngày 4px; ô chú giải 2px. Viên thuốc 999px cho nhãn trạng thái, thẻ đếm, thẻ phiên bản, thanh bước, nút trên thanh trên, thanh tuần, thanh chia ngân sách và thanh mức độ. Vòng tròn 50% cho số bước, biểu tượng kết nối và nút gửi.

Nét liền là đã cam kết, nét đứt là chưa hoặc đang chờ: thanh kế hoạch, thanh chờ, cột tiền chờ, vạch trần, thẻ quyết định và khối rỗng đều dùng nét đứt 1.5px. Sọc chéo 135 độ (bước 6px trên thanh tuần, 4px trên cột ngân sách) là họa tiết duy nhất và chỉ mang nghĩa "kế hoạch chưa hỏi".

Biểu tượng là nét vẽ 1.8px đầu tròn trên khung 16px, hiển thị ở 12 đến 16px, luôn đi kèm chữ hoặc nhãn cho trình đọc màn hình.

### Named Rules
**Quy tắc Bán Kính Theo Cỡ.** Dùng đúng bậc của thang: 16px tấm, 14px bong bóng, 12px thẻ, 10px ô nhập, 9px nút, 999px viên thuốc. Không có góc vuông ở thứ người dùng nhìn thấy như một khối.

## Components

### Buttons
Chắc, đậm, bo vừa; nút là chữ trắng trên khối navy.
- **Shape:** góc 9px, viền 1px, đệm 8px 16px; cỡ nhỏ 5px 12px chữ 14px.
- **Primary:** nền `navy`, chữ trắng 700 15px. Hành động đồng ý hoặc đi tiếp, mỗi nhóm nút một cái, đứng cuối.
- **Ghost:** nền `panel`, chữ `ink`, viền `line-2`. Các lựa chọn còn lại (Dừng hẳn, Thử thêm, Chưa chạy, Kết nối).
- **Hover / Focus:** primary đổi nền sang `navy-2`, ghost đổi viền sang `ink-2`, trong 0.15s; focus bàn phím là viền ngoài 2px `blue` cách 2px.
- **Disabled:** nền `soft`, viền `line`, chữ `ink-3`; khi mọi chi tiêu đang dừng, nút duyệt chi bị khóa và có ghi chú lý do.
- **Nút trên thanh trên:** viên thuốc nền trắng viền `line-2`, chữ 600 14px. Nút "Dừng mọi chi tiêu" chữ `bad`; khi đang dừng thì nền `bad` chữ trắng.
- **Liên kết trong dòng:** chữ `blue-d` 600, gạch chân nhạt cách 3px, hover thì gạch chân theo màu chữ.

### Chips
- **Viên thuốc quyền:** 700 13px, đệm 3px 11px, bo 999px, không viền; bốn màu theo Quy tắc Bốn Mức Quyền. "Nên kết nối" là nút bấm được.
- **Nhãn chờ (thanh trên):** viên thuốc nền `orange-l`, chữ `orange-d` 700 14px, viền `orange-line`; liên kết dẫn tới việc đang chờ. Không có việc chờ thì thay bằng một dòng chữ `ink-3`.
- **Thẻ đếm:** 700 12.5px, nền `navy-l` chữ `navy`; khi có việc chờ thì nền `orange`.
- **Thẻ phiên bản:** 600 12.5px, nền `soft`, viền `line`, chữ `ink-2`; đánh dấu thứ chưa có ở bản này.
- **Nhãn trạng thái:** không nền; biểu tượng 14px cùng chữ 600 14px, màu `ok`, `bad`, `orange-d` hoặc `ink-2`.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** `panel` trên tấm làm việc; `soft` cho thông báo và khối rỗng; `orange-l` cho thứ chờ bạn.
- **Shadow Strategy:** không bóng, xem Elevation & Depth.
- **Border:** 1px `line`; thẻ chờ viền đứt 1.5px `orange-line`.
- **Internal Padding:** 12px 16px cho dải tên, 12px 14px cho ô.
- **Thẻ có dải tên:** dải tên chữ hoa navy 13.5px bên trái, ghi chú 13.5px `ink-2` bên phải.
- **Bảng lưới:** hàng tiêu đề nền `soft`, nhãn 700 13.5px `ink-2`; ô ngăn ngang bằng `line`; cột số căn phải bằng Numeral; dòng phụ 14px `ink-2` dưới tên. Hàng nhóm là dải `soft` chữ hoa navy. Hàng chờ có nền `orange-l`.
- **Bảng định nghĩa:** cột nhãn 180px nền `soft` chữ 700 14px `ink-2`, giá trị bên phải, tùy chọn cột hành động; dòng đầu dùng Statement.
- **Thông báo:** thẻ `soft` một dòng ghi lại quyết định đã xong, kèm liên kết "Đổi quyết định".
- **Khối rỗng:** nền `soft`, viền đứt 1.5px `line-2`, chữ giữa, tên 19px 800, một câu giải thích và một nút dẫn tới bước cần làm.
- **Dải tiến độ kết nối:** thẻ nền `navy`, chữ trắng, thanh tiến độ 7px bo 999px.

### Inputs / Fields
- **Style:** nhãn 700 14.5px phía trên, ô nền `panel`, viền 1px `line-2`, góc 10px, đệm 11px 13px.
- **Focus:** viền đổi sang `blue` kèm quầng 3px `blue-l`.
- **Error:** dòng chữ `bad` 14.5px ngay dưới ô, nói rõ cần sửa gì.

### Navigation
- **Thanh bước:** viên thuốc nền `soft` viền `line`, đệm 4px. Mỗi bước là viên thuốc con 600 15px với số 700 13px trong vòng tròn trắng 24px. Hover nền `soft-2`. Bước hiện tại nền `navy` chữ trắng, vòng số nền `step-apricot` chữ nâu đậm. Dưới 760px chỉ bước hiện tại hiện tên.
- **Tab:** nhóm nền `soft` viền `line`, góc 10px, đệm 3px; mục 600 14.5px chữ `ink-2`, góc 7px; mục đang chọn nền `panel` chữ `ink` với Tab nhấc; mục chưa có chữ `ink-3` kèm thẻ phiên bản.
- **Chọn thương hiệu:** nút viền `line-2` góc 10px, ô chữ viết tắt nền `navy` 28px góc 7px, tên 700 15px và ghi chú 500 14px.

### Lưới kế hoạch tuần (chữ ký)
- **Cấu trúc:** cột tên bên trái, tám cột tuần (mã tuần và ngày), các cột số hoặc cột điều kiện bên phải; cột tuần hiện tại có tiêu đề nền `navy-l` chữ `navy`; chiến dịch gom theo nhóm khách bằng hàng nhóm.
- **Thanh tuần:** viên thuốc cao 32px, nhãn 700 13.5px bên trong, trải qua số tuần nó chạy; chất liệu theo Quy tắc Chất Liệu Của Tiền. Thanh chờ là liên kết nhảy tới thẻ quyết định.
- **Chuyển trạng thái:** khi được duyệt, thanh vén ra từ trái sang phải trong 0.5s (`clip-path`, `cubic-bezier(0.16, 1, 0.3, 1)`).
- **Hàng ngân sách:** mỗi tuần một cột xếp chồng 7px mỗi triệu: đã chi, đã duyệt, chờ bạn, kế hoạch; vạch trần đứt 1.5px `bad` chạy ngang, có nhãn ở cột đầu.
- **Khi dừng mọi chi tiêu:** mọi thanh chưa chi chuyển xám và mờ 0.7.
- **Biến thể:** lộ trình ngân sách ở Chiến lược, lưới thu nhỏ sáu cột trên tấm phải của trang đăng nhập, biểu đồ 14 ngày ở chi tiết chiến dịch.

### Thẻ quyết định
- **Style:** nền `orange-l`, viền đứt 1.5px `orange-line`, góc 12px, đệm 14px 16px.
- **Nội dung:** câu hỏi 700 16.5px, dòng hệ quả 500 14.5px `orange-d`, rồi các nút: ghost cho lựa chọn từ chối và trung gian, primary cho đồng ý ở cuối.
- **Sau khi quyết:** thẻ biến thành Thông báo `soft`, vàng biến mất.

### Chat
- **Khung:** tấm `chatbg` góc 16px, đệm 16px; đầu khung có ô "Z" navy 38px góc 10px với chấm trạng thái xanh, tên 800 17px navy và dòng trạng thái 13.5px.
- **Bong bóng:** Z.MKT bên trái, ô "Z" navy 24px cạnh bong bóng nền `panel` viền `line` góc 14px; người dùng bên phải nền `blue` chữ trắng; mốc thời gian là chữ 13.5px `ink-2` ở giữa, không nền.
- **Thẻ trong chat:** nền `panel` góc 14px, nhãn tiêu đề viên thuốc `navy-l`; khi còn chờ thì thành thẻ vàng viền đứt với bộ nút cỡ nhỏ.
- **Ô hỏi:** khối trắng viền `line-2` góc 14px, nút đính kèm 32px bên trái, nút gửi tròn 38px nền `blue` bên phải; focus đổi viền sang `blue`.

## Do's and Don'ts

### Do:
- **Do** đặt nội dung trong hai tấm bo 16px trên nền `ground`, tấm trắng để làm việc và tấm `chatbg` để trò chuyện.
- **Do** viết tiêu đề trang và tiêu đề mục bằng chữ hoa navy 800 giãn chữ 0.06 đến 0.07em.
- **Do** giữ chữ thân 16px và mọi chữ bằng Archivo.
- **Do** dùng viên thuốc cho mọi nhãn trạng thái và quyền, với đúng bốn màu quyền.
- **Do** đặt mọi khoản tiền theo thời gian lên lưới tuần với đúng chất liệu của nó: navy liền là đã chi, nhạt viền liền là đã duyệt, sọc viền đứt là kế hoạch, vàng viền đứt là chờ bạn.
- **Do** để vàng cam chỉ cho việc chờ người dùng, và gỡ nó ngay khi việc đó được quyết.
- **Do** kẻ vạch trần `bad` nét đứt 1.5px ở mọi nơi có cột tiền theo tuần, kèm nhãn ghi số trần.
- **Do** giữ góc theo thang 16, 14, 12, 10, 9, 999px.
- **Do** để mỗi nhóm nút có một nút primary navy ở cuối, các lựa chọn còn lại là ghost.
- **Do** tôn trọng `prefers-reduced-motion`: bản dựng tắt mọi animation và transition khi người dùng yêu cầu.

### Don't:
- **Don't** quay lại hướng "tờ flight plan" đã bị từ chối: thanh trên màu đá phiến, tờ kẻ góc vuông, Barlow hay Barlow Semi Condensed, chữ thân 14px.
- **Don't** dùng chữ nhỏ hơn 12px hay thêm họ chữ thứ hai.
- **Don't** dùng cam hay vàng nhạt cho nhấn mạnh, cảnh báo chung, nhãn mới hay trang trí.
- **Don't** tô nền một khối bằng `ok` hay `bad`; ngoại lệ duy nhất là nút dừng chi khi đang dừng.
- **Don't** dùng sọc chéo làm họa tiết trang trí; sọc chỉ có nghĩa "kế hoạch chưa hỏi".
- **Don't** nâng thẻ bằng bóng đổ; tách bằng tông nền hoặc nét 1px.
- **Don't** để một con số đứng không có đơn vị hoặc không có tiêu chí để so.
