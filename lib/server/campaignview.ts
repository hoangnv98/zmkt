import "server-only";
import type { Db } from "./db";
import type { CampaignContent, CampaignRow, CampaignTask } from "@/lib/types";

// Phần đọc của chiến dịch: số liệu theo ngày lấy từ view campaign_daily (gộp từ số liệu giờ và đơn hàng).

export async function loadCampaigns(q: Db, b: string): Promise<CampaignRow[]> {
  const rows = await q.query<{ id: string; seq: number; strategy_id: string; segment: string; name: string; question: string | null; idea: string | null; format: string | null;
    budget_vnd: string; trial_budget_vnd: string; status: CampaignRow["status"]; stop_reason: string | null }>(
    `select c.id, c.seq, c.strategy_id, g.name as segment, c.name, c.question, c.idea, c.format, c.budget_vnd, c.status, c.stop_reason,
            coalesce((select x.amount_vnd from ad_commands x where x.campaign_id = c.id and x.kind = 'launch' and x.status = 'done' order by x.created_at limit 1), c.budget_vnd) as trial_budget_vnd
       from campaigns c join strategies s on s.id = c.strategy_id join segments g on g.id = s.segment_id
      where c.brand_id = $1 order by c.seq`, [b]);
  if (!rows.length) return [];
  const days = await q.query<{ campaign_id: string; day: string; spend_vnd: string; orders: string }>(
    "select campaign_id, to_char(day, 'YYYY-MM-DD') as day, spend_vnd, orders from campaign_daily where brand_id = $1 order by day", [b]);
  const tasks = await q.query<{ id: string; campaign_id: string; phase: CampaignTask["phase"]; title: string; owner: CampaignTask["owner"]; status: CampaignTask["status"]; due_note: string | null }>(
    "select id, campaign_id, phase, title, owner, status, due_note from campaign_tasks where brand_id = $1 order by position", [b]);
  // Nội dung của chiến dịch: ảnh, video và lời quảng cáo gắn vào các mẫu. Có mẫu đang chạy thì là đang chạy, không thì chờ dùng, không nữa thì đã tắt.
  const contents = await q.query<{ campaign_id: string; id: string; name: string; kind: CampaignContent["kind"]; text: string | null; status: CampaignContent["status"] }>(
    `select a.campaign_id, s.id, s.title as name, s.kind, null::text as text, case when bool_or(a.status = 'running') then 'running' when bool_or(a.status = 'planned') then 'planned' else 'off' end as status, 0 as ord, min(s.storage_path) as sortkey
       from ads a join assets s on s.id = a.asset_id where a.brand_id = $1 group by a.campaign_id, s.id, s.title, s.kind
     union all
     select a.campaign_id, k.id, k.label, 'copy', k.body, case when bool_or(a.status = 'running') then 'running' when bool_or(a.status = 'planned') then 'planned' else 'off' end, 1, k.label
       from ads a join ad_copies k on k.id = a.copy_id where a.brand_id = $1 group by a.campaign_id, k.id, k.label, k.body
     order by ord, sortkey`, [b]);
  return rows.map((r) => {
    const d = days.filter((x) => x.campaign_id === r.id).map((x) => ({ day: x.day, spendVnd: Number(x.spend_vnd), orders: Number(x.orders) }));
    return {
      id: r.id, seq: r.seq, strategyId: r.strategy_id, segmentName: r.segment, name: r.name, question: r.question, idea: r.idea, format: r.format,
      budgetVnd: Number(r.budget_vnd), trialBudgetVnd: Number(r.trial_budget_vnd), status: r.status, stopReason: r.stop_reason,
      spentVnd: d.reduce((n, x) => n + x.spendVnd, 0), orders: d.reduce((n, x) => n + x.orders, 0), days: d,
      tasks: tasks.filter((t) => t.campaign_id === r.id).map((t) => ({ id: t.id, phase: t.phase, title: t.title, owner: t.owner, status: t.status, dueNote: t.due_note })),
      contents: contents.filter((k) => k.campaign_id === r.id).map((k) => ({ id: k.id, name: k.name, kind: k.kind, text: k.text, status: k.status })),
    };
  });
}
