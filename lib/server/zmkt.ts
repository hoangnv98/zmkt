import "server-only";
import { db, type Db } from "./db";
import { ads } from "./ads";
import { ZError } from "./errors";
import { loadProducts, loadProfile, loadSegments, loadSource, loadStrategies } from "./brandview";
import { loadCampaigns } from "./campaignview";
import { loadTrialReview, writeTrialReview } from "./review";
import { loadOrderImports } from "./orders";
import { campaignBySeq, haltCampaign, metaConnection, pauseAll, recordDay, resumeAll, runCampaign } from "./adsops";
import { APPROVALS, DONE, FIRST_DAY, INTRO, REPLY, SAMPLE_CAMPAIGNS, SAMPLE_MONTH, TR, TRIAL_DAYS, approvedMsgs, dayIso, type M, type Option } from "./sample";
import type { Actor, AppState, BrandRow, ChatMsg, DecisionKey, ExpandState, Role, Stage, TetState } from "@/lib/types";

export { ZError };

// Lõi nghiệp vụ của Z.MKT. Mọi hàm nhận `brandId` đã được kiểm tra quyền thành viên ở lớp API.
// Mọi thay đổi về tiền đi qua đây, trong một giao dịch, và phải qua hai cửa:
// không đang "dừng mọi chi tiêu", và không vượt trần tháng của thương hiệu.
// Hai cửa này có thêm một lớp nữa trong cơ sở dữ liệu (trigger check_commit ở db/schema.sql).
// Lệnh gửi sang kênh quảng cáo nằm ở adsops.ts.

// Tháng mà tiền tính vào trần: tháng dương lịch theo giờ Việt Nam.
// Thương hiệu ví dụ sống trong tháng 10/2026 của dữ liệu mẫu.
const vnMonth = () => `${new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 7)}-01`;
const monthOf = (sample: boolean) => (sample ? SAMPLE_MONTH : vnMonth());
const CAN_APPROVE: Role[] = ["owner", "approver"];
const SYSTEM: Actor | null = null;
const tr = (vnd: number) => `${(vnd / TR).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} triệu ₫`;

async function say(q: Db, b: string, msgs: M[]) {
  for (const m of msgs) {
    const meta = { ...(m.tag ? { tag: m.tag } : {}), ...(m.link ? { link: m.link } : {}) };
    const role = m.from === "me" ? "user" : m.from === "z" ? "assistant" : m.from;
    await q.query("insert into messages (brand_id, role, text, meta) values ($1, $2, $3, $4)", [b, role, m.text, JSON.stringify(meta)]);
  }
}
const audit = (q: Db, b: string | null, actor: Actor | null, action: string, payload: object = {}) =>
  q.query("insert into audit_events (brand_id, actor_type, actor_id, action, payload) values ($1, $2, $3, $4, $5)",
    [b, actor ? "user" : "system", actor?.userId ?? null, action, JSON.stringify(payload)]);

async function money(q: Db, b: string, month: string) {
  const [r] = await q.query<{ committed: string; spent: string }>(
    `select coalesce(sum(case kind when 'commit' then amount_vnd when 'release' then -amount_vnd else 0 end), 0) as committed,
            coalesce(sum(case kind when 'spend' then amount_vnd else 0 end), 0) as spent
       from ledger_entries where brand_id = $1 and month = $2`, [b, month]);
  return { committed: Number(r.committed), spent: Number(r.spent) };
}

async function lockBrand(q: Db, b: string) {
  const [row] = await q.query<{ halted: boolean; cap_month_vnd: string; sample: boolean }>(
    "select halted, cap_month_vnd, sample from brands where id = $1 and archived_at is null for update", [b]);
  if (!row) throw new ZError(404, "Không tìm thấy thương hiệu.");
  return { ...row, cap: Number(row.cap_month_vnd), month: monthOf(row.sample) };
}

// Thương hiệu đang ở đâu trong đợt chạy thử. Suy từ giai đoạn "thử" của chiến lược ưu tiên 1 và số ngày đã có số liệu,
// không còn cột riêng nào giữ trạng thái này.
const STAGE_OF: Record<string, Stage> = { waiting: "before", running: "running", done: "after" };
const TRIAL_STATUS_SQL = `select st.id, st.status from strategy_stages st join strategies s on s.id = st.strategy_id join segments g on g.id = s.segment_id
  where st.brand_id = $1 and st.kind = 'trial' and g.rank = 1 limit 1`;
async function trialState(q: Db, b: string): Promise<{ stage: Stage; simDay: number; stageId: string | null }> {
  const [t] = await q.query<{ id: string; status: string }>(TRIAL_STATUS_SQL, [b]);
  if (!t) return { stage: "before", simDay: 0, stageId: null };
  const [d] = await q.query<{ n: string }>(
    "select count(distinct (m.hour at time zone 'Asia/Ho_Chi_Minh')::date) as n from ad_metrics_hourly m join campaigns c on c.id = m.campaign_id where c.stage_id = $1", [t.id]);
  return { stage: STAGE_OF[t.status] ?? "before", simDay: Math.min(TRIAL_DAYS, Number(d.n)), stageId: t.id };
}

