import "server-only";
import { db, type Db } from "./db";
import { ZError } from "./errors";
import type { Actor, OrderImport } from "@/lib/types";

// Nhập đơn hàng từ file CSV của sàn hoặc website. Đơn được ghép về chiến dịch bằng mã theo dõi.
// Nhập lại cùng một file không tạo đơn trùng: đơn đã có chỉ được cập nhật trạng thái và số tiền.
// Đơn hàng không phải tiền quảng cáo, nên phần này không đụng tới sổ ledger_entries.

export const MAX_ROWS = 5000;
export type ImportInput = { fileName: string; source: string; csv: string };
type Parsed = { external_id: string; ordered_at: string; amount_vnd: number; status: string; tracking_code: string | null };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const COLS = {
  id: ["ma_don", "ma_don_hang", "order_id", "id"],
  time: ["thoi_gian", "thoi_gian_dat_hang", "ngay_dat", "ngay_dat_hang", "ordered_at"],
  amount: ["so_tien", "tong_tien", "thanh_tien", "amount"],
  status: ["trang_thai", "trang_thai_don_hang", "status"],
  tracking: ["ma_theo_doi", "tracking_code", "utm_campaign", "link"],
} as const;
const COL_NAME = { id: "mã đơn (ma_don)", time: "thời gian (thoi_gian)", amount: "số tiền (so_tien)" };

/** Tách một file CSV thành các dòng, hiểu dấu ngoặc kép và ba kiểu ngăn cột: phẩy, chấm phẩy, tab. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const head = src.slice(0, src.search(/\r?\n|$/));
  const sep = [",", ";", "\t"].map((c) => [c, head.split(c).length] as const).sort((x, y) => y[1] - x[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

/** Giờ ghi trong file là giờ Việt Nam. Nhận '2026-10-19 09:15' và '19/10/2026 09:15', có hoặc không có giờ. */
function parseTime(raw: string): string | null {
  const s = raw.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
  const vn = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
  const p = iso ? [iso[1], iso[2], iso[3], iso[4], iso[5], iso[6]] : vn ? [vn[3], vn[2], vn[1], vn[4], vn[5], vn[6]] : null;
  if (!p) return null;
  const two = (x: string | undefined) => (x ?? "0").padStart(2, "0");
  const out = `${p[0]}-${two(p[1])}-${two(p[2])}T${two(p[3])}:${two(p[4])}:${two(p[5])}+07:00`;
  const t = new Date(out);
  // Ngày không có thật (31/02) bị Date đẩy sang tháng sau: so lại ngày theo giờ Việt Nam để bắt.
  if (Number.isNaN(t.getTime()) || new Date(t.getTime() + 7 * 3_600_000).getUTCDate() !== Number(p[2])) return null;
  return out;
}

function parseAmount(raw: string): number | null {
  const s = raw.replace(/[^\d.,]/g, "").replace(/[.,]\d{1,2}$/, "");
  const n = Number(s.replace(/[.,]/g, ""));
  return s && Number.isSafeInteger(n) ? n : null;
}

function parseStatus(raw: string): string {
  const s = norm(raw);
  if (!s || /hoan_thanh|da_giao|thanh_toan|paid|complete|delivered/.test(s)) return "paid";
  if (/huy|cancel/.test(s)) return "cancelled";
  if (/tra_hang|hoan_tien|hoan_hang|return|refund/.test(s)) return "returned";
  return "placed";
}

