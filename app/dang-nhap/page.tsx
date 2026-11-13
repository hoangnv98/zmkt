"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function DangNhap() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<{ name?: string; email?: string; pass?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const reg = mode === "register";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof err = {};
    if (reg && !name.trim()) next.name = "Cần tên của bạn.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Email chưa đúng dạng, ví dụ ten@congty.vn.";
    if (reg ? pass.length < 8 : !pass) next.pass = reg ? "Mật khẩu cần ít nhất 8 ký tự." : "Nhập mật khẩu.";
    setErr(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const res = await fetch(reg ? "/api/auth/register" : "/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(reg ? { name, email, password: pass } : { email, password: pass }) });
      if (res.ok) { router.push("/chon-thuong-hieu"); router.refresh(); return; }
      setErr({ form: (await res.json()).error ?? "Không đăng nhập được. Thử lại sau." });
    } catch {
      setErr({ form: "Không kết nối được máy chủ Z.MKT." });
    } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <form className="auth-form" onSubmit={submit} noValidate>
        <span className="logo" style={{ fontSize: 30 }}>Z.MKT</span>
        <h1>{reg ? "Tạo tài khoản" : "Đăng nhập"}</h1>
        <p>{reg ? "Tài khoản mới có sẵn thương hiệu ví dụ Gốm Lam để xem Z.MKT làm việc thế nào." : "Bản thử nội bộ. Tài khoản thử: test@zmkt.vn, mật khẩu zmkt12345."}</p>
        {reg && (
          <div className="field">
            <label htmlFor="name">Tên của bạn</label>
            <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err.name} aria-describedby={err.name ? "name-err" : undefined} />
            {err.name && <span className="err" id="name-err">{err.name}</span>}
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err.email} aria-describedby={err.email ? "email-err" : undefined} />
          {err.email && <span className="err" id="email-err">{err.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="pass">Mật khẩu</label>
          <input id="pass" type="password" autoComplete={reg ? "new-password" : "current-password"} value={pass} onChange={(e) => setPass(e.target.value)} aria-invalid={!!err.pass} aria-describedby={err.pass ? "pass-err" : undefined} />
          {err.pass && <span className="err" id="pass-err">{err.pass}</span>}
        </div>
        {err.form && <p className="field err" role="alert">{err.form}</p>}
        <div className="actions" style={{ marginTop: 22 }}>
          <button className="btn" type="submit" disabled={busy}>{busy ? "Đang xử lý…" : reg ? "Tạo tài khoản" : "Đăng nhập"}</button>
          <button className="link" type="button" onClick={() => { setMode(reg ? "login" : "register"); setErr({}); }}>{reg ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Tạo mới"}</button>
        </div>
      </form>

      <div className="auth-side">
        <h2>Bạn duyệt một lần. Z.MKT chạy trong khung đó và báo lại bằng số.</h2>
        <div className="plan" style={{ gridTemplateColumns: "150px repeat(6, minmax(40px, 1fr))", minWidth: 0, maxWidth: 640 }} aria-hidden="true">
          <div className="h l">Ba bước</div>
          {["T1", "T2", "T3", "T4", "T5", "T6"].map((w) => <div key={w} className="h">{w}</div>)}
          <div className="name"><b>1 Thương hiệu</b><small>kể và dán link</small></div>
          <div className="flight"><div className="f done">Hồ sơ</div></div><div style={{ gridColumn: "span 5" }} />
          <div className="name"><b>2 Thị trường</b><small>chọn nhóm, duyệt</small></div>
          <div className="flight"><div className="f plan-wait">Bạn duyệt</div></div><div style={{ gridColumn: "span 5" }} />
          <div className="name"><b>3 Triển khai</b><small>thử nhỏ rồi tăng</small></div>
          <div className="flight" style={{ gridColumn: "span 2" }}><div className="f done">Chạy thử 2 tuần</div></div>
          <div className="flight" style={{ gridColumn: "span 4" }}><div className="f plan-ok">Mở rộng khi đạt tiêu chí</div></div>
        </div>
      </div>
    </div>
  );
}