type Approval = { id: string; key: DecisionKey; status: string; choice: string | null; options: Option[]; strategyId: string | null };
type ApprovalDb = { id: string; kind: string; rank: number | null; status: string; choice: string | null; options: Option[] | string; strategy_id: string | null };
const APPROVAL_SQL = `select a.id, a.kind, g.rank, a.status, a.choice, a.options, a.strategy_id
  from approval_requests a left join strategies s on s.id = a.strategy_id left join segments g on g.id = s.segment_id`;
// Việc nào là việc nào suy từ loại yêu cầu và nhóm khách của chiến lược (nhóm ưu tiên 1 hay nhóm sau).
const toApproval = (r: ApprovalDb): Approval => ({
  id: r.id, status: r.status, choice: r.choice, strategyId: r.strategy_id,
  key: r.kind === "expand_after_trial" ? "expand" : r.rank === 1 ? "first" : "tet",
  options: typeof r.options === "string" ? JSON.parse(r.options) : r.options,
});

/** Các lần xin duyệt đang có hiệu lực (chờ hoặc đã quyết). Lần đã mở lại nằm trong bảng làm lịch sử. */
async function liveApprovals(q: Db, b: string): Promise<Approval[]> {
  const rows = await q.query<ApprovalDb>(`${APPROVAL_SQL} where a.brand_id = $1 and a.status in ('pending', 'resolved') order by a.created_at, a.id`, [b]);
  return rows.map(toApproval);
}
const approvalOf = async (q: Db, b: string, key: DecisionKey) => (await liveApprovals(q, b)).filter((a) => a.key === key).pop();

async function requestApproval(q: Db, b: string, key: DecisionKey, strategyId: string, stageId: string | null = null) {
  const a = APPROVALS[key];
  const [r] = await q.query<{ id: string }>(
    "insert into approval_requests (brand_id, kind, strategy_id, stage_id, title, options, requested_by) values ($1, $2, $3, $4, $5, $6, 'ai') returning id",
    [b, a.kind, strategyId, stageId, a.title, JSON.stringify(a.options)]);
  return r.id;
}

type Sample = { young: string; tet: string | null; seg1: string; seg2: string; trial: string; expand: string };
/** Id của các dòng dữ liệu mẫu, tìm theo thứ hạng nhóm khách. */
async function sampleIds(q: Db, b: string): Promise<Sample> {
  const segs = await q.query<{ id: string; rank: number; strategy_id: string | null }>(
    "select g.id, g.rank, (select s.id from strategies s where s.segment_id = g.id order by s.created_at limit 1) as strategy_id from segments g where g.brand_id = $1 and g.rank in (1, 2)", [b]);
  const s1 = segs.find((x) => x.rank === 1), s2 = segs.find((x) => x.rank === 2);
  if (!s1?.strategy_id || !s2) throw new ZError(409, "Thương hiệu này chưa có chiến lược.");
  const stages = await q.query<{ id: string; kind: string }>("select id, kind from strategy_stages where strategy_id = $1", [s1.strategy_id]);
  const st = (k: string) => stages.find((x) => x.kind === k)!.id;
  return { young: s1.strategy_id, tet: s2.strategy_id, seg1: s1.id, seg2: s2.id, trial: st("trial"), expand: st("expand") };
}
const setStrategy = (q: Db, id: string, status: string, budget?: number) =>
  q.query("update strategies set status = $2, budget_month_vnd = coalesce($3, budget_month_vnd) where id = $1", [id, status, budget ?? null]);
const setStage = (q: Db, id: string, status: string) => q.query("update strategy_stages set status = $2 where id = $1", [id, status]);
const setSegment = (q: Db, id: string, status: string) => q.query("update segments set status = $2 where id = $1", [id, status]);
/** Đổi ngân sách của chiến dịch chưa đẩy lên kênh. Chưa có tiền nào chạy nên không cần lệnh. */
const planBudget = (q: Db, b: string, seq: number, budget: number) =>
  q.query("update campaigns set budget_vnd = $3 where brand_id = $1 and seq = $2 and status = 'planned'", [b, seq, budget]);

// Công việc của chiến dịch đổi trạng thái theo ba mốc: bắt đầu chạy, hết chạy thử, người dùng quyết.
const OF_STRATEGY = "campaign_id in (select id from campaigns where strategy_id = $1)";
const tasksStarted = (q: Db, strategyId: string) =>
  q.query(`update campaign_tasks set status = 'done', done_at = now() where ${OF_STRATEGY} and phase in ('prepare', 'produce', 'run')`, [strategyId]);
async function tasksTrialDone(q: Db, strategyId: string) {
  await q.query(`update campaign_tasks set status = 'done', done_at = now() where ${OF_STRATEGY} and phase = 'optimize' and owner = 'zmkt' and due_note is distinct from 'sau khi bạn quyết'`, [strategyId]);
  await q.query(`update campaign_tasks set status = 'waiting_user' where ${OF_STRATEGY} and phase = 'optimize' and owner = 'user'`, [strategyId]);
}
const tasksDecided = (q: Db, strategyId: string, decided: boolean) =>
  q.query(`update campaign_tasks set status = $2, done_at = case when $2 = 'done' then now() else null end where ${OF_STRATEGY} and phase = 'optimize' and owner = 'user'`, [strategyId, decided ? "done" : "waiting_user"]);

