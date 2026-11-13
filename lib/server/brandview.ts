import "server-only";
import type { Db } from "./db";
import type { BrandProfile, BrandSource, ProductRow, SegmentRow, StrategyRow, StrategyStage } from "@/lib/types";

// Phần đọc của hồ sơ thương hiệu, nhóm khách và chiến lược. Chỉ đọc, không đổi gì.

const num = (v: unknown): number | null => (v == null ? null : Number(v));

export async function loadSource(q: Db, b: string): Promise<BrandSource | null> {
  const [r] = await q.query<{ url: string | null; status: BrandSource["status"]; products_seen: number; reviews_seen: number; summary: string | null; read_on: string | null }>(
    `select url, status, products_seen, reviews_seen, summary, to_char(last_read_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') as read_on
       from brand_sources where brand_id = $1 and kind in ('shop', 'website') order by created_at limit 1`, [b]);
  return r ? { url: r.url, status: r.status, productsSeen: r.products_seen, reviewsSeen: r.reviews_seen, summary: r.summary, readOn: r.read_on } : null;
}

export async function loadProfile(q: Db, b: string): Promise<BrandProfile | null> {
  const [r] = await q.query<{ version: number; essence: string | null; difference: string | null; brand_values: string | null; personality: string | null; best_fit: string | null;
    price_min_vnd: string | null; price_max_vnd: string | null; understanding_pct: number | null; missing: string[] | null; confirmed: boolean }>(
    `select version, essence, difference, brand_values, personality, best_fit, price_min_vnd, price_max_vnd, understanding_pct, missing, confirmed_at is not null as confirmed
       from brand_profiles where brand_id = $1 and is_current`, [b]);
  return r ? {
    version: r.version, essence: r.essence, difference: r.difference, values: r.brand_values, personality: r.personality, bestFit: r.best_fit,
    priceMinVnd: num(r.price_min_vnd), priceMaxVnd: num(r.price_max_vnd), understandingPct: r.understanding_pct ?? 0, missing: r.missing ?? [], confirmed: r.confirmed,
  } : null;
}

export async function loadProducts(q: Db, b: string, limit = 4): Promise<ProductRow[]> {
  const rows = await q.query<{ id: string; name: string; price_vnd: string | null; review_count: number }>(
    "select id, name, price_vnd, review_count from products where brand_id = $1 and recognized order by review_count desc, name limit $2", [b, limit]);
  return rows.map((r) => ({ id: r.id, name: r.name, priceVnd: num(r.price_vnd), reviewCount: r.review_count }));
}

export async function loadSegments(q: Db, b: string): Promise<SegmentRow[]> {
  const rows = await q.query<{ id: string; name: string; rank: number; tier: SegmentRow["tier"]; who: string; why: string; gap: string | null; fit_score: number | null; status: SegmentRow["status"] }>(
    "select id, name, rank, tier, who, why, gap, fit_score, status from segments where brand_id = $1 and status <> 'dropped' order by rank", [b]);
  return rows.map((r) => ({ id: r.id, name: r.name, rank: r.rank, tier: r.tier, who: r.who, why: r.why, gap: r.gap, fit: r.fit_score ?? 0, status: r.status }));
}

export async function loadStrategies(q: Db, b: string): Promise<StrategyRow[]> {
  const rows = await q.query<{ id: string; segment_id: string; rank: number; name: string; message: string; brand_root: string | null; question: string | null; channel: string;
    goal_orders_month: number | null; criterion_vnd: string; budget_month_vnd: string; starts_on: string | null; ends_on: string | null; status: StrategyRow["status"] }>(
    `select s.id, s.segment_id, g.rank, s.name, s.message, s.brand_root, s.question, s.channel, s.goal_orders_month, s.criterion_vnd, s.budget_month_vnd,
            to_char(s.starts_on, 'YYYY-MM-DD') as starts_on, to_char(s.ends_on, 'YYYY-MM-DD') as ends_on, s.status
       from strategies s join segments g on g.id = s.segment_id where s.brand_id = $1 order by g.rank, s.created_at`, [b]);
  const stages = await q.query<{ id: string; strategy_id: string; position: number; kind: StrategyStage["kind"]; name: string; budget_vnd: string; budget_period: StrategyStage["budgetPeriod"]; entry_condition: string; status: StrategyStage["status"] }>(
    "select id, strategy_id, position, kind, name, budget_vnd, budget_period, entry_condition, status from strategy_stages where brand_id = $1 order by position", [b]);
  return rows.map((r) => ({
    id: r.id, segmentId: r.segment_id, segmentRank: r.rank, name: r.name, message: r.message, brandRoot: r.brand_root, question: r.question, channel: r.channel,
    goalOrdersMonth: r.goal_orders_month, criterionVnd: Number(r.criterion_vnd), budgetMonthVnd: Number(r.budget_month_vnd), startsOn: r.starts_on, endsOn: r.ends_on, status: r.status,
    stages: stages.filter((x) => x.strategy_id === r.id).map((x) => ({ id: x.id, position: x.position, kind: x.kind, name: x.name, budgetVnd: Number(x.budget_vnd), budgetPeriod: x.budget_period, entryCondition: x.entry_condition, status: x.status })),
  }));
}
