// Kiểu dữ liệu dùng chung giữa API và giao diện.
export type Stage = "before" | "running" | "after";
export type ExpandState = "pending" | "approved" | "extend" | "stopped";
export type TetState = "pending" | "approved" | "declined";
export type ChatMsg = { id: number; from: "z" | "me" | "note" | "card"; text: string; tag?: string; link?: { title: string; url: string } };

export type Role = "owner" | "approver" | "member" | "viewer";
/** Người đang thao tác trên một thương hiệu. */
export type Actor = { userId: string; role: Role };

export type BrandInfo = { id: string; name: string; shopUrl: string | null; sample: boolean };
export type BrandRow = BrandInfo & { role: Role; capVnd: number; stage: Stage; halted: boolean; spentVnd: number; pending: number };

export type AppState = {
  brand: BrandInfo;
  pendingCount: number;
  stage: Stage;
  halted: boolean;
  expand: ExpandState;
  tet: TetState;
  simDay: number;
  spentVnd: number;
  committedVnd: number;
  capVnd: number;
  metaConnected: boolean;
  adsMode: "simulator" | "meta";
  aiReady: boolean;
  messages: ChatMsg[];
  /** Lần xin duyệt hiện tại của từng việc. Giao diện gửi id này khi người dùng quyết. */
  approvals: Partial<Record<DecisionKey, string>>;
  source: BrandSource | null;
  profile: BrandProfile | null;
  products: ProductRow[];
  segments: SegmentRow[];
  strategies: StrategyRow[];
  campaigns: CampaignRow[];
  /** Bản tổng kết chạy thử mới nhất. Thẻ kết quả trong chat đọc từ đây. */
  trialReview: TrialReview | null;
  orderImports: OrderImport[];
  /** Tổng số đơn đã có và số đơn chưa ghép được về chiến dịch nào. */
  ordersTotal: number;
  ordersUnmatched: number;
};

// ---------- Hồ sơ, thị trường, chiến lược (đọc từ cơ sở dữ liệu) ----------
export type BrandSource = { url: string | null; status: "queued" | "reading" | "read" | "failed"; productsSeen: number; reviewsSeen: number; summary: string | null; readOn: string | null };
export type BrandProfile = {
  version: number; essence: string | null; difference: string | null; values: string | null; personality: string | null; bestFit: string | null;
  priceMinVnd: number | null; priceMaxVnd: number | null; understandingPct: number; missing: string[]; confirmed: boolean;
};
export type ProductRow = { id: string; name: string; priceVnd: number | null; reviewCount: number };
export type SegmentRow = { id: string; name: string; rank: number; tier: "priority" | "experiment"; who: string; why: string; gap: string | null; fit: number; status: "proposed" | "has_strategy" | "testing" | "active" | "dropped" };
export type StrategyStage = { id: string; position: number; kind: "trial" | "expand" | "accelerate"; name: string; budgetVnd: number; budgetPeriod: "total" | "month"; entryCondition: string; status: "planned" | "waiting" | "approved" | "running" | "done" | "skipped" | "stopped" };
export type StrategyRow = {
  id: string; segmentId: string; segmentRank: number; name: string; message: string; brandRoot: string | null; question: string | null; channel: string;
  goalOrdersMonth: number | null; criterionVnd: number; budgetMonthVnd: number; startsOn: string | null; endsOn: string | null;
  status: "draft" | "waiting" | "trial" | "active" | "declined" | "stopped" | "done"; stages: StrategyStage[];
};
// ---------- Chiến dịch (đọc từ cơ sở dữ liệu) ----------
export type CampaignTask = { id: string; phase: "prepare" | "produce" | "run" | "optimize"; title: string; owner: "zmkt" | "user"; status: "scheduled" | "waiting_user" | "done" | "skipped"; dueNote: string | null };
export type CampaignContent = { id: string; name: string; kind: "video" | "image" | "copy"; text: string | null; status: "running" | "planned" | "off" };
export type CampaignDay = { day: string; spendVnd: number; orders: number };
export type CampaignRow = {
  id: string; seq: number; strategyId: string; segmentName: string; name: string; question: string | null; idea: string | null; format: string | null;
  /** Trần hiện tại của chiến dịch. */
  budgetVnd: number;
  /** Trần lúc đẩy lần đầu (đợt chạy thử). */
  trialBudgetVnd: number;
  status: "planned" | "pushing" | "running" | "paused" | "stopped" | "done" | "failed"; stopReason: string | null;
  spentVnd: number; orders: number; days: CampaignDay[]; tasks: CampaignTask[]; contents: CampaignContent[];
};
// ---------- Tổng kết chạy thử và nhập đơn hàng ----------
export type TrialFinding = { campaignId: string; name: string; verdict: "met" | "missed"; orders: number; spendVnd: number; costPerOrderVnd: number | null };
export type TrialReview = {
  id: string; periodStart: string; periodEnd: string; orders: number; spendVnd: number; costPerOrderVnd: number | null; criterionVnd: number;
  recommendation: "expand" | "extend" | "stop"; summary: string; findings: TrialFinding[];
};
export type OrderImport = { id: string; fileName: string; rowsTotal: number; rowsNew: number; rowsMatched: number; status: "processing" | "done" | "failed"; note: string | null; at: string };
export type DecisionKey = "first" | "expand" | "tet";

export type DecisionInput =
  | { key: "first"; choice: "trial" | "full" }
  | { key: "expand"; choice: ExpandState }
  | { key: "tet"; choice: TetState };