/** Giữ chỗ tiền trong trần của tháng. Hai cửa an toàn nằm ở đây, và lặp lại ở trigger check_commit. */
async function commit(q: Db, b: string, approvalId: string, amount: number, note: string) {
  const br = await lockBrand(q, b);
  if (br.halted) throw new ZError(409, "Mọi chi tiêu đang dừng. Bật lại ở thanh trên cùng rồi mới duyệt được.");
  const { committed } = await money(q, b, br.month);
  if (committed + amount > br.cap) throw new ZError(409, `Không duyệt được: tổng đã cam kết sẽ là ${tr(committed + amount)}, vượt trần ${tr(br.cap)} mỗi tháng.`);
  await q.query("insert into ledger_entries (brand_id, kind, amount_vnd, month, approval_id, note) values ($1, 'commit', $2, $3, $4, $5)", [b, amount, br.month, approvalId, note]);
}

/** Trả lại phần tiền một lần duyệt còn giữ chỗ (khi đổi quyết định hoặc khi xong việc). */
async function release(q: Db, b: string, approvalId: string, month: string, note: string) {
  const [r] = await q.query<{ open: string }>(
    "select coalesce(sum(case kind when 'commit' then amount_vnd when 'release' then -amount_vnd else 0 end), 0) as open from ledger_entries where brand_id = $1 and approval_id = $2 and month = $3", [b, approvalId, month]);
  const open = Number(r.open);
  if (open > 0) await q.query("insert into ledger_entries (brand_id, kind, amount_vnd, month, approval_id, note) values ($1, 'release', $2, $3, $4, $5)", [b, open, month, approvalId, note]);
}

// ---------- Thương hiệu ----------
export async function createBrand(q: Db, ownerId: string, input: { name: string; shopUrl?: string; capVnd: number; sample?: boolean }): Promise<string> {
  const [{ id }] = await q.query<{ id: string }>(
    "insert into brands (name, sample, cap_month_vnd, created_by) values ($1, $2, $3, $4) returning id",
    [input.name, Boolean(input.sample), input.capVnd, ownerId]);
  await q.query("insert into brand_members (brand_id, user_id, role) values ($1, $2, 'owner')", [id, ownerId]);
  if (input.sample) await seedSample(q, id, "after");
  else {
    await q.query("insert into channel_connections (brand_id, kind, display_name, access_level, status) values ($1, 'meta_ads', $2, 'full', 'disconnected')", [id, `${input.name} · tài khoản quảng cáo`]);
    // Link shop là một nguồn chờ đọc. Phần đọc shop chưa có ở bản này.
    if (input.shopUrl) await q.query("insert into brand_sources (brand_id, kind, url, status) values ($1, 'shop', $2, 'queued')", [id, input.shopUrl]);
    await say(q, id, [
      { from: "note", text: `Tạo thương hiệu ${input.name}` },
      { from: "z", text: `Chào bạn! Mình là Z.MKT, sẽ lo quảng cáo cho ${input.name}. ${input.shopUrl ? `Mình đã ghi lại link ${input.shopUrl}. ` : "Có link shop hay website thì gửi mình nhé. "}Bạn kể vài câu: bán gì, khách là ai, điều gì làm bạn khác người khác.` },
    ]);
  }
  await audit(q, id, { userId: ownerId, role: "owner" }, "create_brand", { name: input.name, capVnd: input.capVnd });
  return id;
}

/** Thương hiệu mà người này là thành viên. */
export async function listBrands(userId: string): Promise<BrandRow[]> {
  const d = await db();
  const rows = await d.query<{ id: string; name: string; shop_url: string | null; sample: boolean; cap_month_vnd: string; trial: string | null; halted: boolean; role: Role; spent: string; pending: string }>(
    `select b.id, b.name, b.sample, b.cap_month_vnd, b.halted, m.role,
            (select url from brand_sources x where x.brand_id = b.id and x.kind in ('shop', 'website') order by x.created_at limit 1) as shop_url,
            (select st.status from strategy_stages st join strategies s on s.id = st.strategy_id join segments g on g.id = s.segment_id
              where st.brand_id = b.id and st.kind = 'trial' and g.rank = 1 limit 1) as trial,
            coalesce((select sum(amount_vnd) from ledger_entries l where l.brand_id = b.id and l.kind = 'spend'), 0) as spent,
            (select count(*) from approval_requests x where x.brand_id = b.id and x.status = 'pending') as pending
       from brand_members m join brands b on b.id = m.brand_id
      where m.user_id = $1 and b.archived_at is null order by b.created_at`, [userId]);
  return rows.map((r) => ({ id: r.id, name: r.name, shopUrl: r.shop_url, sample: r.sample, role: r.role, capVnd: Number(r.cap_month_vnd), stage: STAGE_OF[r.trial ?? ""] ?? "before", halted: r.halted, spentVnd: Number(r.spent), pending: Number(r.pending) }));
}

