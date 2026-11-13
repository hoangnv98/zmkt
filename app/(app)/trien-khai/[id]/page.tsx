"use client";
import Link from "next/link";
import { use, useState } from "react";
import { notFound } from "next/navigation";
import { useStore } from "@/lib/store";
import { TR, fmtDay, fmtTr, fmtVnd, perOrder, weekday } from "@/lib/data";
import { ExpandDecision } from "@/components/Decisions";
import { Icon } from "@/components/Icon";
import type { CampaignContent, CampaignTask } from "@/lib/types";

const PHASES: { key: CampaignTask["phase"]; label: string }[] = [
  { key: "prepare", label: "Chuẩn bị" }, { key: "produce", label: "Sản xuất" }, { key: "run", label: "Chạy" }, { key: "optimize", label: "Tối ưu" },
];
const KIND: Record<CampaignContent["kind"], string> = { video: "Video bạn tải lên", image: "Ảnh bạn tải lên", copy: "Lời quảng cáo Z.MKT viết" };
const CONTENT_STATE: Record<CampaignContent["status"], string> = { running: "Đang chạy", off: "Đã tắt", planned: "Chờ dùng" };

export default function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const s = useStore();
  const [tab, setTab] = useState<"overview" | "tasks" | "content">("overview");
  // Đường dẫn dùng số thứ tự của chiến dịch (#1, #2). Mọi số liệu đọc từ cơ sở dữ liệu.
  const c = s.campaigns.find((x) => String(x.seq) === id);
  if (!c) notFound();

  const strategy = s.strategies.find((x) => x.id === c.strategyId);
  const criterion = strategy?.criterionVnd ?? 0;
  const after = s.phase === "after";
  const hasData = c.days.length > 0;
  const good = c.orders > 0 && perOrder(c) <= criterion;
  const done = c.tasks.filter((t) => t.status === "done").length;
  const max = Math.max(1, ...c.days.map((d) => d.orders));
  const first = s.campaigns.find((x) => x.strategyId === c.strategyId && x.seq !== c.seq);
  const waiting = c.tasks.filter((t) => t.status === "waiting_user");

  return (
    <>
      <div className="pagehead">
        <Link href="/trien-khai" className="btn ghost sm" aria-label="Quay lại kế hoạch chiến dịch"><Icon name="back" /> Kế hoạch</Link>
        <h1><span className="idx">#{c.seq}</span>{c.name}</h1>
        {c.status === "planned" ? <span className="state wait">Chưa chạy · chờ duyệt chiến lược</span>
          : !after ? <span className="state"><Icon name="clock" />Đang chạy thử · ngày {Math.max(1, s.simDay)} / 14</span>
          : <span className={`state ${good ? "ok" : "bad"}`}><Icon name={good ? "check" : "x"} />{good ? "Chạy thử đạt tiêu chí" : "Chạy thử chưa đạt"}</span>}
        <div className="tabs grow" role="group" aria-label="Phần của chiến dịch">
          <button aria-pressed={tab === "overview"} onClick={() => setTab("overview")}>Tổng quan</button>
          <button aria-pressed={tab === "tasks"} onClick={() => setTab("tasks")}>Công việc <span className="count">{done}/{c.tasks.length}</span></button>
          <button aria-pressed={tab === "content"} onClick={() => setTab("content")}>Nội dung <span className="count">{c.contents.length}</span></button>
        </div>
      </div>

      {tab === "overview" && (
        <>
          <div className="two">
            <dl className="defs" style={{ gridTemplateColumns: "150px minmax(0,1fr)" }}>
              <dt>Câu hỏi cần trả lời</dt><dd className="big">{c.question}</dd>
              <dt>Ý tưởng</dt><dd>{c.idea ?? <span className="muted">Chưa có</span>}</dd>
              <dt>Kênh</dt><dd>{c.format}</dd>
              <dt>Nhóm khách</dt><dd><Link className="link" href="/chien-luoc">{c.segmentName}</Link></dd>
            </dl>
            <table className="grid">
              <thead><tr><th>{hasData ? `Sau ${c.days.length} ngày` : "Kết quả"}</th><th className="r">Kết quả</th><th className="r">Tiêu chí</th></tr></thead>
              <tbody>
                <tr><td>Đơn từ chiến dịch</td><td className="r">{hasData ? c.orders : "–"}</td><td className="r muted">–</td></tr>
                <tr><td>Đã chi</td><td className="r">{hasData ? `${fmtTr(c.spentVnd / TR)} ₫` : "0"}</td><td className="r muted">trần {fmtTr(c.trialBudgetVnd / TR)}</td></tr>
                <tr><td>Chi phí mỗi đơn</td><td className={`r ${after ? (good ? "ok" : "bad") : ""}`}>{c.orders ? fmtVnd(perOrder(c)) : "–"}</td><td className="r muted">dưới {fmtVnd(criterion)}</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="sec">Kết quả theo ngày</h2>
          {hasData ? (
            <div className="scroll-x">
              <div className="days" style={{ gridTemplateColumns: `96px repeat(${c.days.length}, minmax(40px, 1fr))` }}>
                <div className="l hd">Ngày</div>
                {c.days.map((d) => <div key={d.day} className={`hd${weekday(d.day) === "CN" ? " sun" : ""}`}>{weekday(d.day)}<br />{fmtDay(d.day)}</div>)}
                <div className="l" style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6 }}>Đơn</div>
                {c.days.map((d) => <div key={d.day} className={`barcell${!after || good ? "" : " off"}`}><i style={{ height: `${(d.orders / max) * 100}%` }} title={`${d.orders} đơn`} /></div>)}
                <div className="l">Số đơn</div>{c.days.map((d) => <div key={d.day}>{d.orders}</div>)}
                <div className="l">Đã chi (nghìn ₫)</div>{c.days.map((d) => <div key={d.day} className="muted">{Math.round(d.spendVnd / 1000)}</div>)}
              </div>
            </div>
          ) : (
            <div className="empty"><b>Chưa có số liệu</b>Số liệu chi, hiển thị và click được kéo về mỗi giờ sau khi chiến dịch bắt đầu chạy.</div>
          )}
          {c.seq === 1 && <ExpandDecision />}
          {after && !good && first && c.orders > 0 && <div className="notice"><p>Chiến dịch này chưa đạt tiêu chí. Z.MKT đề xuất dừng và dồn tiền sang “{first.name}”.</p><Link className="link" href={`/trien-khai/${first.seq}`}>Xem chiến dịch #{first.seq}</Link></div>}
        </>
      )}

      {tab === "tasks" && (
        <table className="grid">
          <thead><tr><th>Việc</th><th>Ai làm</th><th>Khi nào</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {waiting.map((t) => (
              <tr key={t.id} className="wait"><td><b>{t.title}</b><small>Việc duy nhất cần bạn trong chiến dịch này</small></td><td>Bạn</td><td>{t.dueNote}</td>
                <td><button className="btn sm" onClick={() => setTab("overview")}>Xem và quyết</button></td></tr>
            ))}
            {PHASES.map((ph) => {
              const rows = c.tasks.filter((t) => t.phase === ph.key && t.status !== "waiting_user");
              if (!rows.length) return null;
              return [
                <tr key={ph.key}><td className="grp" colSpan={4}>{ph.label.toUpperCase()}</td></tr>,
                ...rows.map((t) => (
                  <tr key={t.id}><td>{t.title}</td><td>{t.owner === "user" ? "Bạn" : "Z.MKT"}</td><td className="muted">{t.dueNote}</td>
                    <td>{t.status === "done" ? <span className="state ok"><Icon name="check" />Xong</span> : <span className="state muted"><Icon name="clock" />{c.status === "planned" ? "Chưa tới" : "Đã lên lịch"}</span>}</td></tr>
                )),
              ];
            })}
          </tbody>
        </table>
      )}

      {tab === "content" && (
        <>
          <table className="grid">
            <thead><tr><th>Nội dung</th><th>Loại</th><th>Lời quảng cáo</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {c.contents.map((k) => (
                <tr key={k.id}><td><b>{k.name}</b></td><td className="muted">{KIND[k.kind]}</td><td style={{ maxWidth: "52ch" }}>{k.text ?? <span className="muted">–</span>}</td>
                  <td><span className={`state ${k.status === "running" ? "ok" : "muted"}`}>{CONTENT_STATE[k.status]}</span></td></tr>
              ))}
            </tbody>
          </table>
          <div className="notice"><p className="muted">Số đơn và lượt xem của từng nội dung sẽ có ở bản v1.0. Ảnh và video do AI tạo có ở v1.0 và v1.1.</p><button className="btn ghost sm" onClick={() => s.setDraft("Mình muốn tải thêm video vào thư viện")}>Tải thêm ảnh, video</button></div>
        </>
      )}
    </>
  );
}
