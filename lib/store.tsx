"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { AppState, OrderImport, TrialReview, BrandInfo, BrandProfile, BrandSource, CampaignRow, ChatMsg, DecisionInput, ExpandState, ProductRow, SegmentRow, Stage, StrategyRow, TetState } from "@/lib/types";

export type Phase = Stage;
export type Expand = ExpandState;
export type Msg = Omit<ChatMsg, "id">;

type Store = {
  ready: boolean; busy: boolean; brand: BrandInfo; logout: () => void;
  phase: Phase; setPhase: (p: Phase) => void;
  expand: Expand; setExpand: (e: Expand) => void;
  tet: TetState; setTet: (t: TetState) => void;
  approveFirst: (full: boolean) => void;
  halted: boolean; setHalted: (b: boolean) => void;
  metaConnected: boolean; setMetaConnected: (b: boolean) => void;
  simulate: (days: number) => void; simDay: number; adsMode: AppState["adsMode"]; aiReady: boolean;
  messages: Msg[]; say: (text: string) => void; log: (m: Msg) => void;
  draft: string; setDraft: (s: string) => void;
  chatOpen: boolean; setChatOpen: (b: boolean) => void;
  pending: number; spent: number; committed: number; cap: number;
  source: BrandSource | null; profile: BrandProfile | null; products: ProductRow[]; segments: SegmentRow[]; strategies: StrategyRow[]; campaigns: CampaignRow[];
  trialReview: TrialReview | null; orderImports: OrderImport[]; ordersTotal: number; ordersUnmatched: number;
  importOrders: (file: File, source: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ initial, children }: { initial: AppState; children: ReactNode }) {
  const [state, setState] = useState<AppState>(initial);
  const [ready, setReady] = useState(true);
  const [busy, setBusy] = useState(false);
  // Tin nhắn chỉ có ở trình duyệt: lỗi, câu đang gửi. Mất khi tải lại trang.
  const [local, setLocal] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const call = useCallback(async (url: string, body?: unknown, optimistic?: Partial<AppState>) => {
    if (optimistic) setState((s) => ({ ...s, ...optimistic }));
    setBusy(true);
    try {
      const res = await fetch(url, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (res.status === 401) { window.location.href = "/dang-nhap"; return; }
      if (res.status === 409 && url !== "/api/state" && !(await res.clone().json()).state) { window.location.href = "/chon-thuong-hieu"; return; }
      const data = await res.json();
      const next: AppState | undefined = res.ok ? data : data.state;
      if (next) setState(next);
      setLocal([]);
      if (!res.ok) setLocal([{ from: "note", text: data.error ?? "Không lưu được. Thử lại sau." }]);
    } catch {
      setLocal((l) => [...l, { from: "note", text: "Mất kết nối tới máy chủ Z.MKT. Kiểm tra npm run dev còn chạy không." }]);
    } finally {
      setBusy(false);
      setReady(true);
    }
  }, []);

  const value = useMemo<Store>(() => {
    const decide = (d: DecisionInput, optimistic?: Partial<AppState>) => {
      const approvalId = state.approvals[d.key];
      if (!approvalId) { setLocal((l) => [...l, { from: "note", text: "Việc này không còn để quyết. Tải lại trang nhé." }]); return; }
      void call("/api/decisions", { approvalId, choice: d.choice }, optimistic);
    };
    // Tính từ trạng thái đang hiện để số việc chờ đổi ngay khi bấm, không đợi máy chủ.
    const pending = !state.brand.sample ? state.pendingCount
      : state.stage === "before" ? 1 : state.stage === "running" ? 0
      : (state.expand === "pending" ? 1 : 0) + (state.tet === "pending" ? 1 : 0);
    return {
      ready, busy, brand: state.brand,
      logout: () => { void fetch("/api/auth/logout", { method: "POST" }).then(() => { window.location.href = "/dang-nhap"; }); },
      phase: state.stage, setPhase: (p) => void call("/api/demo", { stage: p }),
      expand: state.expand, setExpand: (e) => decide({ key: "expand", choice: e }, { expand: e }),
      tet: state.tet, setTet: (t) => decide({ key: "tet", choice: t }, { tet: t }),
      approveFirst: (full) => decide({ key: "first", choice: full ? "full" : "trial" }),
      halted: state.halted, setHalted: (b) => void call("/api/halt", { halted: b }, { halted: b }),
      metaConnected: state.metaConnected, setMetaConnected: (b) => void call("/api/channels", { kind: "meta_ads", connected: b }, { metaConnected: b }),
      simulate: (days) => void call("/api/sim", { days }), simDay: state.simDay, adsMode: state.adsMode, aiReady: state.aiReady,
      messages: [...state.messages, ...local],
      log: (m) => setLocal((l) => [...l, m]),
      say: (text) => {
        setLocal((l) => [...l, { from: "me", text }, { from: "note", text: "Z.MKT đang trả lời…" }]);
        void call("/api/chat", { text });
      },
      draft, setDraft, chatOpen, setChatOpen,
      pending, spent: state.spentVnd / 1_000_000, committed: state.committedVnd / 1_000_000, cap: state.capVnd / 1_000_000,
      source: state.source, profile: state.profile, products: state.products, segments: state.segments, strategies: state.strategies, campaigns: state.campaigns,
      trialReview: state.trialReview, orderImports: state.orderImports, ordersTotal: state.ordersTotal, ordersUnmatched: state.ordersUnmatched,
      importOrders: (file, source) => {
        if (file.size > 2_000_000) { setLocal((l) => [...l, { from: "note", text: "File lớn hơn 2 MB. Chia nhỏ rồi nhập tiếp." }]); return; }
        void file.text().then((csv) => call("/api/orders/import", { fileName: file.name, source, csv }));
      },
    };
  }, [state, local, ready, busy, draft, chatOpen, call]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}