// ---------- Dữ liệu mẫu (chỉ cho thương hiệu ví dụ) ----------
// Dựng mọi thứ ở trạng thái "chưa duyệt", rồi đi tiếp bằng đúng các bước của luồng thật:
// duyệt và bắt đầu chạy thử, ghi số liệu 14 ngày, kết thúc chạy thử.
async function seedSample(q: Db, b: string, stage: Stage) {
  for (const t of ["messages", "ledger_entries", "trial_reviews", "orders", "order_imports", "ad_metrics_hourly", "ad_commands", "campaign_tasks", "ads", "ad_groups", "campaigns", "ad_copies", "assets",
    "approval_requests", "strategy_stages", "strategies", "segments", "review_snippets", "products", "brand_profiles", "brand_sources", "channel_connections"])
    await q.query(`delete from ${t} where brand_id = $1`, [b]);
  await q.query("update brands set stage = 'market', halted = false, halted_at = null, halted_by = null where id = $1", [b]);
  const [conn] = await q.query<{ id: string }>(
    "insert into channel_connections (brand_id, kind, external_id, display_name, access_level, status, connected_at) values ($1, 'meta_ads', 'act_sample', 'Gốm Lam · tài khoản quảng cáo', 'full', 'connected', now()) returning id", [b]);
  await q.query("insert into channel_connections (brand_id, kind, external_id, display_name, access_level, status, connected_at) values ($1, 'shopee', 'gomlam', 'shopee.vn/gomlam', 'read', 'connected', now())", [b]);

  // Hồ sơ: nguồn đã đọc, sản phẩm, trích đoạn đánh giá, bản hồ sơ hiện tại.
  const day0 = new Date(FIRST_DAY).toISOString();
  const [src] = await q.query<{ id: string }>(
    "insert into brand_sources (brand_id, kind, url, status, products_seen, reviews_seen, summary, last_read_at) values ($1, 'shop', 'shopee.vn/gomlam', 'read', 48, 312, 'Gốm men lam vẽ tay, Bát Tràng, ba đời làm nghề.', $2) returning id", [b, day0]);
  await q.query("insert into brand_sources (brand_id, kind, status, summary, last_read_at) values ($1, 'chat', 'read', 'Những gì bạn kể trong chat', $2)", [b, day0]);
  const products: [string, number, number][] = [["Bộ ấm trà men lam", 1_800_000, 94], ["Bình hoa 30cm", 1_250_000, 86], ["Hộp quà 4 chén", 890_000, 71], ["Chén men lam", 250_000, 61]];
  for (const [i, [name, price, reviews]] of products.entries())
    await q.query("insert into products (brand_id, source_id, external_id, name, price_vnd, review_count) values ($1, $2, $3, $4, $5, $6)", [b, src.id, `sp-${i + 1}`, name, price, reviews]);
  for (const [text, theme] of [["Mua làm quà tân gia, người nhận rất thích.", "làm quà"], ["Nét vẽ tay rõ, không chiếc nào giống chiếc nào.", "vẽ tay"], ["Đóng hộp đẹp, tặng đối tác rất hợp.", "làm quà"]])
    await q.query("insert into review_snippets (brand_id, rating, text, theme) values ($1, 5, $2, $3)", [b, text, theme]);
  await q.query(
    `insert into brand_profiles (brand_id, version, is_current, essence, difference, brand_values, personality, best_fit, price_min_vnd, price_max_vnd, voice, understanding_pct, missing, changed_by, change_note)
     values ($1, 1, true, 'Thủ công Việt thật, cho đời sống hiện đại', 'Vẽ tay, độc bản, không chiếc nào trùng', 'Nghề ba đời, tự hào làng gốm', 'Ấm áp, mộc, tinh tế', 'Người trẻ yêu nhà, người tìm quà',
             250000, 1800000, 'Ấm, mộc, nói ngắn, không khoe', 80, string_to_array('giá vốn|câu chuyện người sáng lập', '|'), 'ai', 'Dựng từ link shop và chat')`, [b]);

  // Thị trường: ba nhóm khách theo thứ tự ưu tiên.
  const seg = async (rank: number, tier: string, name: string, who: string, why: string, gap: string, fit: number, status: string) =>
    (await q.query<{ id: string }>("insert into segments (brand_id, rank, tier, name, who, why, gap, fit_score, status) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id", [b, rank, tier, name, who, why, gap, fit, status]))[0].id;
  const seg1 = await seg(1, "priority", "Người trẻ đô thị", "25 đến 38 tuổi, Hà Nội và TP.HCM, thích decor nhà có câu chuyện", "Vẽ tay thật, giá tầm trung, mỗi chiếc là duy nhất", "Ít thương hiệu gốm kể quy trình làm bằng video ngắn", 86, "has_strategy");
  await seg(2, "priority", "Quà Tết & doanh nghiệp", "Phòng hành chính và chủ doanh nghiệp nhỏ mua quà tặng đối tác", "Khách đã mua hay nhắc đến chuyện đẹp để làm quà", "Quà gốm đóng hộp sẵn, đặt số lượng 20 đến 200 hộp", 78, "proposed");
  await seg(3, "experiment", "Người sưu tầm gốm", "Trên 40 tuổi, mua theo nghệ nhân và dòng men", "Ba đời làm nghề là câu chuyện họ quan tâm", "Nhóm nhỏ, cần sản phẩm giới hạn có đánh số", 54, "proposed");

  // Chiến lược cho nhóm ưu tiên 1 và lộ trình ba giai đoạn.
  const [young] = await q.query<{ id: string }>(
    `insert into strategies (brand_id, segment_id, name, message, brand_root, question, goal_orders_month, criterion_vnd, budget_month_vnd, starts_on, status)
     values ($1, $2, 'Một góc thủ công Việt trong căn hộ hiện đại', 'Một góc thủ công Việt trong căn hộ hiện đại.', 'Gốm vẽ tay thật. Mỗi chiếc chỉ có một.',
             'Video vẽ tay có ra đơn với chi phí dưới 150.000 ₫ không?', 120, 150000, $3, '2026-10-05', $4) returning id`, [b, seg1, 5 * TR, "waiting"]);
  const stg = async (pos: number, kind: string, name: string, budget: number, period: string, cond: string, status: string) =>
    (await q.query<{ id: string }>("insert into strategy_stages (brand_id, strategy_id, position, kind, name, budget_vnd, budget_period, entry_condition, status) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id", [b, young.id, pos, kind, name, budget, period, cond, status]))[0].id;
  const trial = await stg(1, "trial", "Thử", 5 * TR, "total", "Bạn duyệt chiến lược này", "waiting");
  await stg(2, "expand", "Mở rộng", 15 * TR, "month", "Chạy thử đạt dưới 150.000 ₫ mỗi đơn và bạn đồng ý", "planned");
  await stg(3, "accelerate", "Tăng tốc", 30 * TR, "month", "Mở rộng vẫn đạt tiêu chí sau 4 tuần và bạn đồng ý", "planned");

  // Chiến dịch của đợt chạy thử: mỗi chiến dịch có trần riêng (3 triệu và 2 triệu), cộng lại bằng 5 triệu của giai đoạn "Thử".
  for (const sc of SAMPLE_CAMPAIGNS) {
    const [c] = await q.query<{ id: string }>(
      `insert into campaigns (brand_id, strategy_id, stage_id, connection_id, seq, name, question, idea, format, budget_vnd, starts_on, ends_on, tracking_code)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning id`,
      [b, young.id, trial, conn.id, sc.seq, sc.name, sc.question, sc.idea, sc.format, sc.budgetVnd, dayIso(1), dayIso(TRIAL_DAYS), sc.trackingCode]);
    const [grp] = await q.query<{ id: string }>(
      "insert into ad_groups (brand_id, campaign_id, name, targeting) values ($1, $2, 'Người trẻ đô thị', $3) returning id",
      [b, c.id, JSON.stringify({ age: [25, 38], cities: ["Hà Nội", "TP.HCM"], interests: ["decor nhà", "thủ công"] })]);
    const assetId = new Map<string, string>(), copyId = new Map<string, string>();
    for (const [i, title] of sc.assets.entries()) {
      const video = sc.assetKind === "video";
      const [a] = await q.query<{ id: string }>(
        "insert into assets (brand_id, kind, title, storage_path, mime, bytes, created_at) values ($1, $2, $3, $4, $5, $6, clock_timestamp()) returning id",
        [b, sc.assetKind, title, `sample/${sc.trackingCode}/${i + 1}.${video ? "mp4" : "jpg"}`, video ? "video/mp4" : "image/jpeg", video ? 18_000_000 : 900_000]);
      assetId.set(title, a.id);
    }
    for (const k of sc.copies) {
      const [r] = await q.query<{ id: string }>("insert into ad_copies (brand_id, strategy_id, label, body, status, created_at) values ($1, $2, $3, $4, 'ready', clock_timestamp()) returning id", [b, young.id, k.label, k.body]);
      copyId.set(k.label, r.id);
    }
    for (const ad of sc.ads)
      await q.query("insert into ads (brand_id, campaign_id, ad_group_id, asset_id, copy_id) values ($1, $2, $3, $4, $5)", [b, c.id, grp.id, ad.asset ? assetId.get(ad.asset) : null, ad.copy ? copyId.get(ad.copy) : null]);
    for (const [i, t] of sc.tasks.entries())
      await q.query("insert into campaign_tasks (brand_id, campaign_id, phase, title, owner, due_note, position) values ($1, $2, $3, $4, $5, $6, $7)", [b, c.id, t.phase, t.title, t.owner, t.due, i]);
  }

  const first = await requestApproval(q, b, "first", young.id, trial);
  await say(q, b, INTRO);
  if (stage === "before") return;

  await q.query("update approval_requests set status = 'resolved', choice = 'trial', amount_vnd = $2, resolved_at = $3 where id = $1", [first, 5 * TR, day0]);
  await commit(q, b, first, 5 * TR, "Chạy thử 2 tuần");
  await startTrial(q, b, first);
  await say(q, b, approvedMsgs(false));
  if (stage === "running") return;

  const channel = ads();
  for (let day = 1; day <= TRIAL_DAYS; day++) {
    for (const sc of SAMPLE_CAMPAIGNS) {
      const c = await campaignBySeq(q, b, sc.seq);
      const r = await channel.insights(c.external_id ?? "", day, Number(c.budget_vnd));
      await recordDay(q, b, { id: c.id, trackingCode: sc.trackingCode }, dayIso(day), r.spendVnd, r.orders, SAMPLE_MONTH);
    }
  }
  await finishTrial(q, b);
}

