"use client";
import Link from "next/link";
import { use } from "react";
import { useStore } from "@/lib/store";
import { CAP_WEEK, TR, WEEKS, fmtDay, fmtTr, fmtVnd, spentByWeek, youngWeeks } from "@/lib/data";
import { TetDecision } from "@/components/Decisions";
import { SubTabs } from "@/components/TopBar";
import { Icon } from "@/components/Icon";

const PX_PER_TR = 7;

export default function ChienLuoc({ searchParams }: { searchParams: Promise<{ nhom?: string }> }) {
  const { nhom } = use(searchParams);
  const s = useStore();
  // Chiến lược và nhóm khách đọc từ cơ sở dữ liệu. Nhóm ưu tiên 1 là mặc định.
  const main = s.strategies.find((x) => x.segmentRank === 1);
  const other = s.strategies.find((x) => x.segmentRank === 2);
  const segOf = (id?: string) => s.segments.find((g) => g.id === id);
  const seg1 = s.segments.find((g) => g.rank === 1), seg2 = s.segments.find((g) => g.rank === 2);
  const showTet = (nhom === "2" || nhom === "tet") && Boolean(other);
  const tetWait = other?.status === "waiting";
  const mainWait = main?.status === "waiting";
  const tabs = [{ label: "Tiềm năng", href: "/tiem-nang" }, { label: "Chiến lược", href: "/chien-luoc", count: (mainWait ? 1 : 0) + (tetWait ? 1 : 0) || undefined, wait: true }];
  const capTr = fmtTr(s.cap).replace(" tr", "");
  const stage = (kind: "trial" | "expand" | "accelerate") => main?.stages.find((x) => x.kind === kind);
  const stageSub = (kind: "trial" | "expand" | "accelerate") => { const g = stage(kind); return g ? `${kind === "accelerate" ? "tối đa " : kind === "trial" ? "2 tuần · " : ""}${fmtTr(g.budgetVnd / 1_000_000).replace(" tr", "")} triệu ₫${g.budgetPeriod === "month" ? " mỗi tháng" : ""}` : ""; };

  const approve = (full: boolean) => s.approveFirst(full);

  // Lộ trình: Thử (T41-42), Mở rộng (T43-46), Tăng tốc (T47-48)
  const stage1 = s.phase === "before" ? "plan-wait" : "done";
  const stage2 = s.phase !== "after" ? "plan-ok" : s.expand === "pending" ? "plan-wait" : s.expand === "approved" ? "approved settle" : s.expand === "extend" ? "plan-ok" : "off";
  // Cùng nguồn số với Triển khai; thêm phần mới là kế hoạch (pl), chưa hỏi bạn
  // Chiến dịch của giai đoạn thử: trần riêng của từng chiến dịch và số đã chi thật.
  const trialCamps = s.campaigns.filter((c) => c.strategyId === main?.id);
  const trialTotal = trialCamps.reduce((n, c) => n + c.trialBudgetVnd, 0);
  const trialSpent = trialCamps.reduce((n, c) => n + c.spentVnd, 0);
  const weekly = youngWeeks(s.phase, s.expand, spentByWeek(trialCamps)).map((c, i) => {
    let pl = 0;
    const stopped = s.phase === "after" && s.expand === "stopped";
    if (i >= 2 && !stopped) {
      const tetShare = i >= 6 && s.phase === "after" && s.tet !== "declined" ? 2.5 : 0;
      const target = i >= 6 ? 7.5 - tetShare : 3.75;
      const extending = s.phase === "after" && s.expand === "extend" && i < 4;
      pl = extending ? 0 : Math.max(0, target - c.a - c.ok - c.w);
    }
    return { ...c, pl };
  });

  if (!main || !seg1) {
    return (
      <>
        <div className="pagehead"><h1>Chiến lược theo nhóm khách</h1><div className="grow"><SubTabs items={tabs} /></div></div>
        <div className="empty"><b>Chưa có chiến lược nào</b>Z.MKT lên chiến lược sau khi bạn xem xong nhóm khách ở mục Tiềm năng.</div>
      </>
    );
  }

  return (
    <>
      <div className="pagehead">
        <h1>Chiến lược theo nhóm khách</h1>
        <div className="grow"><SubTabs items={tabs} /></div>
      </div>
      <div className="tabs" style={{ marginBottom: 14 }}>
        <Link href="/chien-luoc" aria-current={!showTet ? "page" : undefined}>{seg1.name}{mainWait && <span className="count wait">chờ duyệt</span>}</Link>
        {seg2 && (other
          ? <Link href="/chien-luoc?nhom=2" aria-current={showTet ? "page" : undefined}>{seg2.name}{tetWait && <span className="count wait">chờ duyệt</span>}</Link>
          : <span aria-disabled="true">{seg2.name} <span className="tag">chưa có</span></span>)}
      </div>

      {showTet && other ? (
        <>
          <dl className="defs" style={{ gridTemplateColumns: "180px minmax(0,1fr)" }}>
            <dt>Thông điệp cho nhóm này</dt><dd className="big">“{other.message}”</dd>
            <dt>Gốc từ thương hiệu</dt><dd>{other.brandRoot}</dd>
            <dt>Họ là ai</dt><dd>{segOf(other.segmentId)?.who}.</dd>
            <dt>Câu hỏi cần trả lời</dt><dd>{other.question}</dd>
            <dt>Kênh</dt><dd>Meta Ads: Facebook và Instagram</dd>
            <dt>Thời gian và ngân sách</dt><dd className="num" style={{ fontWeight: 600 }}>{other.startsOn && other.endsOn ? `${fmtDay(other.startsOn)} đến ${fmtDay(other.endsOn)} · ` : ""}thêm {fmtTr(other.budgetMonthVnd / 1_000_000).replace(" tr", "")} triệu ₫ mỗi tháng · trần chung vẫn là {capTr} triệu</dd>
          </dl>
          <TetDecision />
        </>
      ) : (
        <>
          <dl className="defs" style={{ gridTemplateColumns: "180px minmax(0,1fr)" }}>
            <dt>Thông điệp cho nhóm này</dt><dd className="big">“{main.message}”</dd>
            <dt>Gốc từ thương hiệu</dt><dd>{main.brandRoot}</dd>
            <dt>Họ là ai</dt><dd>{seg1.who}.</dd>
            <dt>Vì sao chọn {s.brand.name}</dt><dd>{seg1.why}.</dd>
            <dt>Kênh</dt><dd>Meta Ads: Facebook và Instagram. Kênh thứ hai có ở bản v1.0.</dd>
            <dt>Chia tiền chạy thử</dt>
            <dd>
              <div className="split" role="img" aria-label={trialCamps.map((c) => `${c.name} ${fmtTr(c.trialBudgetVnd / TR)}`).join(", ")}>
                {trialCamps.map((c, i) => {
                  const pct = trialTotal ? Math.round((c.trialBudgetVnd / trialTotal) * 100) : 0;
                  return <span key={c.id} style={{ width: `${pct}%`, background: i === 0 ? "var(--navy)" : "var(--grey-bar)" }}>{c.name} · {fmtTr(c.trialBudgetVnd / TR)} · {pct}%</span>;
                })}
              </div>
            </dd>
            <dt>Mục tiêu và tiêu chí</dt><dd className="num" style={{ fontWeight: 600 }}>{main.goalOrdersMonth ? `${main.goalOrdersMonth} đơn mỗi tháng · ` : ""}chi phí mỗi đơn dưới {fmtVnd(main.criterionVnd)} · trần {capTr} triệu ₫ mỗi tháng</dd>
          </dl>

          <h2 className="sec">Lộ trình ngân sách · chỉ tăng khi có kết quả</h2>
          <div className="scroll-x">
            <div className="plan road">
              <div className="h l">Giai đoạn</div>
              {WEEKS.map((w) => <div key={w.id} className="h">{w.id}<small>{w.from}</small></div>)}
              <div className="h l">Điều kiện để sang giai đoạn này</div>

              <div className="name"><b>{stage("trial")?.name}</b><small>{stageSub("trial")}</small></div>
              <div className="flight" style={{ gridColumn: "span 2" }}><div className={`f ${s.phase === "running" ? "approved" : stage1}`}>{s.phase === "before" ? "Chờ bạn duyệt" : s.phase === "running" ? "Đã duyệt · đang chạy" : `Xong · ${fmtTr(trialSpent / TR)}`}</div></div>
              <div style={{ gridColumn: "span 6" }} />
              <div>{stage("trial")?.entryCondition}</div>

              <div className="name"><b>{stage("expand")?.name}</b><small>{stageSub("expand")}</small></div>
              <div style={{ gridColumn: "span 2" }} />
              <div className="flight" style={{ gridColumn: "span 4" }}><div key={stage2} className={`f ${stage2}`}>{s.phase !== "after" ? "Kế hoạch" : s.expand === "pending" ? "Chờ bạn quyết" : s.expand === "approved" ? "Đã duyệt · 15 tr/tháng" : s.expand === "extend" ? "Kế hoạch · sau khi thử thêm 2 tuần" : "Đã dừng"}</div></div>
              <div style={{ gridColumn: "span 2" }} />
              <div>{stage("expand")?.entryCondition}</div>

              <div className="name"><b>{stage("accelerate")?.name}</b><small>{stageSub("accelerate")}</small></div>
              <div style={{ gridColumn: "span 6" }} />
              <div className="flight" style={{ gridColumn: "span 2" }}><div className="f plan-ok">Kế hoạch</div></div>
              <div>{stage("accelerate")?.entryCondition}</div>
            </div>
            <div className="bud road">
              <div><b>Tiền mỗi tuần nếu đi hết lộ trình</b>
                <div className="legend muted"><span><i style={{ background: "var(--navy)" }} />đã chi</span><span><i style={{ background: "var(--navy-l)", outline: "1px solid var(--navy-2)" }} />đã duyệt</span><span><i style={{ background: "var(--orange-l)", outline: "1px dashed var(--orange)" }} />chờ bạn</span><span><i style={{ background: "repeating-linear-gradient(135deg, var(--navy-l) 0 4px, #fff 4px 8px)", outline: "1px dashed var(--navy-2)" }} />kế hoạch</span></div></div>
              {weekly.map((v, i) => (
                <div className="col" key={i}>
                  <div className="capline" style={{ bottom: 6 + 17 + CAP_WEEK * PX_PER_TR }} />{i === 0 && <span className="caplabel" style={{ bottom: 6 + 17 + CAP_WEEK * PX_PER_TR - 9 }}>trần 7,5 tr</span>}
                  <i className="pl" style={{ height: v.pl * PX_PER_TR }} /><i className="w" style={{ height: v.w * PX_PER_TR }} /><i className="p" style={{ height: v.ok * PX_PER_TR }} /><i className="a" style={{ height: v.a * PX_PER_TR }} />
                  <span>{v.a + v.ok + v.w + v.pl ? fmtTr(v.a + v.ok + v.w + v.pl) : "0"}</span>
                </div>
              ))}
              <div className="muted">Vạch đỏ đứt là trần 7,5 triệu mỗi tuần cho mọi nhóm khách cộng lại. {s.phase === "after" && s.tet !== "declined" ? "Từ T47 nhóm này chừa 2,5 triệu mỗi tuần cho Hộp quà Tết." : "Tăng tốc chạm trần chứ không vượt."}</div>
            </div>
          </div>

          {s.phase === "before" ? (
            <div className="decide">
              <p>Duyệt chiến lược cho nhóm {seg1.name}?<small>{s.halted ? "Mọi chi tiêu đang dừng. Bật lại ở thanh trên cùng rồi mới duyệt được." : "Sau khi duyệt, Z.MKT tự chạy trong khung này và chỉ hỏi bạn khi vượt khung."}</small></p>
              <button className="btn ghost" disabled={s.halted} onClick={() => approve(false)}>Chạy thử trước · 2 tuần · 5 tr</button>
              <button className="btn" disabled={s.halted} onClick={() => approve(true)}>Duyệt và chạy đầy đủ <Icon name="arrow" /></button>
            </div>
          ) : (
            <div className="notice">
              <p>Bạn đã duyệt chạy thử ngày 5/10. Muốn đổi ngân sách hay thông điệp, cứ nhắn trong chat.</p>
              <Link className="btn ghost sm" href="/trien-khai">Xem chiến dịch đang chạy <Icon name="arrow" /></Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
