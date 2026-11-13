// Lịch tuần của màn kế hoạch và các hàm định dạng dùng chung ở giao diện.

export const WEEKS = [
  { id: "T41", from: "5/10" }, { id: "T42", from: "12/10" }, { id: "T43", from: "19/10" }, { id: "T44", from: "26/10" },
  { id: "T45", from: "2/11" }, { id: "T46", from: "9/11" }, { id: "T47", from: "16/11" }, { id: "T48", from: "23/11" },
];
export const CAP_WEEK = 7.5;

const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
/** '2026-10-05' → 'T2' */
export const weekday = (iso: string) => WD[new Date(`${iso}T00:00:00Z`).getUTCDay()];

// Hồ sơ, sản phẩm, nhóm khách, chiến lược, chiến dịch và số liệu giờ nằm trong cơ sở dữ liệu.
// File này chỉ còn lịch tuần của màn kế hoạch và các hàm định dạng.

export const fmtTr = (n: number) => `${n.toLocaleString("vi-VN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} tr`;
export const fmtVnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} ₫`;
/** '2026-11-15' → '15/11' */
export const fmtDay = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}/${Number(m)}`; };
/** Chi phí mỗi đơn, làm tròn nghìn ₫. */
export const perOrder = (c: { spentVnd: number; orders: number }) => (c.orders ? Math.round(c.spentVnd / c.orders / 1000) * 1000 : 0);
export const TR = 1_000_000;

// Tiền mỗi tuần của nhóm ưu tiên 1. Một nguồn duy nhất cho Triển khai và Chiến lược.
// a = đã chi (số thật, gộp từ số liệu ngày), ok = đã duyệt, w = chờ bạn quyết (triệu ₫)
export type WeekMoney = { a: number; ok: number; w: number };
const FIRST_WEEK = Date.UTC(2026, 9, 5);
/** Gộp chi tiêu theo ngày của các chiến dịch thành từng tuần của lịch WEEKS, tính bằng triệu ₫. */
export function spentByWeek(campaigns: { days: { day: string; spendVnd: number }[] }[]): number[] {
  const out = WEEKS.map(() => 0);
  for (const c of campaigns) for (const d of c.days) {
    const i = Math.floor((Date.parse(`${d.day}T00:00:00Z`) - FIRST_WEEK) / (7 * 86_400_000));
    if (i >= 0 && i < out.length) out[i] += d.spendVnd / TR;
  }
  return out;
}
export function youngWeeks(phase: "before" | "running" | "after", expand: "pending" | "approved" | "extend" | "stopped", spent: number[]): WeekMoney[] {
  return WEEKS.map((_, i) => {
    const c: WeekMoney = { a: 0, ok: 0, w: 0 };
    if (i < 2) {
      if (phase === "before") c.w = 2.5; else if (phase === "running") c.ok = 2.5; else c.a = spent[i] ?? 0;
      return c;
    }
    if (phase !== "after") return c;
    if (expand === "pending") c.w = 3.75;
    if (expand === "approved") c.ok = 3.75;
    if (expand === "extend" && i < 4) c.ok = 2.5;
    return c;
  });
}