export async function reseed(b: string, stage: Stage, actor: Actor) {
  const d = await db();
  await d.tx(async (q) => {
    const br = await lockBrand(q, b);
    if (!br.sample) throw new ZError(409, "Chỉ thương hiệu ví dụ mới nạp lại được dữ liệu mẫu.");
    await seedSample(q, b, stage);
    await audit(q, b, actor, "reseed", { stage });
  });
}

/** Người dùng vừa duyệt chiến lược: đẩy các chiến dịch của giai đoạn "Thử", mỗi chiến dịch theo trần riêng của nó. */
async function startTrial(q: Db, b: string, approvalId: string) {
  const ids = await sampleIds(q, b);
  await setStrategy(q, ids.young, "trial"); await setStage(q, ids.trial, "running"); await setSegment(q, ids.seg1, "testing");
  const camps = await q.query<{ seq: number; budget_vnd: string }>("select seq, budget_vnd from campaigns where stage_id = $1 order by seq", [ids.trial]);
  for (const c of camps) await runCampaign(q, b, c.seq, Number(c.budget_vnd), approvalId);
  await tasksStarted(q, ids.young);
  await q.query("update brands set stage = 'trial' where id = $1", [b]);
}

/** Hết 2 tuần thử: dừng chiến dịch thử, trả tiền chưa chi, Z.MKT đề xuất mở rộng và lên chiến lược cho nhóm ưu tiên 2. */
async function finishTrial(q: Db, b: string) {
  const ids = await sampleIds(q, b);
  const camps = await q.query<{ seq: number }>("select seq from campaigns where stage_id = $1 order by seq", [ids.trial]);
  for (const c of camps) await haltCampaign(q, b, c.seq, "done", "ended");
  for (const sc of SAMPLE_CAMPAIGNS) for (const ad of sc.ads) if (ad.asset && ad.offAfterTrial)
    await q.query("update ads set status = 'off', off_reason = $4 where campaign_id = (select id from campaigns where brand_id = $1 and seq = $2) and asset_id = (select id from assets where brand_id = $1 and title = $3)", [b, sc.seq, ad.asset, ad.offAfterTrial]);
  const first = await approvalOf(q, b, "first");
  if (first) await release(q, b, first.id, SAMPLE_MONTH, "Chạy thử kết thúc, trả phần chưa chi");
  await setStage(q, ids.trial, "done");
  await tasksTrialDone(q, ids.young);
  let expandId = (await approvalOf(q, b, "expand"))?.id;
  if (!expandId) { await setStage(q, ids.expand, "waiting"); expandId = await requestApproval(q, b, "expand", ids.young, ids.expand); }
  // Chụp lại kết quả và đề xuất, gắn với lần xin duyệt mở rộng.
  await writeTrialReview(q, b, { strategyId: ids.young, stageId: ids.trial, approvalId: expandId });
  if (!ids.tet) {
    const [tet] = await q.query<{ id: string }>(
      `insert into strategies (brand_id, segment_id, name, message, brand_root, question, criterion_vnd, budget_month_vnd, starts_on, ends_on, status)
       values ($1, $2, 'Hộp quà Tết', 'Món quà Tết người nhận sẽ giữ lâu.', 'Khách đã mua nhắc “đẹp để làm quà” nhiều hơn “vẽ tay”.',
               'Hộp quà Tết có bán được cho doanh nghiệp với chi phí dưới 180.000 ₫ mỗi đơn không?', 180000, $3, '2026-11-15', '2027-01-25', 'waiting') returning id`, [b, ids.seg2, 10 * TR]);
    await setSegment(q, ids.seg2, "has_strategy");
    const conn = await metaConnection(q, b);
    await q.query(
      `insert into campaigns (brand_id, strategy_id, connection_id, seq, name, question, format, budget_vnd, starts_on, ends_on, tracking_code)
       values ($1, $2, $3, 3, 'Hộp quà Tết', 'Hộp quà Tết có bán được cho doanh nghiệp với chi phí dưới 180.000 ₫ mỗi đơn không?', 'Meta Ads: Facebook và Instagram', 0, '2026-11-15', '2027-01-25', 'gl-qua-tet')`, [b, tet.id, conn?.id ?? null]);
    await requestApproval(q, b, "tet", tet.id);
  }
  await say(q, b, DONE);
}

