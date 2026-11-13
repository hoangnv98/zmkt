import "server-only";
import type { Db } from "./db";
import type { TrialFinding, TrialReview } from "@/lib/types";

// Tổng kết một đợt chạy thử. Số liệu lấy từ view campaign_daily lúc kết thúc và được chụp lại vào trial_reviews,
// để thẻ kết quả trong chat không đổi khi về sau có thêm đơn hoặc chiến dịch chạy tiếp.

const TR = 1_000_000;
/** Chưa đạt nhưng chi phí mỗi đơn chỉ cao hơn tiêu chí trong khoảng này thì đề xuất thử thêm. */
const NEAR_MISS = 1.2;
const vnd = (n: number) => `${Math.round(n / 1000) * 1000}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " ₫";
const trieu = (n: number) => `${(n / TR).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} triệu ₫`;

type Ref = { strategyId: string; stageId: string; approvalId: string | null };

export async function writeTrialReview(q: Db, b: string, ref: Ref): Promise<void> {
  const [st] = await q.query<{ criterion_vnd: string; next_budget: string | null; next_period: string | null }>(
    `select s.criterion_vnd,
            (select x.budget_vnd from strategy_stages x where x.strategy_id = s.id and x.kind = 'expand' limit 1) as next_budget,
            (select x.budget_period from strategy_stages x where x.strategy_id = s.id and x.kind = 'expand' limit 1) as next_period
       from strategies s where s.id = $1 and s.brand_id = $2`, [ref.strategyId, b]);
  const criterion = Number(st.criterion_vnd);
  const rows = await q.query<{ id: string; name: string; starts_on: string | null; ends_on: string | null; spend: string; orders: string; first_day: string | null; last_day: string | null }>(
    `select c.id, c.name, to_char(c.starts_on, 'YYYY-MM-DD') as starts_on, to_char(c.ends_on, 'YYYY-MM-DD') as ends_on,
            coalesce(sum(d.spend_vnd), 0) as spend, coalesce(sum(d.orders), 0) as orders,
            to_char(min(d.day), 'YYYY-MM-DD') as first_day, to_char(max(d.day), 'YYYY-MM-DD') as last_day
       from campaigns c left join campaign_daily d on d.campaign_id = c.id
      where c.brand_id = $1 and c.stage_id = $2 group by c.id, c.name, c.seq, c.starts_on, c.ends_on order by c.seq`, [b, ref.stageId]);
  if (!rows.length) return;

  const findings: TrialFinding[] = rows.map((r) => {
    const orders = Number(r.orders), spend = Number(r.spend);
    const cost = orders ? Math.round(spend / orders) : null;
    return { campaignId: r.id, name: r.name, verdict: cost !== null && cost < criterion ? "met" : "missed", orders, spendVnd: spend, costPerOrderVnd: cost };
  });
  const met = findings.filter((f) => f.verdict === "met").sort((x, y) => (x.costPerOrderVnd ?? 0) - (y.costPerOrderVnd ?? 0));
  const near = findings.some((f) => f.costPerOrderVnd !== null && f.costPerOrderVnd < criterion * NEAR_MISS);
  const recommendation = met.length ? "expand" : near ? "extend" : "stop";
  const next = st.next_budget ? `${trieu(Number(st.next_budget))}${st.next_period === "month" ? " mỗi tháng" : ""}` : null;
  const summary = recommendation === "expand" ? `Đề xuất: ${next ? `tăng lên ${next}` : "mở rộng"}, dồn vào “${met[0].name}”`
    : recommendation === "extend" ? `Đề xuất: thử thêm 2 tuần, chi phí mỗi đơn đã gần mức ${vnd(criterion)}`
    : `Đề xuất: dừng, chưa chiến dịch nào ra đơn dưới ${vnd(criterion)}`;

  const days = rows.flatMap((r) => [r.first_day, r.last_day]).filter((d): d is string => Boolean(d)).sort();
  const start = days[0] ?? rows[0].starts_on, end = days[days.length - 1] ?? rows[0].ends_on;
  if (!start || !end) return;
  const orders = findings.reduce((n, f) => n + f.orders, 0), spend = findings.reduce((n, f) => n + f.spendVnd, 0);
  await q.query(
    `insert into trial_reviews (brand_id, strategy_id, stage_id, period_start, period_end, orders, spend_vnd, cost_per_order_vnd, criterion_vnd, findings, recommendation, summary, approval_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [b, ref.strategyId, ref.stageId, start, end, orders, spend, orders ? Math.round(spend / orders) : null, criterion,
      JSON.stringify(findings.map((f) => ({ campaign_id: f.campaignId, name: f.name, verdict: f.verdict, orders: f.orders, spend_vnd: f.spendVnd, cost_per_order_vnd: f.costPerOrderVnd }))),
      recommendation, summary, ref.approvalId]);
}

type FindingDb = { campaign_id: string; name: string; verdict: TrialFinding["verdict"]; orders: number; spend_vnd: number; cost_per_order_vnd: number | null };

/** Bản tổng kết chạy thử mới nhất của thương hiệu. */
export async function loadTrialReview(q: Db, b: string): Promise<TrialReview | null> {
  const [r] = await q.query<{ id: string; period_start: string; period_end: string; orders: number; spend_vnd: string; cost_per_order_vnd: string | null; criterion_vnd: string;
    findings: FindingDb[] | string; recommendation: TrialReview["recommendation"]; summary: string }>(
    `select id, to_char(period_start, 'YYYY-MM-DD') as period_start, to_char(period_end, 'YYYY-MM-DD') as period_end, orders, spend_vnd, cost_per_order_vnd, criterion_vnd, findings, recommendation, summary
       from trial_reviews where brand_id = $1 order by created_at desc, id limit 1`, [b]);
  if (!r) return null;
  const findings: FindingDb[] = typeof r.findings === "string" ? JSON.parse(r.findings) : r.findings;
  return {
    id: r.id, periodStart: r.period_start, periodEnd: r.period_end, orders: Number(r.orders), spendVnd: Number(r.spend_vnd),
    costPerOrderVnd: r.cost_per_order_vnd === null ? null : Number(r.cost_per_order_vnd), criterionVnd: Number(r.criterion_vnd),
    recommendation: r.recommendation, summary: r.summary,
    findings: findings.map((f) => ({ campaignId: f.campaign_id, name: f.name, verdict: f.verdict, orders: f.orders, spendVnd: f.spend_vnd, costPerOrderVnd: f.cost_per_order_vnd })),
  };
}
