"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { BrandRow } from "@/lib/types";

const fmtTr = (vnd: number) => `${(vnd / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tr`;

export default function ChonThuongHieu() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandRow[] | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [cap, setCap] = useState("30");
  const [err, setErr] = useState<{ name?: string; cap?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/brands");
    if (res.status === 401) { router.replace("/dang-nhap"); return; }
    const data = await res.json();
    if (!res.ok) { setLoadErr(data.error ?? "Không tải được danh sách thương hiệu."); return; }
    setBrands(data.brands); setUser(data.user);
  }, [router]);
  useEffect(() => { void load(); }, [load]);

  const open = async (id: string) => {
    setBusy(true);
    const res = await fetch("/api/brands/select", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) { router.push("/trien-khai"); router.refresh(); } else { setBusy(false); setLoadErr((await res.json()).error); }
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const capTr = Number(cap.replace(",", "."));
    const next: typeof err = {};
    if (!name.trim()) next.name = "Cần tên thương hiệu để tạo.";
    if (!Number.isInteger(capTr) || capTr < 1) next.cap = "Trần là số triệu ₫ nguyên, ít nhất 1.";
    setErr(next);
    if (next.name || next.cap) return;
    setBusy(true);
    const res = await fetch("/api/brands", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim(), shopUrl: link.trim() || undefined, capTr }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr({ form: data.error ?? "Không tạo được thương hiệu." }); return; }
    setBrands(data.brands);
    setName(""); setLink(""); setCap("30"); setAdding(false);
  };

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/dang-nhap"); router.refresh(); };

  return (
    <>
      <header className="simple-top">
        <span className="logo">Z.MKT</span>
        <span style={{ marginLeft: "auto", fontSize: 14.5, display: "flex", gap: 14, alignItems: "center" }}>
          {user && <span className="muted">{user.name} · {user.email}</span>}
          <button className="link" onClick={logout}>Đăng xuất</button>
        </span>
      </header>
      <main className="simple">
        <div className="pagehead"><h1>Thương hiệu của bạn</h1>
          <button className="btn grow" onClick={() => setAdding(true)} disabled={adding}>Thêm thương hiệu</button></div>

        {loadErr && <div className="notice" role="alert"><p>{loadErr}</p></div>}
        {!brands && !loadErr && <p className="muted">Đang tải…</p>}
        {brands && (
          <div className="scroll-x">
            <table className="grid" style={{ minWidth: 620 }}>
              <thead><tr><th>Thương hiệu</th><th>Việc chờ bạn</th><th className="r">Đã chi</th><th className="r">Trần tháng</th><th></th></tr></thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id}>
                    <td><b>{b.name}</b><small>{b.sample ? "Thương hiệu ví dụ · có dữ liệu mẫu" : b.shopUrl || "Chưa có link shop"}</small></td>
                    <td>{b.halted ? <span className="state bad">Đang dừng chi</span> : b.pending ? <span className="pill wait">{b.pending} việc chờ bạn quyết</span> : <span className="muted">{b.sample ? "Không có" : "Chưa bắt đầu"}</span>}</td>
                    <td className="r">{b.spentVnd ? fmtTr(b.spentVnd) : "0"}</td>
                    <td className="r">{fmtTr(b.capVnd)}</td>
                    <td><button className="btn sm" onClick={() => open(b.id)} disabled={busy}>Mở</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {adding && (
          <form className="sheet" style={{ marginTop: 14, padding: "4px 16px 16px" }} onSubmit={add} noValidate>
            <div className="two" style={{ gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1.2fr) minmax(0,0.6fr)" }}>
              <div className="field"><label htmlFor="bname">Tên thương hiệu</label>
                <input id="bname" value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-invalid={!!err.name} aria-describedby={err.name ? "bname-err" : undefined} />
                {err.name && <span className="err" id="bname-err">{err.name}</span>}</div>
              <div className="field"><label htmlFor="blink">Link shop hoặc website (không bắt buộc)</label>
                <input id="blink" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" /></div>
              <div className="field"><label htmlFor="bcap">Trần mỗi tháng (triệu ₫)</label>
                <input id="bcap" inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value)} aria-invalid={!!err.cap} aria-describedby={err.cap ? "bcap-err" : undefined} />
                {err.cap && <span className="err" id="bcap-err">{err.cap}</span>}</div>
            </div>
            {err.form && <p className="field err" role="alert">{err.form}</p>}
            <div className="actions"><button className="btn" type="submit" disabled={busy}>{busy ? "Đang tạo…" : "Tạo thương hiệu"}</button><button className="btn ghost" type="button" onClick={() => { setAdding(false); setErr({}); }}>Huỷ</button>
              <span className="note">Z.MKT không bao giờ chi quá trần này. Đổi trần sau trong chat.</span></div>
          </form>
        )}
        <p className="muted" style={{ marginTop: 14, fontSize: 14.5 }}>Mỗi thương hiệu có hồ sơ, trần ngân sách và sổ chi tiêu riêng.</p>
      </main>
    </>
  );
}