/** Cột mã theo dõi có thể là mã trần hoặc cả đường link có utm_campaign. */
function parseTracking(raw: string): string | null {
  const s = raw.trim();
  const m = /[?&](?:utm_campaign|ref)=([^&#\s]+)/.exec(s);
  const code = m ? decodeURIComponent(m[1]) : s;
  return code && code.length <= 120 ? code : null;
}

export function readOrders(csv: string): { rows: Parsed[]; total: number; skipped: number[] } {
  const table = parseCsv(csv);
  if (table.length < 2) throw new ZError(400, "File không có dòng đơn hàng nào. Dòng đầu là tên cột, các dòng sau là đơn.");
  const head = table[0].map(norm);
  const at = (k: keyof typeof COLS) => head.findIndex((h) => (COLS[k] as readonly string[]).includes(h));
  const ix = { id: at("id"), time: at("time"), amount: at("amount"), status: at("status"), tracking: at("tracking") };
  const missing = (["id", "time", "amount"] as const).filter((k) => ix[k] < 0).map((k) => COL_NAME[k]);
  if (missing.length) throw new ZError(400, `File thiếu cột ${missing.join(", ")}. Tải file mẫu để xem đúng tên cột.`);
  const body = table.slice(1);
  if (body.length > MAX_ROWS) throw new ZError(400, `File có ${body.length} dòng, mỗi lần chỉ nhập được ${MAX_ROWS} dòng. Chia nhỏ file rồi nhập tiếp.`);

  const byId = new Map<string, Parsed>();
  const skipped: number[] = [];
  body.forEach((r, i) => {
    const id = (r[ix.id] ?? "").trim(), time = parseTime(r[ix.time] ?? ""), amount = parseAmount(r[ix.amount] ?? "");
    if (!id || id.length > 120 || !time || amount === null) { skipped.push(i + 2); return; }
    // Một mã đơn xuất hiện hai lần trong file thì lấy dòng sau.
    byId.set(id, { external_id: id, ordered_at: time, amount_vnd: amount, status: parseStatus(ix.status < 0 ? "" : r[ix.status] ?? ""), tracking_code: ix.tracking < 0 ? null : parseTracking(r[ix.tracking] ?? "") });
  });
  return { rows: [...byId.values()], total: body.length, skipped };
}

const skippedNote = (lines: number[]) => (lines.length ? `Bỏ qua ${lines.length} dòng thiếu mã đơn, sai ngày hoặc sai số tiền: dòng ${lines.slice(0, 10).join(", ")}${lines.length > 10 ? "…" : ""}.` : null);

export async function importOrders(b: string, input: ImportInput, actor: Actor): Promise<void> {
  if (actor.role === "viewer") throw new ZError(403, "Tài khoản chỉ xem không nhập được đơn hàng.");
  const d = await db();
  let parsed: ReturnType<typeof readOrders>;
  try { parsed = readOrders(input.csv); } catch (e) {
    // File hỏng vẫn để lại một dòng, để người dùng thấy lần nhập đó đã thất bại vì đâu.
    if (e instanceof ZError) await d.query("insert into order_imports (brand_id, method, file_name, status, error, imported_by) values ($1, 'csv', $2, 'failed', $3, $4)", [b, input.fileName, e.message, actor.userId]);
    throw e;
  }
  await d.tx(async (q) => {
    const [imp] = await q.query<{ id: string }>(
      "insert into order_imports (brand_id, method, file_name, rows_total, status, imported_by) values ($1, 'csv', $2, $3, 'processing', $4) returning id", [b, input.fileName, parsed.total, actor.userId]);
    const [n] = parsed.rows.length ? await q.query<{ fresh: string; matched: string }>(
      `with x as (
         select * from jsonb_to_recordset($3::jsonb) as r(external_id text, ordered_at timestamptz, amount_vnd bigint, status text, tracking_code text)
       ), ins as (
         insert into orders (brand_id, import_id, source, external_id, ordered_at, amount_vnd, status, tracking_code, campaign_id, match_method, matched_at)
         select $1::uuid, $2::uuid, $4::text, x.external_id, x.ordered_at, x.amount_vnd, x.status, x.tracking_code, c.id,
                case when c.id is not null then 'tracking_code' end, case when c.id is not null then now() end
           from x left join campaigns c on c.brand_id = $1::uuid and c.tracking_code = x.tracking_code
         on conflict (brand_id, source, external_id) do update
           set status = excluded.status, amount_vnd = excluded.amount_vnd,
               tracking_code = coalesce(orders.tracking_code, excluded.tracking_code),
               campaign_id = coalesce(orders.campaign_id, excluded.campaign_id),
               match_method = coalesce(orders.match_method, excluded.match_method),
               matched_at = coalesce(orders.matched_at, excluded.matched_at)
         returning (xmax = 0) as fresh, campaign_id
       )
       select count(*) filter (where fresh) as fresh, count(*) filter (where campaign_id is not null) as matched from ins`,
      [b, imp.id, JSON.stringify(parsed.rows), input.source]) : [{ fresh: "0", matched: "0" }];
    const fresh = Number(n.fresh), matched = Number(n.matched);
    await q.query("update order_imports set rows_new = $2, rows_matched = $3, status = 'done', error = $4 where id = $1", [imp.id, fresh, matched, skippedNote(parsed.skipped)]);
    const text = `Đã nhập file ${input.fileName}: ${parsed.rows.length} đơn, ${fresh} đơn mới, ${matched} đơn ghép được về chiến dịch.${parsed.skipped.length ? ` Bỏ qua ${parsed.skipped.length} dòng lỗi.` : ""}`;
    await q.query("insert into messages (brand_id, role, text, meta) values ($1, 'note', $2, '{}')", [b, text]);
    await q.query("insert into audit_events (brand_id, actor_type, actor_id, action, payload) values ($1, 'user', $2, 'import_orders', $3)",
      [b, actor.userId, JSON.stringify({ importId: imp.id, fileName: input.fileName, source: input.source, total: parsed.total, fresh, matched, skipped: parsed.skipped.length })]);
  });
}

/** Các lần nhập gần đây và số đơn chưa ghép được về chiến dịch nào. */
export async function loadOrderImports(q: Db, b: string): Promise<{ imports: OrderImport[]; unmatched: number; total: number }> {
  const rows = await q.query<{ id: string; file_name: string | null; rows_total: number; rows_new: number; rows_matched: number; status: OrderImport["status"]; error: string | null; at: string }>(
    `select id, file_name, rows_total, rows_new, rows_matched, status, error, to_char(created_at at time zone 'Asia/Ho_Chi_Minh', 'DD/MM HH24:MI') as at
       from order_imports where brand_id = $1 order by created_at desc, id limit 5`, [b]);
  const [n] = await q.query<{ total: string; unmatched: string }>("select count(*) as total, count(*) filter (where campaign_id is null) as unmatched from orders where brand_id = $1", [b]);
  return {
    imports: rows.map((r) => ({ id: r.id, fileName: r.file_name ?? "", rowsTotal: Number(r.rows_total), rowsNew: Number(r.rows_new), rowsMatched: Number(r.rows_matched), status: r.status, note: r.error, at: r.at })),
    unmatched: Number(n.unmatched), total: Number(n.total),
  };
}