// ---------- Đọc trạng thái ----------
export async function getState(b: string): Promise<AppState> {
  const d = await db();
  const [br] = await d.query<{ id: string; name: string; sample: boolean; halted: boolean; cap_month_vnd: string }>(
    "select id, name, sample, halted, cap_month_vnd from brands where id = $1 and archived_at is null", [b]);
  if (!br) throw new ZError(404, "Không tìm thấy thương hiệu.");
  const live = await liveApprovals(d, b);
  const cur = (k: DecisionKey) => live.filter((a) => a.key === k).pop();
  const pick = (k: DecisionKey) => { const r = cur(k); return !r || r.status === "pending" ? "pending" : r.choice; };
  const source = await loadSource(d, b);
  const trial = await trialState(d, b);
  const conn = await metaConnection(d, b);
  const rows = await d.query<{ id: string; role: string; text: string; meta: Record<string, unknown> | string }>("select id, role, text, meta from messages where brand_id = $1 order by id", [b]);
  const { committed, spent } = await money(d, b, monthOf(br.sample));
  const orders = await loadOrderImports(d, b);
  return {
    brand: { id: br.id, name: br.name, shopUrl: source?.url ?? null, sample: br.sample },
    stage: trial.stage, halted: br.halted, simDay: trial.simDay,
    expand: pick("expand") as ExpandState, tet: pick("tet") as TetState,
    pendingCount: live.filter((a) => a.status === "pending").length,
    approvals: { first: cur("first")?.id, expand: cur("expand")?.id, tet: cur("tet")?.id },
    source, profile: await loadProfile(d, b), products: await loadProducts(d, b), segments: await loadSegments(d, b), strategies: await loadStrategies(d, b),
    campaigns: await loadCampaigns(d, b),
    trialReview: await loadTrialReview(d, b), orderImports: orders.imports, ordersTotal: orders.total, ordersUnmatched: orders.unmatched,
    spentVnd: spent, committedVnd: committed, capVnd: Number(br.cap_month_vnd),
    metaConnected: conn?.status === "connected", adsMode: ads().kind,
    aiReady: process.env.ZMKT_AI === "claude-code" || Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    messages: rows.map((r) => {
      const meta = (typeof r.meta === "string" ? JSON.parse(r.meta) : r.meta) as { tag?: string; link?: ChatMsg["link"] };
      return { id: Number(r.id), from: r.role === "user" ? "me" : r.role === "assistant" ? "z" : (r.role as ChatMsg["from"]), text: r.text, ...meta };
    }),
  };
}

