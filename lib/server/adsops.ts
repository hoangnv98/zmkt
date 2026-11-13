import "server-only";
import { randomUUID } from "node:crypto";
import type { Db } from "./db";
import { ads } from "./ads";
import { ZError } from "./errors";

// Mọi thao tác trên kênh quảng cáo đi qua đây. Mỗi thao tác là một dòng ad_commands, ghi TRƯỚC khi gọi kênh.
// Lệnh làm tăng tiền (launch, set_budget, resume) phải trỏ tới một lần duyệt, và ba điều sau phải đúng:
// thương hiệu không đang dừng chi, kênh đang kết nối, tổng ngân sách các chiến dịch không vượt số tiền lần duyệt đó cho.

export type Camp = { id: string; seq: number; name: string; external_id: string | null; status: string; budget_vnd: string; strategy_id: string };
type Reason = "approved" | "user" | "halt" | "cap" | "criterion" | "ended" | "optimize";
const MONEY = ["launch", "set_budget", "resume"];
const VN = "Asia/Ho_Chi_Minh";

export async function campaignBySeq(q: Db, b: string, seq: number): Promise<Camp> {
  const [c] = await q.query<Camp>("select id, seq, name, external_id, status, budget_vnd, strategy_id from campaigns where brand_id = $1 and seq = $2", [b, seq]);
  if (!c) throw new ZError(404, `Không tìm thấy chiến dịch #${seq}.`);
  return c;
}

export async function metaConnection(q: Db, b: string) {
  const [c] = await q.query<{ id: string; status: string }>("select id, status from channel_connections where brand_id = $1 and kind = 'meta_ads' order by created_at limit 1", [b]);
  return c;
}

/** Lần duyệt đứng sau khoản tiền chiến dịch đang được phép tiêu. */
async function approvalBehind(q: Db, campaignId: string): Promise<string | null> {
  const [r] = await q.query<{ approval_id: string | null }>(
    "select approval_id from ad_commands where campaign_id = $1 and kind in ('launch', 'set_budget') and status = 'done' order by created_at desc limit 1", [campaignId]);
  return r?.approval_id ?? null;
}

type Cmd = { kind: "launch" | "set_budget" | "pause" | "resume" | "stop"; reason: Reason; approvalId?: string | null; amount?: number };

async function command(q: Db, b: string, c: Camp, cmd: Cmd): Promise<string | null> {
  const money = MONEY.includes(cmd.kind);
  if (money) {
    if (!cmd.approvalId) throw new ZError(409, `Không đẩy được “${c.name}”: lệnh này chưa có lần duyệt nào đứng sau.`);
    const [br] = await q.query<{ halted: boolean }>("select halted from brands where id = $1", [b]);
    if (br.halted) throw new ZError(409, "Mọi chi tiêu đang dừng. Bật lại ở thanh trên cùng rồi mới chạy được chiến dịch.");
    if ((await metaConnection(q, b))?.status !== "connected") throw new ZError(409, "Meta Ads đang ngắt. Kết nối lại ở mục Kết nối rồi duyệt.");
    if (cmd.amount != null) {
      // Ngân sách các chiến dịch khác đang dựa vào cùng lần duyệt này, cộng khoản mới, không được vượt số tiền đã duyệt.
      const [ap] = await q.query<{ amount_vnd: string | null }>("select amount_vnd from approval_requests where id = $1 and brand_id = $2", [cmd.approvalId, b]);
      const [used] = await q.query<{ total: string }>(
        `select coalesce(sum(amount_vnd), 0) as total from (
           select distinct on (campaign_id) campaign_id, amount_vnd, approval_id from ad_commands
            where brand_id = $1 and kind in ('launch', 'set_budget') and status = 'done' order by campaign_id, created_at desc
         ) x where approval_id = $2 and campaign_id <> $3`, [b, cmd.approvalId, c.id]);
      const allowed = Number(ap?.amount_vnd ?? 0);
      if (Number(used.total) + cmd.amount > allowed) throw new ZError(409, `Không đẩy được “${c.name}”: tổng ngân sách chiến dịch sẽ vượt số tiền bạn đã duyệt.`);
    }
  }
  const [row] = await q.query<{ id: string }>(
    `insert into ad_commands (brand_id, campaign_id, kind, spends_money, approval_id, amount_vnd, reason, idempotency_key, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, clock_timestamp()) returning id`,
    [b, c.id, cmd.kind, money, cmd.approvalId ?? null, cmd.amount ?? null, cmd.reason, `${cmd.kind}:${c.id}:${randomUUID()}`]);
  const channel = ads();
  let ext = c.external_id;
  if (cmd.kind === "launch") ext = (await channel.launch({ id: String(c.seq), name: c.name, budgetVnd: cmd.amount ?? 0 })).externalId;
  else if (ext && cmd.kind === "set_budget") await channel.setBudget(ext, cmd.amount ?? 0);
  else if (ext && cmd.kind === "resume") await channel.resume(ext);
  else if (ext) await channel.pause(ext);
  await q.query("update ad_commands set status = 'done', attempts = 1, finished_at = clock_timestamp(), response = $2 where id = $1", [row.id, JSON.stringify({ channel: channel.kind, externalId: ext })]);
  return ext;
}

