"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmtDay } from "@/lib/data";
import { SubTabs } from "@/components/TopBar";
import type { StrategyRow } from "@/lib/types";

/** Nhãn tình trạng chiến lược của một nhóm khách, đọc từ trạng thái trong cơ sở dữ liệu. */
function strategyLabel(st: StrategyRow | undefined): { text: string; wait: boolean } {
  if (!st) return { text: "Chưa có chiến lược", wait: false };
  if (st.status === "waiting" || st.status === "draft") return { text: "Chiến lược chờ bạn duyệt", wait: true };
  if (st.status === "declined") return { text: "Bạn chưa muốn chạy", wait: false };
  const trial = st.stages.find((x) => x.kind === "trial");
  if (trial?.status === "running") return { text: "Đang chạy thử", wait: false };
  if (trial?.status === "done") return { text: "Đã chạy thử · đạt", wait: false };
  if (st.status === "active") return { text: st.startsOn ? `Đã duyệt · chạy từ ${fmtDay(st.startsOn)}` : "Đã duyệt", wait: false };
  return { text: "Đã dừng", wait: false };
}

export default function TiemNang() {
  const s = useStore();
  const waiting = s.strategies.filter((x) => strategyLabel(x).wait).length;
  const tabs = [{ label: "Tiềm năng", href: "/tiem-nang" }, { label: "Chiến lược", href: "/chien-luoc", count: waiting || undefined, wait: true }];
  const reviews = s.source?.reviewsSeen;
  return (
    <>
      <div className="pagehead">
        <h1>Nhóm khách hợp với {s.brand.name}</h1>
        <div className="grow"><SubTabs items={tabs} /></div>
      </div>
      <p className="lede">Xếp theo thứ tự nên làm trước. Mức phù hợp là ước lượng của Z.MKT từ hồ sơ thương hiệu{reviews ? ` và ${reviews} đánh giá` : ""}, chưa phải số đo thật.</p>
      {s.segments.length === 0 ? (
        <div className="empty"><b>Chưa có nhóm khách nào</b>Z.MKT đề xuất nhóm khách sau khi dựng xong hồ sơ thương hiệu.</div>
      ) : (
        <div className="scroll-x">
          <table className="grid" style={{ minWidth: 860 }}>
            <thead><tr><th>Thứ tự</th><th>Nhóm khách</th><th>Vì sao hợp</th><th>Khoảng trống chiếm được</th><th>Mức phù hợp</th><th>Chiến lược</th></tr></thead>
            <tbody>
              {s.segments.map((g) => {
                const st = s.strategies.find((x) => x.segmentId === g.id);
                const label = strategyLabel(st);
                const experiment = g.tier === "experiment";
                return (
                  <tr key={g.id} className={label.wait ? "wait" : ""}>
                    <td><span className="num" style={{ fontWeight: 700 }}>{experiment ? "Thử nghiệm" : `Ưu tiên ${g.rank}`}</span></td>
                    <td><b>{g.name}</b><small>{g.who}</small></td>
                    <td>{g.why}</td>
                    <td>{g.gap ?? "–"}</td>
                    <td><div className="fitbar"><div className="meter"><i style={{ width: `${g.fit}%`, background: experiment ? "var(--grey-bar)" : undefined }} /></div><span className="num" style={{ fontWeight: 600 }}>{g.fit}%</span></div></td>
                    <td>{st
                      ? <><Link className="link" href={g.rank === 1 ? "/chien-luoc" : `/chien-luoc?nhom=${g.rank}`}>Xem chiến lược</Link><small className={label.wait ? "state wait" : ""}>{label.text}</small></>
                      : <><button className="link" onClick={() => { s.setDraft(`Lên chiến lược cho nhóm ${g.name}`); s.setChatOpen(true); }}>Nhờ Z.MKT lên</button><small>{label.text}</small></>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
