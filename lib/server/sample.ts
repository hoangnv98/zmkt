import "server-only";
import type { ChatMsg, DecisionKey } from "@/lib/types";

// Dữ liệu của thương hiệu ví dụ Gốm Lam. Không phải số liệu thật.
// Chỉ phần nạp dữ liệu mẫu và bộ giả lập đọc file này.

export const TR = 1_000_000;
export const FIRST_DAY = Date.UTC(2026, 9, 5); // 5/10, ngày đầu chạy thử
export const TRIAL_DAYS = 14;
export const SAMPLE_MONTH = "2026-10-01";
/** Ngày thứ `day` của đợt chạy thử, dạng YYYY-MM-DD. */
export const dayIso = (day: number) => new Date(FIRST_DAY + (day - 1) * 86_400_000).toISOString().slice(0, 10);

export type Option = { key: string; label: string; amount_vnd: number; period: "total" | "month" | null };
export type ApprovalSeed = { kind: string; title: string; options: Option[] };
// Các lần xin duyệt của dữ liệu mẫu. Số tiền giữ chỗ lấy từ lựa chọn người dùng chốt.
export const APPROVALS: Record<DecisionKey, ApprovalSeed> = {
  first: { kind: "approve_strategy", title: "Duyệt chiến lược Người trẻ đô thị", options: [
    { key: "trial", label: "Chạy thử trước", amount_vnd: 5 * TR, period: "total" },
    { key: "full", label: "Duyệt", amount_vnd: 5 * TR, period: "total" }] },
  expand: { kind: "expand_after_trial", title: "Mở rộng sau chạy thử", options: [
    { key: "approved", label: "Tăng lên 15 triệu mỗi tháng", amount_vnd: 15 * TR, period: "month" },
    { key: "extend", label: "Thử thêm 2 tuần", amount_vnd: 5 * TR, period: "total" },
    { key: "stopped", label: "Dừng hẳn", amount_vnd: 0, period: null }] },
  tet: { kind: "approve_strategy", title: "Duyệt chiến lược Hộp quà Tết", options: [
    { key: "approved", label: "Duyệt", amount_vnd: 10 * TR, period: "month" },
    { key: "declined", label: "Chưa chạy", amount_vnd: 0, period: null }] },
};

export type M = { from: ChatMsg["from"]; text: string; tag?: string; link?: ChatMsg["link"] };

export const INTRO: M[] = [
  { from: "note", text: "Bắt đầu · Thứ Hai 5/10" },
  { from: "z", text: "Chào bạn! Kể mình nghe về thương hiệu của bạn nhé. Có link shop hay website thì gửi luôn." },
  { from: "me", text: "Gốm Lam, gốm men lam vẽ tay ở Bát Tràng. Nhà mình ba đời làm nghề.", link: { title: "Gốm Lam – Gốm vẽ tay Bát Tràng", url: "shopee.vn/gomlam" } },
  { from: "z", tag: "Đã đọc shop · 48 sản phẩm · 312 đánh giá", text: "Đã đọc shop: 48 sản phẩm, 312 đánh giá. Giá từ 250 nghìn đến 1,8 triệu, khách hay mua làm quà. Mình đã phác ra hồ sơ bên trái, chỗ nào chưa đúng cứ nói nhé." },
  { from: "z", text: "Mình đề xuất bắt đầu với nhóm người trẻ đô thị, chạy thử 2 tuần với 5 triệu để biết cái gì ra đơn. Hiệu quả rồi mới tăng, không bao giờ quá 30 triệu mỗi tháng." },
];
export const approvedMsgs = (full: boolean): M[] => [
  { from: "me", text: full ? "Duyệt và chạy đầy đủ." : "Chạy thử trước đi." },
  { from: "z", text: `Đã duyệt${full ? ", nhưng mình vẫn bắt đầu bằng 2 tuần thử cho chắc" : ""}. Mình chạy thử 2 tuần với 5 triệu ₫ trên Meta Ads: 3 triệu cho video vẽ tay, 2 triệu cho ảnh sản phẩm.` },
];
export const DONE: M[] = [
  { from: "note", text: "2 tuần sau · Chủ nhật 18/10" },
  { from: "z", text: "Chạy thử đã xong. Đây là điều mình học được:" },
  { from: "card", text: "trial-result" },
];
export const REPLY: Record<string, M[]> = {
  "expand:stopped": [{ from: "me", text: "Dừng hẳn." }, { from: "z", text: "Đã dừng cả hai chiến dịch của nhóm Người trẻ đô thị. Không còn khoản chi nào đang chạy cho nhóm này." }],
  "expand:extend": [{ from: "me", text: "Thử thêm 2 tuần." }, { from: "z", text: "Được. Mình chạy tiếp video vẽ tay thêm 2 tuần với 5 triệu ₫, đến hết 1/11 rồi báo lại." }],
  "expand:approved": [{ from: "me", text: "Tăng lên 15 triệu mỗi tháng." }, { from: "z", text: "Đã duyệt. Từ 19/10 mình chạy video vẽ tay với 15 triệu ₫ mỗi tháng và dừng ảnh sản phẩm. Vẫn trong trần 30 triệu." }],
  "tet:declined": [{ from: "me", text: "Hộp quà Tết chưa chạy." }, { from: "z", text: "Được, mình giữ chiến lược Hộp quà Tết lại và không chi khoản nào cho nó." }],
  "tet:approved": [{ from: "me", text: "Duyệt Hộp quà Tết." }, { from: "z", text: "Đã duyệt. Mình chuẩn bị nội dung Hộp quà Tết và chạy từ 15/11 với 10 triệu ₫ mỗi tháng." }],
};