/** Cho chiến dịch chạy với ngân sách này, dựa trên một lần duyệt. Chưa đẩy thì đẩy, đã đẩy thì đổi ngân sách rồi chạy tiếp. */
export async function runCampaign(q: Db, b: string, seq: number, budget: number, approvalId: string) {
  const c = await campaignBySeq(q, b, seq);
  let ext = c.external_id;
  if (!ext) ext = await command(q, b, c, { kind: "launch", reason: "approved", approvalId, amount: budget });
  else {
    await command(q, b, c, { kind: "set_budget", reason: "approved", approvalId, amount: budget });
    await command(q, b, c, { kind: "resume", reason: "approved", approvalId });
  }
  await q.query("update campaigns set status = 'running', stop_reason = null, external_id = $2, budget_vnd = $3 where id = $1", [c.id, ext, budget]);
  await q.query("update ad_groups set status = 'running' where campaign_id = $1", [c.id]);
  await q.query("update ads set status = 'running' where campaign_id = $1 and asset_id is not null and status = 'planned'", [c.id]);
}

/** Dừng chiến dịch. Lệnh dừng không cần lần duyệt và chạy được cả khi đang dừng chi. */
export async function haltCampaign(q: Db, b: string, seq: number, status: "paused" | "stopped" | "done", reason: Reason) {
  const c = await campaignBySeq(q, b, seq);
  if (c.status === "running" && c.external_id) await command(q, b, c, { kind: status === "paused" ? "pause" : "stop", reason });
  if (c.status === "planned" && status !== "done") return;
  await q.query("update campaigns set status = $2, stop_reason = $3 where id = $1", [c.id, status, reason === "approved" || reason === "optimize" ? null : reason]);
  if (status !== "paused") await q.query("update ad_groups set status = 'stopped' where campaign_id = $1", [c.id]);
}

/** Nút "Dừng mọi chi tiêu": tạm dừng mọi chiến dịch đang chạy. */
export async function pauseAll(q: Db, b: string) {
  const running = await q.query<{ seq: number }>("select seq from campaigns where brand_id = $1 and status = 'running' order by seq", [b]);
  for (const c of running) await haltCampaign(q, b, c.seq, "paused", "halt");
}

/** Bật lại chi tiêu: chạy tiếp những chiến dịch đã bị nút dừng tạm dừng, trong đúng khung đã duyệt trước đó. */
export async function resumeAll(q: Db, b: string) {
  const paused = await q.query<Camp>("select id, seq, name, external_id, status, budget_vnd, strategy_id from campaigns where brand_id = $1 and status = 'paused' and stop_reason = 'halt' order by seq", [b]);
  for (const c of paused) {
    await command(q, b, c, { kind: "resume", reason: "user", approvalId: await approvalBehind(q, c.id) });
    await q.query("update campaigns set status = 'running', stop_reason = null where id = $1", [c.id]);
  }
}

/**
 * Ghi số liệu một ngày của một chiến dịch: chi tiêu, hiển thị, click theo từng giờ và từng mẫu quảng cáo,
 * đơn hàng ghép về bằng mã theo dõi, và một dòng `spend` trong sổ tiền.
 */
export async function recordDay(q: Db, b: string, c: { id: string; trackingCode: string }, day: string, spendVnd: number, orders: number, month: string) {
  await q.query(
    `insert into ad_metrics_hourly (brand_id, campaign_id, ad_id, hour, spend_vnd, impressions, clicks)
     select $1, $2, x.ad_id, ($3::date + x.h * interval '1 hour') at time zone '${VN}', x.spend, x.spend / 60, x.spend / 3000
       from (select a.id as ad_id, h,
                    $4::bigint / count(*) over () + case when row_number() over (order by a.id, h) = 1 then $4::bigint % count(*) over () else 0 end as spend
               from ads a cross join generate_series(8, 23) h
              where a.campaign_id = $2 and a.asset_id is not null) x
     on conflict (ad_id, hour) do nothing`, [b, c.id, day, spendVnd]);
  if (orders > 0) {
    await q.query(
      `insert into orders (brand_id, source, external_id, ordered_at, amount_vnd, status, tracking_code, campaign_id, match_method, matched_at)
       select $1, 'shopee', $2::text || '-' || i, ($3::date + (8 + i * 3) * interval '1 hour') at time zone '${VN}',
              (array[1800000, 1250000, 890000, 250000])[1 + (i % 4)], 'paid', $4, $5, 'tracking_code', clock_timestamp()
         from generate_series(1, $6::int) i
       on conflict (brand_id, source, external_id) do nothing`, [b, `${c.trackingCode}-${day}`, day, c.trackingCode, c.id, orders]);
  }
  if (spendVnd > 0) {
    await q.query(
      "insert into ledger_entries (brand_id, kind, amount_vnd, month, campaign_id, spend_date, idempotency_key, note) values ($1, 'spend', $2, $3, $4, $5, $6, $7) on conflict (idempotency_key) do nothing",
      [b, spendVnd, month, c.id, day, `spend:${c.id}:${day}`, `Meta Ads ngày ${day}`]);
  }
}
