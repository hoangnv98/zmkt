"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { CAP_WEEK, TR, WEEKS, fmtDay, fmtTr, fmtVnd, perOrder, spentByWeek, youngWeeks } from "@/lib/data";
import { ExpandDecision, TetDecision } from "@/components/Decisions";
import { Icon } from "@/components/Icon";

const PX_PER_TR = 7;

export default function TrienKhai() {
  const s = useStore();
  const [view, setView] = useState<"week" | "list">("week");

  // Chiến dịch, số đơn và số đã chi đọc từ cơ sở dữ liệu. Nhóm ưu tiên 1 có các chiến dịch chạy thử.
  const main = s.strategies.find((x) => x.segmentRank === 1);
  const tetSt = s.strategies.find((x) => x.segmentRank === 2);
  const trial = s.campaigns.filter((c) => c.strategyId === main?.id);
  const tetCamp = s.campaigns.find((c) => c.strategyId === tetSt?.id);

  if (s.phase === "before" || trial.length < 2 || !main) {
    return (
      <>
        <div className="pagehead"><h1>Kế hoạch chiến dịch</h1></div>
        <div className="empty">
          <b>Chưa có chiến dịch nào</b>
          Z.MKT chỉ chạy quảng cáo sau khi bạn duyệt chiến lược. {main ? `Chiến lược cho nhóm ${trial[0]?.segmentName ?? "ưu tiên 1"} đang chờ bạn.` : "Chưa có chiến lược nào để duyệt."}
          <div><Link className="btn" href="/chien-luoc">Xem chiến lược chờ duyệt <Icon name="arrow" /></Link></div>
        </div>
      </>
    );
  }

  const after = s.phase === "after";
  const nowWeek = after ? 2 : 0;
  const [c1, c2] = trial;
  const CRITERION = main.criterionVnd;
  const totalOrders = trial.reduce((n, c) => n + c.orders, 0);
  const totalSpent = trial.reduce((n, c) => n + c.spentVnd, 0);
  const trialBudget = trial.reduce((n, c) => n + c.trialBudgetVnd, 0);
  const tr = (vnd: number) => fmtTr(vnd / TR);
  const met = (c: { spentVnd: number; orders: number }) => c.orders > 0 && perOrder(c) <= CRITERION;
  const tetPeriod = tetSt?.startsOn && tetSt.endsOn ? `${fmtDay(tetSt.startsOn)} đến ${fmtDay(tetSt.endsOn)}` : "";
  const tetBudget = tetSt ? tr(tetSt.budgetMonthVnd) : "";

  // Tiền theo tuần: a = đã chi, ok = đã duyệt, w = chờ bạn quyết
  const weeks = youngWeeks(s.phase, s.expand, spentByWeek(trial)).map((c, i) => {
    const col = { ...c };
    if (after && i >= 6) { if (s.tet === "pending") col.w += 2.5; if (s.tet === "approved") col.ok += 2.5; }
    return col;
  });

  const expandFlight = !after ? null
    : s.expand === "pending" ? { cls: "plan-wait", span: 6, text: "Mở rộng · 15 tr/tháng · chờ bạn quyết" }
    : s.expand === "approved" ? { cls: "approved settle", span: 6, text: "Mở rộng · 15 tr/tháng · đã duyệt" }
    : s.expand === "extend" ? { cls: "approved settle", span: 2, text: "Thử thêm 2 tuần · 5 tr · đã duyệt" }
    : null;

  return (
    <>
      <div className="pagehead">
        <h1>Kế hoạch chiến dịch</h1>
        <div className="tabs" role="group" aria-label="Cách xem">
          <button aria-pressed={view === "week"} onClick={() => setView("week")}>Theo tuần</button>
          <button aria-pressed={view === "list"} onClick={() => setView("list")}>Danh sách</button>
        </div>
        {after ? (
          <div className="kpis grow">
            <span><b>{totalOrders}</b>đơn trong 2 tuần thử</span>
            <span><b>{tr(totalSpent)} ₫</b>đã chi trên {tr(trialBudget)}</span>
            <span className={met({ spentVnd: totalSpent, orders: totalOrders }) ? "ok" : "bad"}><b>{fmtVnd(perOrder({ spentVnd: totalSpent, orders: totalOrders }))}</b>mỗi đơn · tiêu chí {fmtVnd(CRITERION)}</span>
          </div>
        ) : (
          <div className="kpis grow"><span><b>Ngày {Math.max(1, s.simDay)} / 14</b>chạy thử đến 18/10</span><span><b>{totalSpent ? tr(totalSpent) : "0"} / {tr(trialBudget)} ₫</b>đã chi</span></div>
        )}
      </div>

      {s.halted && <div className="notice" style={{ marginTop: 0, marginBottom: 14 }}><p><b>Mọi chi tiêu đang dừng theo lệnh của bạn.</b> Không chiến dịch nào tiêu tiền cho tới khi bạn bật lại.</p><button className="btn sm" onClick={() => s.setHalted(false)}>Bật lại chi tiêu</button></div>}

      {view === "week" ? (
        <div className="scroll-x">
          <div className={`plan${s.halted ? " halted" : ""}`} aria-label="Chiến dịch theo tuần">
            <div className="h l">Chiến dịch · Meta Ads</div>
            {WEEKS.map((w, i) => <div key={w.id} className={`h${i === nowWeek ? " now" : ""}`}>{w.id}<small>{w.from}</small></div>)}
            <div className="h">Đơn</div><div className="h">Đã chi</div><div className="h">Chi phí / đơn</div>

            <div className="grp">{c1.segmentName.toUpperCase()} · {after ? `chạy thử ${tr(trialBudget).replace(" tr", "")} triệu ₫ đã xong` : `đang chạy thử ${tr(trialBudget).replace(" tr", "")} triệu ₫`}</div>
            <div className="name"><Link href={`/trien-khai/${c1.seq}`}><span className="idx">#{c1.seq}</span><b>{c1.name}</b></Link>
              <small>{!after ? (s.halted ? "Đang dừng theo lệnh của bạn" : `Đang chạy · trần ${tr(c1.trialBudgetVnd).replace(" tr", "")} triệu ₫`) : s.expand === "stopped" ? "Đạt · bạn đã dừng" : "Đạt tiêu chí · đề xuất mở rộng"}</small></div>
            <div className="flight" style={{ gridColumn: "span 2" }}><div className={`f ${after ? "done" : "approved"}`}>{after ? `Thử · ${tr(c1.spentVnd)}` : `Đã duyệt · trần ${tr(c1.trialBudgetVnd)}`}</div></div>
            {expandFlight
              ? <><div className="flight" style={{ gridColumn: `span ${expandFlight.span}` }}>{s.expand === "pending" ? <a href="#quyet-mo-rong" className={`f ${expandFlight.cls}`}>{expandFlight.text}</a> : <div key={s.expand} className={`f ${expandFlight.cls}`}>{expandFlight.text}</div>}</div>{expandFlight.span < 6 && <div style={{ gridColumn: `span ${6 - expandFlight.span}` }} />}</>
              : <div style={{ gridColumn: "span 6" }} />}
            <div className="n">{c1.orders || (after ? 0 : "–")}</div><div className="n">{c1.spentVnd ? tr(c1.spentVnd) : "0"}</div>
            <div className={`n${after ? (met(c1) ? " ok" : " bad") : ""}`}>{c1.orders ? fmtVnd(perOrder(c1)) : "–"}<small>{after ? (met(c1) ? "dưới tiêu chí" : "trên tiêu chí") : `tiêu chí ${fmtVnd(CRITERION)}`}</small></div>

            <div className="name"><Link href={`/trien-khai/${c2.seq}`}><span className="idx">#{c2.seq}</span><b>{c2.name}</b></Link>
              <small>{!after ? (s.halted ? "Đang dừng theo lệnh của bạn" : `Đang chạy · trần ${tr(c2.trialBudgetVnd).replace(" tr", "")} triệu ₫`) : s.expand === "pending" ? "Chưa đạt · sẽ dừng sau khi bạn quyết" : "Chưa đạt · đã dừng"}</small></div>
            <div className="flight" style={{ gridColumn: "span 2" }}><div className={`f ${after ? "off" : "approved"}`}>{after ? `Thử · ${tr(c2.spentVnd)}` : `Đã duyệt · trần ${tr(c2.trialBudgetVnd)}`}</div></div>
            <div style={{ gridColumn: "span 6" }} />
            <div className="n">{c2.orders || (after ? 0 : "–")}</div><div className="n">{c2.spentVnd ? tr(c2.spentVnd) : "0"}</div>
            <div className={`n${after ? (met(c2) ? " ok" : " bad") : ""}`}>{c2.orders ? fmtVnd(perOrder(c2)) : "–"}<small>{after ? (met(c2) ? "dưới tiêu chí" : "trên tiêu chí") : `tiêu chí ${fmtVnd(CRITERION)}`}</small></div>

            {after && tetSt && tetCamp && <>
              <div className="grp">{tetCamp.segmentName.toUpperCase()} · chiến lược mới</div>
              <div className="name"><span className="idx">#{tetCamp.seq}</span><b>{tetCamp.name}</b><small>{s.tet === "declined" ? "Bạn chưa muốn chạy" : `${tetPeriod} · +${tetBudget}/tháng`}</small></div>
              <div style={{ gridColumn: "span 6" }} />
              <div className="flight" style={{ gridColumn: "span 2" }}>
                {s.tet === "pending" ? <a href="#quyet-tet" className="f plan-wait">Chờ bạn duyệt</a>
                  : s.tet === "approved" ? <div className="f approved settle">Đã duyệt · từ {tetSt.startsOn ? fmtDay(tetSt.startsOn) : ""}</div> : null}
              </div>
              <div className="n">–</div><div className="n">–</div><div className="n">{fmtVnd(tetSt.criterionVnd)}<small>tiêu chí</small></div>
            </>}
          </div>

          <div className="bud" aria-label="Ngân sách theo tuần">
            <div><b>Ngân sách theo tuần</b>
              <div className="legend muted">
                <span><i style={{ background: "var(--navy)" }} />đã chi</span>
                <span><i style={{ background: "var(--navy-l)", outline: "1px solid var(--navy-2)" }} />đã duyệt</span>
                <span><i style={{ background: "var(--orange-l)", outline: "1px dashed var(--orange)" }} />chờ bạn</span>
              </div></div>
            {weeks.map((w, i) => {
              const sum = w.a + w.ok + w.w;
              return (
                <div className="col" key={i}>
                  <div className="capline" style={{ bottom: 6 + 17 + CAP_WEEK * PX_PER_TR }} />{i === 0 && <span className="caplabel" style={{ bottom: 6 + 17 + CAP_WEEK * PX_PER_TR - 9 }}>trần 7,5 tr</span>}
                  <i className="w" style={{ height: w.w * PX_PER_TR }} /><i className="p" style={{ height: w.ok * PX_PER_TR }} /><i className="a" style={{ height: w.a * PX_PER_TR }} />
                  <span>{sum ? fmtTr(sum) : "0"}</span>
                </div>
              );
            })}
            <div className="muted">Vạch đỏ đứt là trần {fmtTr(s.cap).replace(" tr", "")} triệu ₫ mỗi tháng, tức 7,5 triệu mỗi tuần. Z.MKT không chi vượt vạch này.</div>
          </div>
        </div>
      ) : (
        <div className="scroll-x">
          <table className="grid" style={{ minWidth: 760 }}>
            <thead><tr><th>Chiến dịch</th><th>Câu hỏi cần trả lời</th><th className="r">Đơn</th><th className="r">Đã chi</th><th className="r">Chi phí / đơn</th><th>Kết luận</th></tr></thead>
            <tbody>
              {trial.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/trien-khai/${c.seq}`} className="link"><span className="idx">#{c.seq}</span>{c.name}</Link><small>{c.segmentName} · Meta Ads</small></td>
                  <td>{c.question}</td>
                  <td className="r">{c.orders || (after ? 0 : "–")}</td><td className="r">{c.spentVnd ? tr(c.spentVnd) : "0"}</td>
                  <td className={`r ${after ? (met(c) ? "ok" : "bad") : ""}`}>{c.orders ? fmtVnd(perOrder(c)) : "–"}</td>
                  <td>{after ? <span className={`state ${met(c) ? "ok" : "bad"}`}><Icon name={met(c) ? "check" : "x"} />{met(c) ? "Đạt tiêu chí" : "Chưa đạt"}</span> : <span className="state"><Icon name="clock" />Đang chạy</span>}</td>
                </tr>
              ))}
              {after && tetSt && tetCamp && (
                <tr className={s.tet === "pending" ? "wait" : ""}>
                  <td><span className="idx">#{tetCamp.seq}</span><b>{tetCamp.name}</b><small>{tetCamp.segmentName} · {tetPeriod}</small></td>
                  <td>{tetCamp.question}</td><td className="r">–</td><td className="r">+{tetBudget}/tháng</td><td className="r">{fmtVnd(tetSt.criterionVnd)}</td>
                  <td>{s.tet === "pending" ? <a className="link" href="#quyet-tet">Chờ bạn duyệt</a> : s.tet === "approved" ? <span className="state ok"><Icon name="check" />Đã duyệt</span> : <span className="state muted">Bạn chưa muốn chạy</span>}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ExpandDecision />
      <TetDecision withLink={<Link className="btn ghost" href="/chien-luoc?nhom=2">Xem chiến lược</Link>} />
      {s.phase === "running" && !s.halted && <div className="notice"><p>Z.MKT đang tự chạy trong khung bạn đã duyệt: {tr(trialBudget).replace(" tr", "")} triệu ₫ trong 2 tuần. Sau 18/10 mình sẽ báo kết quả và đề xuất bước tiếp.</p></div>}
    </>
  );
}
