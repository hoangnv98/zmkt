"use client";
import { useEffect, useRef, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { useStore, type Msg, type Phase } from "@/lib/store";
import type { TrialFinding, TrialReview } from "@/lib/types";
import { Icon } from "./Icon";
import { ExpandButtons } from "./Decisions";
import { fmtVnd } from "@/lib/data";

const WHERE: [string, string][] = [
  ["/ho-so", "Thương hiệu · Hồ sơ"], ["/ket-noi", "Thương hiệu · Kết nối"], ["/tiem-nang", "Thị trường · Tiềm năng"],
  ["/chien-luoc", "Thị trường · Chiến lược"], ["/trien-khai/", "Triển khai · Chi tiết chiến dịch"], ["/trien-khai", "Triển khai · Tất cả chiến dịch"],
];

export function Chat() {
  const s = useStore();
  const path = usePathname();
  const logRef = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const where = WHERE.find(([p]) => path.startsWith(p))?.[1] ?? "";

  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [s.messages.length, s.expand]);
  useEffect(() => { if (s.draft) input.current?.focus(); }, [s.draft]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = s.draft.trim();
    if (!text) return;
    s.say(text);
    s.setDraft("");
  };

  const status = s.halted ? "Mọi chi tiêu đang dừng theo lệnh của bạn"
    : !s.brand.sample ? "Đang chờ bạn kể về thương hiệu"
    : s.phase === "before" ? "Chờ bạn duyệt chiến lược đầu tiên"
    : s.phase === "running" ? `Đang chạy thử · ngày ${Math.max(1, s.simDay)} trên 14`
    : `Đang lo 2 chiến dịch · ${s.pending} việc chờ bạn`;

  return (
    <aside className="chat" data-open={s.chatOpen} aria-label="Trò chuyện với Z.MKT">
      <header><span className="av" aria-hidden="true">Z</span><div><b>Z.MKT</b><small>{status}</small></div>
      </header>
      <div className="log" aria-live="polite" ref={logRef}>
        {s.messages.map((m, i) => m.from !== "card" ? <Bubble key={i} m={m} /> : s.trialReview && (
          <div key={i} className={`card${s.expand === "pending" ? " wait" : ""}`}>
            <h3>KẾT QUẢ CHẠY THỬ · {trialLength(s.trialReview)}</h3>
            <ul>
              {s.trialReview.findings.map((f) => (
                <li key={f.campaignId} className={f.verdict === "met" ? "ok" : "bad"}>
                  <Icon name={f.verdict === "met" ? "check" : "x"} /><span>{findingText(f)}</span>
                </li>
              ))}
              <li><Icon name="arrow" /><span>{s.trialReview.summary}</span></li>
            </ul>
            {s.expand === "pending" && <div className="row"><ExpandButtons small /></div>}
          </div>
        ))}
      </div>
      {where && <p className="viewing m note"><Icon name="eye" />Bạn đang xem <b>{where}</b></p>}
      <form className="ask" onSubmit={submit}>
        <label className="sr" htmlFor="ask">Hỏi hoặc nhờ Z.MKT</label>
        <button type="button" className="plus" aria-label="Đính kèm tệp" title="Đính kèm tệp (chưa có ở bản thử)" disabled><Icon name="plus" size={16} /></button>
        <input id="ask" ref={input} value={s.draft} onChange={(e) => s.setDraft(e.target.value)} placeholder={s.aiReady ? "Hỏi hoặc nhờ Z.MKT làm gì đó" : "Hỏi Z.MKT (chưa nối AI)"} autoComplete="off" />
        <button type="submit" aria-label="Gửi"><Icon name="send" size={16} /></button>
      </form>
      {s.brand.sample && <div className="demorow">
        <label htmlFor="demo-phase">Dữ liệu mẫu</label>
        <select id="demo-phase" className="demo" value={s.phase} onChange={(e) => s.setPhase(e.target.value as Phase)} title="Dữ liệu mẫu: chọn thời điểm để xem">
          <option value="before">trước khi duyệt</option>
          <option value="running">vừa duyệt chạy thử</option>
          <option value="after">sau 2 tuần chạy thử</option>
        </select>
        {s.phase === "running" && <button className="link" disabled={s.busy || s.halted} onClick={() => s.simulate(1)}>Giả lập +1 ngày</button>}
      </div>}
    </aside>
  );
}

const DAY_MS = 86_400_000;
function trialLength(r: TrialReview) {
  const days = Math.round((Date.parse(r.periodEnd) - Date.parse(r.periodStart)) / DAY_MS) + 1;
  return days % 7 === 0 ? `${days / 7} TUẦN` : `${days} NGÀY`;
}
function findingText(f: TrialFinding) {
  if (f.costPerOrderVnd === null) return `${f.name} chưa ra đơn nào`;
  const cost = fmtVnd(Math.round(f.costPerOrderVnd / 1000) * 1000);
  return f.verdict === "met" ? `${f.name} ra đơn tốt: ${cost} mỗi đơn` : `${f.name} chưa đạt: ${cost} mỗi đơn`;
}

function Bubble({ m }: { m: Msg }) {
  if (m.from === "me") return (
    <>
      <div className="m me">{m.text}</div>
      {m.link && <div className="linkcard"><span className="ic" aria-hidden="true"><Icon name="bag" size={16} /></span><div><b>{m.link.title}</b><small>{m.link.url}</small></div></div>}
    </>
  );
  if (m.from === "note") return <div className="m note">{m.text}</div>;
  return <div className="mrow"><span className="av" aria-hidden="true">Z</span><div className="m">{m.tag && <span className="mtag">{m.tag}</span>}{m.text}</div></div>;
}
