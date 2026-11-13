"use client";
import { useStore } from "@/lib/store";
import { fmtDay, fmtTr } from "@/lib/data";

const HALT_NOTE = "Mọi chi tiêu đang dừng. Bật lại ở thanh trên cùng rồi mới duyệt được.";

// Ba lựa chọn sau đợt chạy thử. Dùng chung ở thanh quyết định và trong chat.
export function ExpandButtons({ small }: { small?: boolean }) {
  const s = useStore();
  const cls = small ? " sm" : "";
  return (
    <>
      <button className={`btn ghost${cls}`} onClick={() => { s.setExpand("stopped"); }}>Dừng hẳn</button>
      <button className={`btn ghost${cls}`} disabled={s.halted} title={s.halted ? HALT_NOTE : undefined} onClick={() => { s.setExpand("extend"); }}>Thử thêm 2 tuần · 5 tr</button>
      <button className={`btn${cls}`} disabled={s.halted} title={s.halted ? HALT_NOTE : undefined} onClick={() => { s.setExpand("approved"); }}>Tăng lên 15 tr/tháng</button>
    </>
  );
}

export function ExpandDecision() {
  const s = useStore();
  if (s.phase !== "after") return null;
  if (s.expand === "pending") {
    return (
      <div className="decide" id="quyet-mo-rong" tabIndex={-1} role="group" aria-label="Việc chờ bạn quyết">
        <p>Mở rộng “Video quy trình vẽ” lên 15 triệu ₫ mỗi tháng?<small>{s.halted ? HALT_NOTE : "Vẫn trong trần 30 triệu. Ảnh sản phẩm dừng, tiền dồn sang video."}</small></p>
        <ExpandButtons />
      </div>
    );
  }
  const text = s.expand === "approved" ? "Bạn đã duyệt mở rộng lên 15 triệu ₫ mỗi tháng từ 19/10."
    : s.expand === "extend" ? "Bạn đã chọn thử thêm 2 tuần với 5 triệu ₫, đến hết 1/11."
    : "Bạn đã dừng hẳn nhóm Người trẻ đô thị. Không còn khoản chi nào đang chạy.";
  return (
    <div className="notice" id="quyet-mo-rong">
      <p>{text}</p>
      <button className="link" onClick={() => s.setExpand("pending")}>Đổi quyết định</button>
    </div>
  );
}

export function TetDecision({ withLink }: { withLink?: React.ReactNode }) {
  const s = useStore();
  // Chiến lược của nhóm ưu tiên 2, đọc từ cơ sở dữ liệu.
  const st = s.strategies.find((x) => x.segmentRank === 2);
  const seg = s.segments.find((x) => x.id === st?.segmentId);
  if (s.phase !== "after" || !st) return null;
  const period = st.startsOn && st.endsOn ? `${fmtDay(st.startsOn)} đến ${fmtDay(st.endsOn)}` : "";
  const money = `${fmtTr(st.budgetMonthVnd / 1_000_000).replace(" tr", "")} triệu ₫ mỗi tháng`;
  if (s.tet === "pending") {
    return (
      <div className="decide" id="quyet-tet" tabIndex={-1} role="group" aria-label="Việc chờ bạn quyết">
        <p>Duyệt chiến lược “{st.name}” cho nhóm {seg?.name}?<small>{s.halted ? HALT_NOTE : `Chạy ${period}, thêm ${money}. Cộng với nhóm Người trẻ đô thị vẫn dưới trần ${fmtTr(s.cap).replace(" tr", "")} triệu.`}</small></p>
        {withLink}
        <button className="btn ghost" onClick={() => { s.setTet("declined"); }}>Chưa chạy</button>
        <button className="btn" disabled={s.halted} title={s.halted ? HALT_NOTE : undefined} onClick={() => { s.setTet("approved"); }}>Duyệt</button>
      </div>
    );
  }
  return (
    <div className="notice" id="quyet-tet">
      <p>{s.tet === "approved" ? `Bạn đã duyệt “${st.name}”. Z.MKT chạy từ ${st.startsOn ? fmtDay(st.startsOn) : "ngày đã hẹn"} với ${money}.` : `Bạn chưa muốn chạy “${st.name}”. Z.MKT không chi khoản nào cho nó.`}</p>
      <button className="link" onClick={() => s.setTet("pending")}>Đổi quyết định</button>
    </div>
  );
}
