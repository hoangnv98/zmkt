"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmtDay, fmtVnd } from "@/lib/data";
import { SubTabs } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { BRAND_TABS } from "@/lib/nav";

export default function HoSo() {
  const s = useStore();
  const p = s.profile;
  const ask = (text: string) => { s.setDraft(text); s.setChatOpen(true); };

  if (!p) {
    return (
      <>
        <div className="pagehead"><h1>Hồ sơ {s.brand.name}</h1><div className="grow"><SubTabs items={BRAND_TABS} /></div></div>
        <div className="empty">
          <b>Z.MKT chưa dựng hồ sơ cho {s.brand.name}</b>
          Kể vài câu trong chat: bán gì, khách là ai, điều gì làm bạn khác người khác.
          <div><button className="btn" onClick={() => ask(`${s.brand.name} bán `)}>Kể trong chat</button></div>
        </div>
      </>
    );
  }

  const price = p.priceMinVnd != null && p.priceMaxVnd != null ? `${fmtVnd(p.priceMinVnd)} đến ${fmtVnd(p.priceMaxVnd)}` : null;
  const fields = [
    { k: "Bản chất", v: p.essence, big: true },
    { k: "Khác biệt", v: p.difference },
    { k: "Giá trị", v: p.values },
    { k: "Tính cách", v: p.personality },
    { k: "Hợp nhất với", v: p.bestFit },
    { k: "Khoảng giá", v: price },
  ];
  const src = s.source;

  return (
    <>
      <div className="pagehead">
        <h1>Z.MKT hiểu {s.brand.name} thế này</h1>
        <div className="grow"><SubTabs items={BRAND_TABS} /></div>
      </div>
      <p className="lede">{src?.summary ? `${src.summary} ` : ""}Hồ sơ này dựng từ link shop và những gì bạn kể trong chat. Sai dòng nào, bấm “Sửa” rồi nói lại cho mình.</p>

      <div className="two">
        <dl className="defs">
          {fields.map((f) => [
            <dt key={`${f.k}t`}>{f.k}</dt>,
            <dd key={`${f.k}d`} className={f.big ? "big" : undefined}>{f.v ?? <span className="muted">Chưa rõ</span>}</dd>,
            <dd key={`${f.k}a`} className="act"><button className="link" onClick={() => ask(`Phần “${f.k}” chưa đúng: `)}>Sửa</button></dd>,
          ])}
        </dl>

        <div>
          <div className="sheet">
            <div className="sheet-h"><span>Z.MKT đã hiểu {p.understandingPct}%</span><small>từ shop và trò chuyện</small></div>
            <div style={{ padding: "6px 16px 14px" }}>
              <div className="meter" role="img" aria-label={`Đã hiểu ${p.understandingPct} phần trăm`}><i style={{ width: `${p.understandingPct}%` }} /></div>
              {p.missing.length > 0 && (
                <>
                  <p style={{ marginTop: 10 }}>Còn muốn biết thêm: {p.missing.map((m, i) => <span key={m}>{i > 0 && (i === p.missing.length - 1 ? " và " : ", ")}<b>{m}</b></span>)}.</p>
                  <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => ask(`${p.missing[p.missing.length - 1][0].toUpperCase()}${p.missing[p.missing.length - 1].slice(1)}: `)}>Kể thêm trong chat</button>
                </>
              )}
            </div>
          </div>
          {s.products.length > 0 && (
            <table className="grid" style={{ marginTop: 14 }}>
              <thead><tr><th>Sản phẩm · {s.products.length}/{src?.productsSeen ?? s.products.length}</th><th className="r">Giá</th><th className="r">Đánh giá</th></tr></thead>
              <tbody>
                {s.products.map((x) => <tr key={x.id}><td>{x.name}</td><td className="r">{x.priceVnd != null ? fmtVnd(x.priceVnd) : "–"}</td><td className="r">{x.reviewCount}</td></tr>)}
              </tbody>
            </table>
          )}
          {src?.url && <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>Nguồn: {src.url}{src.readOn ? `, đọc ngày ${fmtDay(src.readOn)}` : ""}.{s.brand.sample ? " Dữ liệu ví dụ." : ""}</p>}
        </div>
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={() => ask("Hồ sơ chưa đúng ở chỗ: ")}>Chưa đúng, sửa lại</button>
        <Link className="btn" href="/tiem-nang">Đúng rồi, xem thị trường <Icon name="arrow" /></Link>
      </div>
    </>
  );
}
