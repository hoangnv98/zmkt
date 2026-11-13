import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ZError, getState } from "./zmkt";
import { currentSession, type Session } from "./auth";
import type { Actor } from "@/lib/types";

function fail(e: unknown) {
  if (e instanceof ZError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Dữ liệu gửi lên không hợp lệ.", issues: e.issues }, { status: 400 });
  console.error(e);
  return NextResponse.json({ error: "Máy chủ gặp lỗi. Thử lại sau." }, { status: 500 });
}

/** Route cần đăng nhập, không cần thương hiệu. */
export async function withUser(fn: (s: Session) => Promise<unknown>) {
  try {
    const s = await currentSession();
    if (!s) return NextResponse.json({ error: "Phiên đăng nhập đã hết. Đăng nhập lại nhé." }, { status: 401 });
    const out = await fn(s);
    return NextResponse.json(out ?? { ok: true });
  } catch (e) { return fail(e); }
}

/** Route làm việc trên thương hiệu đang chọn. Trả về toàn bộ trạng thái sau khi đổi. */
export async function withBrand(fn: (brandId: string, actor: Actor) => Promise<unknown>) {
  let brandId: string | null = null;
  try {
    const s = await currentSession();
    if (!s) return NextResponse.json({ error: "Phiên đăng nhập đã hết. Đăng nhập lại nhé." }, { status: 401 });
    if (!s.brandId || !s.role) return NextResponse.json({ error: "Chọn một thương hiệu trước." }, { status: 409 });
    brandId = s.brandId;
    await fn(brandId, { userId: s.userId, role: s.role });
    return NextResponse.json(await getState(brandId));
  } catch (e) {
    const res = fail(e);
    if (brandId && e instanceof ZError) {
      const body = await res.json();
      return NextResponse.json({ ...body, state: await getState(brandId) }, { status: res.status });
    }
    return res;
  }
}

/** Route công khai (đăng nhập, đăng ký). */
export async function open(fn: () => Promise<unknown>) {
  try { return NextResponse.json((await fn()) ?? { ok: true }); } catch (e) { return fail(e); }
}
