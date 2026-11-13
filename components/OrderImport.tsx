"use client";
import { useRef, useState, type ChangeEvent } from "react";
import { useStore } from "@/lib/store";

const SOURCES = [["shopee", "Shopee"], ["tiktok_shop", "TikTok Shop"], ["lazada", "Lazada"], ["website", "Website"], ["other", "Nơi khác"]] as const;

// Nhập đơn hàng từ file CSV. Z.MKT ghép từng đơn về chiến dịch bằng mã theo dõi trong link.
export function OrderImport() {
  const s = useStore();
  const [source, setSource] = useState<string>("shopee");
  const file = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) s.importOrders(f, source);
    e.target.value = "";
  };
  const summary = s.ordersTotal
    ? `${s.ordersTotal.toLocaleString("vi-VN")} đơn đã có · ${s.ordersUnmatched.toLocaleString("vi-VN")} đơn chưa ghép được về chiến dịch`
    : "Chưa có đơn hàng nào";

  return (
    <section className="sheet imp" aria-labelledby="imp-h">
      <div className="sheet-h"><span id="imp-h">Đơn hàng từ file</span><small>{summary}</small></div>
      <div className="imp-b">
        <p>Xuất danh sách đơn từ nơi bán ra file CSV rồi nhập vào đây. Z.MKT ghép từng đơn về chiến dịch bằng mã theo dõi. Nhập lại cùng một file không tạo đơn trùng.</p>
        <div className="imp-row">
          <label className="sr" htmlFor="imp-src">Nơi bán</label>
          <select id="imp-src" value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map(([v, name]) => <option key={v} value={v}>{name}</option>)}
          </select>
          <input ref={file} id="imp-file" className="sr" type="file" accept=".csv,text/csv" onChange={handleFile} aria-label="Chọn file CSV đơn hàng" />
          <button className="btn" disabled={s.busy} onClick={() => file.current?.click()}>{s.busy ? "Đang nhập…" : "Chọn file CSV"}</button>
          <a className="link" href="/mau-don-hang.csv" download>Tải file mẫu</a>
        </div>
        {s.orderImports.length > 0 && (
          <ul className="imp-list" aria-label="Các lần nhập gần đây">
            {s.orderImports.map((r) => (
              <li key={r.id}>
                <span className="nm"><b>{r.fileName}</b><small>{r.at}{r.note ? ` · ${r.note}` : ""}</small></span>
                {r.status === "failed" ? <span className="pill wait">Không nhập được</span>
                  : <span className="num">{r.rowsTotal} dòng · {r.rowsNew} mới · {r.rowsMatched} ghép được</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
