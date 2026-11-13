"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";

// Thương hiệu mới tạo: chưa có hồ sơ, chiến lược hay chiến dịch.
export function NewBrand() {
  const s = useStore();
  return (
    <>
      <div className="pagehead"><h1>{s.brand.name}</h1></div>
      <div className="empty">
        <b>Z.MKT chưa biết gì về {s.brand.name}</b>
        Bản thử này mới đọc được thương hiệu ví dụ Gốm Lam. Với thương hiệu của bạn, hãy kể vài câu trong chat bên phải; Z.MKT lưu lại để dựng hồ sơ khi phần đọc shop xong.
        {s.brand.shopUrl && <div className="muted" style={{ marginTop: 8 }}>Link đã lưu: {s.brand.shopUrl}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn" onClick={() => { s.setDraft(`${s.brand.name} bán `); s.setChatOpen(true); }}>Kể trong chat</button>
          <Link className="btn ghost" href="/chon-thuong-hieu">Đổi thương hiệu</Link>
        </div>
      </div>
      <div className="notice">
        <p>Trần chi tiêu, sổ tiền và lịch sử chat của {s.brand.name} được lưu riêng. Meta Ads chưa kết nối nên Z.MKT không chi đồng nào.</p>
      </div>
    </>
  );
}
