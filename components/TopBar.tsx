"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { fmtTr } from "@/lib/data";
import { Icon } from "./Icon";

const STEPS = [
  { n: 1, label: "Thương hiệu", href: "/ho-so", match: ["/ho-so", "/ket-noi"] },
  { n: 2, label: "Thị trường", href: "/tiem-nang", match: ["/tiem-nang", "/chien-luoc"] },
  { n: 3, label: "Triển khai", href: "/trien-khai", match: ["/trien-khai"] },
];

export function TopBar() {
  const path = usePathname();
  const s = useStore();
  const waitHref = s.phase === "before" ? "/chien-luoc" : "/trien-khai";
  return (
    <header className="top">
      <Link href="/chon-thuong-hieu" className="brandpick"><span className="av" aria-hidden="true">{initials(s.brand.name)}</span>{s.brand.name}{s.brand.sample && <small>· ví dụ</small>} <Icon name="down" size={12} /></Link>
      <div className="top-mid">
        {s.pending > 0
          ? <Link href={waitHref} className="waitchip">{s.pending} việc chờ<span className="long"> bạn quyết</span></Link>
          : <span className="nowait">Không có việc chờ bạn</span>}
        {s.halted ? <span className="haltnote"><span className="full">Đang dừng mọi chi tiêu</span><span className="short">Đang dừng chi</span></span> : <span className="spend num">Đã chi {fmtTr(s.spent)} / trần {fmtTr(s.cap)}</span>}
        <button className={`topbtn stopbtn${s.halted ? " halted" : ""}`} aria-pressed={s.halted} aria-label={s.halted ? "Bật lại chi tiêu" : "Dừng mọi chi tiêu"} onClick={() => s.setHalted(!s.halted)}>
          {!s.halted && <Icon name="stop" size={12} />}<span className="full">{s.halted ? "Bật lại chi tiêu" : "Dừng mọi chi tiêu"}</span><span className="short">{s.halted ? "Bật lại" : "Dừng"}</span>
        </button>
      </div>
      <nav className="steps" aria-label="Ba bước">
        {STEPS.map((st) => (
          <Link key={st.n} href={st.href} aria-current={st.match.some((m) => path.startsWith(m)) ? "page" : undefined}>
            <b>{st.n}</b><span>{st.label}</span>
          </Link>
        ))}
      </nav>
      <button className="topbtn chat-toggle" aria-expanded={s.chatOpen} onClick={() => s.setChatOpen(!s.chatOpen)}><Icon name="chat" /> Chat</button>
    </header>
  );
}

export function SubTabs({ items }: { items: { label: string; href?: string; soon?: string; count?: number; wait?: boolean }[] }) {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Mục con">
      {items.map((it) => it.href
        ? <Link key={it.label} href={it.href} aria-current={path === it.href ? "page" : undefined}>{it.label}{it.count != null && <span className={`count${it.wait ? " wait" : ""}`}>{it.count}</span>}</Link>
        : <span key={it.label} aria-disabled="true" title={`Có ở bản ${it.soon}`}>{it.label} <span className="tag">{it.soon}</span></span>)}
    </nav>
  );
}

function initials(name: string) {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : w[0]?.[1] ?? "")).toUpperCase();
}