// ---------- Quyết định của người dùng ----------
export async function decide(b: string, input: { approvalId: string; choice: string }, actor: Actor) {
  // Chỉ chủ thương hiệu và người duyệt mới duyệt được tiền.
  if (!CAN_APPROVE.includes(actor.role)) throw new ZError(403, "Chỉ chủ thương hiệu hoặc người duyệt mới duyệt được tiền.");
  const d = await db();
  await d.tx(async (q) => {
    const br = await lockBrand(q, b);
    const [found] = await q.query<ApprovalDb>(`${APPROVAL_SQL} where a.brand_id = $1 and a.id = $2 and a.status in ('pending', 'resolved')`, [b, input.approvalId]);
    if (!found) throw new ZError(404, "Việc này không còn để quyết. Tải lại trang để xem việc mới nhất.");
    const row = toApproval(found);
    const key = row.key;
    const ids = await sampleIds(q, b);

    if (input.choice === "pending") {
      if (row.status === "pending") return;
      if (key === "first") throw new ZError(409, "Chạy thử đã bắt đầu nên không mở lại được lần duyệt này.");
      await release(q, b, row.id, br.month, "Bạn mở lại quyết định");
      if (key === "expand") {
        await setStrategy(q, ids.young, "trial", 5 * TR); await setStage(q, ids.expand, "waiting"); await setSegment(q, ids.seg1, "testing");
        await haltCampaign(q, b, 1, "done", "user"); await haltCampaign(q, b, 2, "done", "user");
        await tasksDecided(q, ids.young, false);
      }
      if (key === "tet" && ids.tet) { await setStrategy(q, ids.tet, "waiting"); await setSegment(q, ids.seg2, "has_strategy"); await planBudget(q, b, 3, 0); }
      // Lần duyệt cũ giữ lại làm lịch sử, mở một lần xin duyệt mới.
      await q.query("update approval_requests set status = 'reopened' where id = $1", [row.id]);
      await requestApproval(q, b, key, row.strategyId!, key === "expand" ? ids.expand : null);
      await say(q, b, [{ from: "note", text: "Bạn mở lại một quyết định. Phần tiền giữ chỗ đã được trả về trần." }]);
      await audit(q, b, actor, "reopen", { key, approvalId: row.id });
      return;
    }
    if (row.status === "resolved") throw new ZError(409, "Việc này đã quyết rồi. Bấm “Đổi quyết định” trước.");

    const option = row.options.find((o) => o.key === input.choice);
    if (!option) throw new ZError(400, "Lựa chọn này không có trong việc cần duyệt.");
    const amount = Number(option.amount_vnd);
    if (amount > 0) await commit(q, b, row.id, amount, `${APPROVALS[key].title}: ${option.label}`);
    // Ghi lựa chọn và số tiền trước, vì lệnh đẩy chiến dịch kiểm ngân sách với số tiền của lần duyệt này.
    await q.query("update approval_requests set status = 'resolved', choice = $2, amount_vnd = $3, resolved_by = $4, resolved_at = now() where id = $1", [row.id, input.choice, amount, actor.userId]);

    if (key === "first") {
      if ((await trialState(q, b)).stage !== "before") throw new ZError(409, "Chiến lược này đã được duyệt.");
      await startTrial(q, b, row.id);
      await say(q, b, approvedMsgs(input.choice === "full"));
    } else if (key === "expand") {
      if (input.choice === "approved") {
        await setStrategy(q, ids.young, "active", 15 * TR); await setStage(q, ids.expand, "approved"); await setSegment(q, ids.seg1, "active");
        await runCampaign(q, b, 1, 15 * TR, row.id); await haltCampaign(q, b, 2, "stopped", "criterion");
      } else if (input.choice === "extend") {
        await setStage(q, ids.expand, "planned");
        await runCampaign(q, b, 1, 5 * TR, row.id); await haltCampaign(q, b, 2, "stopped", "criterion");
      } else {
        await setStrategy(q, ids.young, "stopped", 0); await setStage(q, ids.expand, "stopped"); await setSegment(q, ids.seg1, "has_strategy");
        await haltCampaign(q, b, 1, "stopped", "user"); await haltCampaign(q, b, 2, "stopped", "user");
      }
      await tasksDecided(q, ids.young, true);
      await say(q, b, REPLY[`expand:${input.choice}`]);
    } else if (ids.tet) {
      // Hộp quà Tết chạy từ 15/11: mới ghi ngân sách kế hoạch, chưa đẩy lên kênh.
      if (input.choice === "approved") { await setStrategy(q, ids.tet, "active"); await setSegment(q, ids.seg2, "active"); await planBudget(q, b, 3, 10 * TR); }
      else await setStrategy(q, ids.tet, "declined");
      await say(q, b, REPLY[`tet:${input.choice}`]);
    }
    await audit(q, b, actor, "decide", { key, choice: input.choice, approvalId: row.id, amountVnd: amount });
  });
}