// ---------- Chiến dịch mẫu ----------
export type SampleTask = { phase: "prepare" | "produce" | "run" | "optimize"; title: string; owner: "zmkt" | "user"; due: string };
export type SampleAd = { asset?: string; copy?: string; offAfterTrial?: string };
export type SampleCampaign = {
  seq: number; name: string; trackingCode: string; question: string; idea: string; format: string; budgetVnd: number;
  /** Số liệu từng ngày của 14 ngày chạy thử. Chi tiêu tính bằng nghìn ₫. */
  perDayOrders: number[]; perDaySpend: number[]; costPerOrderVnd: number;
  assetKind: "video" | "image"; assets: string[]; copies: { label: string; body: string }[]; ads: SampleAd[]; tasks: SampleTask[];
};
const z = (phase: SampleTask["phase"], title: string, due: string, owner: SampleTask["owner"] = "zmkt"): SampleTask => ({ phase, title, owner, due });

export const SAMPLE_CAMPAIGNS: SampleCampaign[] = [
  {
    seq: 1, name: "Video quy trình vẽ", trackingCode: "gl-video-ve",
    question: "Video vẽ tay có ra đơn với chi phí dưới 150.000 ₫ không?",
    idea: "Quay cận cảnh từng nét vẽ tay. Mỗi video là một chiếc bình độc bản.",
    format: "Meta Ads: Facebook và Instagram, định dạng Reels",
    budgetVnd: 3 * TR, costPerOrderVnd: 112_000,
    perDayOrders: [0, 1, 1, 1, 2, 2, 1, 2, 2, 3, 2, 3, 3, 3],
    perDaySpend: [150, 170, 185, 195, 200, 210, 210, 215, 220, 220, 225, 230, 235, 235],
    assetKind: "video",
    assets: ["Vẽ cành sen trên bình 30cm", "Chấm men lam lên bộ ấm trà", "Từ phôi đất đến lò nung", "Nét bút cuối cùng", "Xếp chén vào hộp quà"],
    copies: [
      { label: "Lời A · chiếc duy nhất", body: "Mỗi chiếc bình Gốm Lam được vẽ tay ở Bát Tràng. Không chiếc nào trùng chiếc nào." },
      { label: "Lời B · góc nhà", body: "Một góc thủ công Việt trong căn hộ của bạn. Vẽ tay, men lam, ba đời làm nghề." },
      { label: "Lời C · làm quà", body: "Món quà người nhận sẽ giữ lâu: gốm men lam vẽ tay, đóng hộp sẵn." },
    ],
    ads: [
      { asset: "Vẽ cành sen trên bình 30cm", copy: "Lời A · chiếc duy nhất" },
      { asset: "Chấm men lam lên bộ ấm trà", copy: "Lời B · góc nhà" },
      { asset: "Từ phôi đất đến lò nung", copy: "Lời A · chiếc duy nhất" },
      { asset: "Nét bút cuối cùng", copy: "Lời B · góc nhà", offAfterTrial: "Chi phí mỗi đơn trên 200.000 ₫" },
      { asset: "Xếp chén vào hộp quà", copy: "Lời A · chiếc duy nhất", offAfterTrial: "Chi phí mỗi đơn trên 200.000 ₫" },
      { copy: "Lời C · làm quà" },
    ],
    tasks: [
      z("prepare", "Đọc 48 sản phẩm và 312 đánh giá của shop", "5/10"),
      z("prepare", "Chọn nhóm khách Người trẻ đô thị trên Meta Ads", "5/10"),
      z("prepare", "Gắn mã theo dõi đơn hàng vào link shop", "5/10"),
      z("produce", "Tải 5 video quy trình vẽ vào thư viện", "5/10", "user"),
      z("produce", "Viết 3 lời quảng cáo đúng giọng Gốm Lam", "5/10"),
      z("produce", "Ghép 5 video với 3 lời quảng cáo thành mẫu", "6/10"),
      z("run", "Đẩy chiến dịch lên Meta Ads với trần 3 triệu ₫", "6/10"),
      z("run", "Kéo số liệu chi, hiển thị, click mỗi giờ", "hằng giờ"),
      z("run", "Ghép đơn hàng từ shop về chiến dịch", "hằng ngày"),
      z("optimize", "Tắt 2 mẫu có chi phí mỗi đơn trên 200.000 ₫", "12/10"),
      z("optimize", "Tổng kết 2 tuần chạy thử và đề xuất", "18/10"),
      z("optimize", "Quyết định mở rộng lên 15 triệu ₫ mỗi tháng", "từ 18/10", "user"),
      z("optimize", "Viết thêm 3 lời quảng cáo cho đợt mở rộng", "sau khi bạn quyết"),
    ],
  },
  {
    seq: 2, name: "Ảnh sản phẩm dạng lật", trackingCode: "gl-anh-lat",
    question: "Ảnh sản phẩm dạng lật có ra đơn với chi phí dưới 150.000 ₫ không?",
    idea: "Bốn ảnh sản phẩm lật lần lượt: bình hoa, bộ ấm trà, chén, hộp quà.",
    format: "Meta Ads: Facebook và Instagram, định dạng nhiều ảnh",
    budgetVnd: 2 * TR, costPerOrderVnd: 154_000,
    perDayOrders: [0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2],
    perDaySpend: [100, 110, 115, 125, 130, 130, 130, 135, 140, 140, 145, 150, 150, 150],
    assetKind: "image",
    assets: ["Bộ ảnh 1 · bình hoa 30cm", "Bộ ảnh 2 · bộ ấm trà", "Bộ ảnh 3 · hộp quà"],
    copies: [{ label: "Lời D · giá và chất liệu", body: "Gốm men lam vẽ tay Bát Tràng, từ 250.000 ₫. Giao toàn quốc." }],
    ads: [
      { asset: "Bộ ảnh 1 · bình hoa 30cm", copy: "Lời D · giá và chất liệu", offAfterTrial: "Chiến dịch chưa đạt tiêu chí" },
      { asset: "Bộ ảnh 2 · bộ ấm trà", copy: "Lời D · giá và chất liệu", offAfterTrial: "Chiến dịch chưa đạt tiêu chí" },
      { asset: "Bộ ảnh 3 · hộp quà", copy: "Lời D · giá và chất liệu", offAfterTrial: "Chiến dịch chưa đạt tiêu chí" },
    ],
    tasks: [
      z("prepare", "Chọn 12 ảnh sản phẩm rõ nhất từ shop", "5/10"),
      z("prepare", "Chọn nhóm khách Người trẻ đô thị trên Meta Ads", "5/10"),
      z("produce", "Viết 2 lời quảng cáo cho ảnh sản phẩm", "5/10"),
      z("produce", "Xếp 12 ảnh thành 3 bộ ảnh lật", "6/10"),
      z("run", "Đẩy chiến dịch lên Meta Ads với trần 2 triệu ₫", "6/10"),
      z("run", "Kéo số liệu và ghép đơn hàng", "hằng giờ"),
      z("optimize", "Đổi ảnh đầu của bộ ảnh số 2", "11/10"),
      z("optimize", "Tổng kết 2 tuần: chưa đạt tiêu chí, đề xuất dừng", "18/10"),
    ],
  },
];
