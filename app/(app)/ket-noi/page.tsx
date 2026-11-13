"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { SubTabs } from "@/components/TopBar";
import { BRAND_TABS } from "@/lib/nav";
import { OrderImport } from "@/components/OrderImport";

type Access = "full" | "read" | "link" | null;
type Item = { id: string; name: string; sub: string; access: Access; recommend?: boolean };
type Group = { id: string; title: string; note: string; items: Item[]; hl?: boolean };

const ACCESS_LABEL = { full: "Toàn quyền", read: "Đọc dữ liệu", link: "Chỉ link" } as const;

const START: Group[] = [
  { id: "ban", title: "Nơi bán", note: "sản phẩm, đơn, doanh thu", items: [
    { id: "shopee", name: "Shopee", sub: "shop của bạn", access: "full" },
    { id: "web", name: "Website", sub: "trang chính", access: "link" },
    { id: "tts", name: "TikTok Shop", sub: "chưa có gian hàng", access: null },
    { id: "lazada", name: "Lazada", sub: "chưa kết nối", access: null },
  ] },
  { id: "mxh", title: "Mạng xã hội", note: "đăng bài, trả lời khách", items: [
    { id: "fb", name: "Facebook Page", sub: "fanpage", access: "full" },
    { id: "tt", name: "TikTok", sub: "tài khoản", access: "full" },
    { id: "ig", name: "Instagram", sub: "tài khoản", access: "read" },
    { id: "zalo", name: "Zalo OA", sub: "chưa kết nối", access: null },
  ] },
  { id: "qc", title: "Quảng cáo", note: "chạy trong ngân sách", items: [
    { id: "meta", name: "Meta Ads", sub: "Facebook, Instagram", access: "full" },
    { id: "ttads", name: "TikTok Ads", sub: "tài khoản QC", access: "full" },
    { id: "gads", name: "Google Ads", sub: "chưa kết nối", access: null },
  ] },
  { id: "erp", title: "Vận hành · ERP", note: "tồn kho, giá, đơn", hl: true, items: [
    { id: "kiot", name: "KiotViet", sub: "tránh quảng cáo hàng đã hết", access: null, recommend: true },
    { id: "sapo", name: "Sapo, Haravan, Misa, Odoo", sub: "hoặc phần mềm khác", access: null },
  ] },
  { id: "do", title: "Đo lường", note: "khách đến từ đâu", items: [
    { id: "ga", name: "Google Analytics", sub: "website", access: "read" },
  ] },
];

export default function KetNoi() {
  const s = useStore();
  const [groups, setGroups] = useState(START);

  // Meta Ads đi theo trạng thái chung vì nút dừng chi tiêu và chiến dịch phụ thuộc vào nó.
  const view = groups.map((g) => ({ ...g, items: g.items.map((it) => (it.id === "meta" ? { ...it, access: s.metaConnected ? it.access ?? "full" : null } : it)) }));
  const all = view.flatMap((g) => g.items);
  const on = all.filter((i) => i.access).length;
  const pct = Math.round((on / all.length) * 100);

  const connect = (id: string) => {
    if (id === "meta") { s.setMetaConnected(true); return; }
    setGroups((gs) => gs.map((g) => ({ ...g, items: g.items.map((it) => (it.id === id ? { ...it, access: "read", sub: "vừa kết nối" } : it)) })));
    const name = all.find((i) => i.id === id)?.name;
    s.log({ from: "z", text: `Đã kết nối ${name} ở mức đọc dữ liệu. Muốn Z.MKT thao tác thay bạn thì nâng lên toàn quyền sau.` });
  };

  const col = (ids: string[]) => view.filter((g) => ids.includes(g.id));

  return (
    <>
      <div className="pagehead">
        <h1>Kết nối của Gốm Lam</h1>
        <div className="grow"><SubTabs items={BRAND_TABS} /></div>
      </div>

      <div className="banner">
        <div className="row"><b>Z.MKT đang thấy {pct}% bức tranh</b><span className="num">{on} / {all.length} kết nối</span></div>
        <div className="bar" role="img" aria-label={`${on} trên ${all.length} kết nối`}><i style={{ width: `${pct}%` }} /></div>
        <div className="row foot"><span>Kết nối càng nhiều, Z.MKT làm càng giỏi.</span><span>Ngắt kết nối bất cứ lúc nào.</span></div>
      </div>

      <div className="conn-grid">
        {[["ban", "mxh"], ["qc", "erp", "do"]].map((ids, k) => (
          <div className="conn-col" key={k}>
            {col(ids).map((g) => (
              <section className={`sheet${g.hl ? " hl" : ""}`} key={g.id} aria-labelledby={`g-${g.id}`}>
                <div className="sheet-h"><span id={`g-${g.id}`}>{g.title}</span><small>{g.note}</small></div>
                <ul className="conn">
                  {g.items.map((it) => (
                    <li key={it.id}>
                      <span className={`ic${it.access ? "" : " off"}`} aria-hidden="true">{it.name[0]}</span>
                      <span className="nm"><b>{it.name}</b><small>{it.sub}</small></span>
                      {it.access ? <span className={`pill ${it.access}`}>{ACCESS_LABEL[it.access]}</span>
                        : it.recommend ? <button className="pill rec" onClick={() => connect(it.id)}>Nên kết nối</button>
                        : <button className="btn ghost sm" onClick={() => connect(it.id)}>Kết nối</button>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ))}
      </div>

      <OrderImport />

      {!s.metaConnected && (
        <div className="decide"><p>Meta Ads đang ngắt, Z.MKT không chạy được chiến dịch nào.<small>Số liệu cũ vẫn được giữ. Kết nối lại để tiếp tục.</small></p><button className="btn" onClick={() => s.setMetaConnected(true)}>Kết nối Meta Ads</button></div>
      )}
    </>
  );
}
