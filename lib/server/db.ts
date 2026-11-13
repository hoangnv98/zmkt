import "server-only";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Một lớp truy vấn duy nhất cho cả hai nơi chạy:
//  - Không có DATABASE_URL: PGlite (Postgres nhúng), dữ liệu nằm ở .data/pg. Không cần Docker.
//  - Có DATABASE_URL: Postgres thật (Supabase hoặc máy chủ riêng) qua thư viện `postgres`.
export type Row = Record<string, unknown>;
export interface Db {
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  tx<T>(fn: (q: Db) => Promise<T>): Promise<T>;
  exec(sql: string): Promise<void>;
}

const SCHEMA_VERSION = 6; // v3 bước 4

async function openPglite(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pg");
  mkdirSync(dir, { recursive: true });
  const pg = await PGlite.create(dir);
  const wrap = (q: { query: typeof pg.query; exec: typeof pg.exec }): Db => ({
    query: async (sql, params = []) => (await q.query(sql, params)).rows as never,
    exec: async (sql) => { await q.exec(sql); },
    tx: (fn) => pg.transaction((t) => fn(wrap(t as never))),
  });
  return wrap(pg);
}

async function openPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 5, prepare: false });
  const wrap = (s: typeof sql): Db => ({
    query: async (q, params = []) => (await s.unsafe(q, params as never[])) as never,
    exec: async (q) => { await s.unsafe(q); },
    tx: (fn) => sql.begin((t) => fn(wrap(t as never))) as never,
  });
  return wrap(sql);
}

// Bản thử: khi schema đổi phiên bản thì dựng lại từ đầu (chỉ khi chạy PGlite local).
async function migrate(d: Db) {
  await d.exec("create table if not exists schema_version (v int not null)");
  const [row] = await d.query<{ v: number }>("select v from schema_version limit 1");
  if (row?.v === SCHEMA_VERSION) return;
  if (row && process.env.DATABASE_URL) throw new Error(`Schema đang ở v${row.v}, cần v${SCHEMA_VERSION}. Hãy chạy migration trên Postgres thật.`);
  // Dựng lại từ đầu: xoá cả bảng, view, hàm và trigger của phiên bản cũ.
  // Trên Postgres thật không bao giờ tự xoá: chỉ dựng schema vào cơ sở dữ liệu còn trống.
  if (!process.env.DATABASE_URL) {
    await d.exec("drop schema public cascade; create schema public;");
    await d.exec("create table schema_version (v int not null)");
  }
  await d.exec(readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"));
  await d.exec("delete from schema_version");
  await d.query("insert into schema_version (v) values ($1)", [SCHEMA_VERSION]);
}

const g = globalThis as unknown as { __zmktDb?: Promise<Db> };

export function db(): Promise<Db> {
  g.__zmktDb ??= (async () => {
    const d = process.env.DATABASE_URL ? await openPostgres(process.env.DATABASE_URL) : await openPglite();
    await migrate(d);
    return d;
  })();
  // Lỗi lúc mở thì lần gọi sau thử lại, không giữ lời hứa hỏng.
  g.__zmktDb.catch(() => { g.__zmktDb = undefined; });
  return g.__zmktDb;
}
