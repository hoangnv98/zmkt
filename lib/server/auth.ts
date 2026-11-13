import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db, type Db } from "./db";
import { ZError, createBrand } from "./zmkt";
import type { Role } from "@/lib/types";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;
const N = 16384, R = 8, P = 1, LEN = 32;
const COOKIE = "zmkt_session";
const SESSION_DAYS = 30;

export const TEST_ACCOUNT = { email: "test@zmkt.vn", password: "zmkt12345", name: "Tài khoản thử" };

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, LEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function verifyPassword(pw: string, stored: string) {
  const [alg, n, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt") return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(pw, Buffer.from(salt, "base64"), expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(key, expected);
}

// So sánh với một mật khẩu giả khi email không tồn tại, để thời gian trả lời như nhau.
let dummy: Promise<string> | undefined;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type Session = { userId: string; email: string; name: string; brandId: string | null; role: Role | null };

async function insertUser(q: Db, email: string, name: string, password: string) {
  const [{ id }] = await q.query<{ id: string }>("insert into users (email, name, password_hash) values ($1, $2, $3) returning id", [email, name, await hashPassword(password)]);
  // Mỗi tài khoản mới có sẵn một thương hiệu ví dụ để xem cách Z.MKT làm việc.
  await createBrand(q, id, { name: "Gốm Lam", shopUrl: "shopee.vn/gomlam", capVnd: 30_000_000, sample: true });
  return id;
}

/** Tạo tài khoản thử nếu cơ sở dữ liệu chưa có người dùng nào. */
export async function ensureTestAccount() {
  const d = await db();
  const [r] = await d.query<{ n: string }>("select count(*) as n from users");
  if (Number(r.n) > 0) return;
  await d.tx((q) => insertUser(q, TEST_ACCOUNT.email, TEST_ACCOUNT.name, TEST_ACCOUNT.password));
}

export async function register(email: string, name: string, password: string) {
  const d = await db();
  const e = email.trim().toLowerCase();
  const [exists] = await d.query("select 1 from users where lower(email) = $1", [e]);
  if (exists) throw new ZError(409, "Email này đã có tài khoản. Đăng nhập thay vì tạo mới.");
  const id = await d.tx((q) => insertUser(q, e, name.trim(), password));
  await startSession(id);
}

export async function login(email: string, password: string) {
  await ensureTestAccount();
  const d = await db();
  const [u] = await d.query<{ id: string; password_hash: string }>("select id, password_hash from users where lower(email) = $1 and disabled_at is null", [email.trim().toLowerCase()]);
  dummy ??= hashPassword(randomBytes(12).toString("hex"));
  const ok = await verifyPassword(password, u?.password_hash ?? (await dummy));
  if (!u || !ok) throw new ZError(401, "Email hoặc mật khẩu chưa đúng.");
  await startSession(u.id);
}

async function startSession(userId: string) {
  const d = await db();
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await d.query("insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [sha256(token), userId, expires.toISOString()]);
  await d.query("delete from sessions where expires_at < now()");
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await (await db()).query("delete from sessions where token_hash = $1", [sha256(token)]);
  jar.delete(COOKIE);
}

export async function currentSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const d = await db();
  const [s] = await d.query<{ user_id: string; email: string; name: string; brand_id: string | null; role: Role | null }>(
    `select s.user_id, u.email, u.name, m.brand_id, m.role
       from sessions s join users u on u.id = s.user_id and u.disabled_at is null
       left join brand_members m on m.brand_id = s.brand_id and m.user_id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`, [sha256(token)]);
  return s ? { userId: s.user_id, email: s.email, name: s.name, brandId: s.brand_id, role: s.role } : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Chọn thương hiệu đang làm việc. Chỉ chọn được thương hiệu mình là thành viên. */
export async function selectBrand(session: Session, brandId: string) {
  const d = await db();
  const [b] = UUID.test(brandId)
    ? await d.query("select 1 from brand_members m join brands b on b.id = m.brand_id where m.brand_id = $1 and m.user_id = $2 and b.archived_at is null", [brandId, session.userId])
    : [];
  if (!b) throw new ZError(404, "Không tìm thấy thương hiệu này trong tài khoản của bạn.");
  const token = (await cookies()).get(COOKIE)?.value;
  await d.query("update sessions set brand_id = $2 where token_hash = $1", [sha256(token ?? ""), brandId]);
}

export { COOKIE as SESSION_COOKIE };