// ---------- Nút dừng mọi chi tiêu ----------
export async function setHalted(b: string, halted: boolean, actor: Actor) {
  // Dừng thì ai làm việc trên thương hiệu cũng bấm được. Bật lại là cho tiền chạy tiếp, nên cần quyền duyệt.
  if (actor.role === "viewer") throw new ZError(403, "Tài khoản chỉ xem không đổi được chi tiêu.");
  if (!halted && !CAN_APPROVE.includes(actor.role)) throw new ZError(403, "Chỉ chủ thương hiệu hoặc người duyệt mới bật lại được chi tiêu.");
  const d = await db();
  await d.tx(async (q) => {
    await lockBrand(q, b);
    await q.query("update brands set halted = $2, halted_at = case when $2 then now() else null end, halted_by = case when $2 then $3::uuid else null end where id = $1", [b, halted, actor.userId]);
    if (halted) await pauseAll(q, b); else await resumeAll(q, b);
    await say(q, b, [{ from: "note", text: halted ? "Bạn đã dừng mọi chi tiêu. Z.MKT tạm dừng mọi chiến dịch đang chạy." : "Bạn đã bật lại chi tiêu. Chiến dịch chạy tiếp trong khung đã duyệt." }]);
    await audit(q, b, actor, halted ? "halt" : "resume");
  });
}

export async function setMetaConnected(b: string, connected: boolean, actor: Actor) {
  if (actor.role === "viewer") throw new ZError(403, "Tài khoản chỉ xem không đổi được kết nối.");
  const d = await db();
  await d.query(
    "update channel_connections set status = $2, connected_at = case when $2 = 'connected' then now() else connected_at end, connected_by = case when $2 = 'connected' then $3::uuid else connected_by end where brand_id = $1 and kind = 'meta_ads'",
    [b, connected ? "connected" : "disconnected", actor.userId]);
  await audit(d, b, actor, connected ? "connect_meta" : "disconnect_meta");
}

// ---------- Bộ giả lập: chạy một ngày ----------
export async function tick(b: string) {
  const d = await db();
  await d.tx(async (q) => {
    const br = await lockBrand(q, b);
    const trial = await trialState(q, b);
    if (trial.stage !== "running") throw new ZError(409, "Bộ giả lập chỉ chạy khi đang chạy thử. Chọn dữ liệu mẫu “vừa duyệt chạy thử”.");
    if (br.halted) { await say(q, b, [{ from: "note", text: "Đang dừng mọi chi tiêu, ngày này không chi đồng nào." }]); return; }
    if ((await metaConnection(q, b))?.status !== "connected") throw new ZError(409, "Meta Ads đang ngắt, không chạy được.");
    const day = trial.simDay + 1;
    const camps = await q.query<{ id: string; seq: number; name: string; external_id: string | null; budget_vnd: string; status: string; tracking_code: string }>(
      "select id, seq, name, external_id, budget_vnd, status, tracking_code from campaigns where stage_id = $1 order by seq", [trial.stageId]);
    let { spent } = await money(q, b, br.month);
    for (const c of camps) {
      let paid = 0, orders = 0;
      if (c.status === "running" && c.external_id) {
        const r = await ads().insights(c.external_id, day, Number(c.budget_vnd));
        // Cửa cuối: không bao giờ ghi một khoản chi làm vượt trần tháng.
        paid = Math.max(0, Math.min(r.spendVnd, br.cap - spent));
        orders = r.orders;
        if (paid < r.spendVnd) {
          await haltCampaign(q, b, c.seq, "paused", "cap");
          await say(q, b, [{ from: "note", text: `Chạm trần ${tr(br.cap)}. Z.MKT đã dừng “${c.name}”.` }]);
        }
      }
      // Chiến dịch đang dừng vẫn có dòng số liệu bằng 0, để ngày chạy thử vẫn được đếm.
      await recordDay(q, b, { id: c.id, trackingCode: c.tracking_code }, dayIso(day), paid, orders, br.month);
      spent += paid;
    }
    if (day >= TRIAL_DAYS) await finishTrial(q, b);
    await audit(q, b, SYSTEM, "tick", { day });
  });
}

export async function addChat(b: string, role: "user" | "assistant", text: string, userId?: string) {
  const d = await db();
  await d.query("insert into messages (brand_id, role, user_id, text) values ($1, $2, $3, $4)", [b, role, role === "user" ? userId ?? null : null, text]);
}

export async function history(b: string, limit = 30) {
  const d = await db();
  const rows = await d.query<{ role: string; text: string }>("select role, text from messages where brand_id = $1 and role in ('user', 'assistant') order by id desc limit $2", [b, limit]);
  return rows.reverse();
}
