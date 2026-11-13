import { z } from "zod";
import { withUser } from "@/lib/server/http";
import { createBrand, listBrands } from "@/lib/server/zmkt";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";
export const GET = () => withUser(async (s) => ({ user: { name: s.name, email: s.email }, brands: await listBrands(s.userId) }));

const Body = z.object({
  name: z.string().trim().min(1, "Cần tên thương hiệu để tạo.").max(80),
  shopUrl: z.string().trim().max(300).optional(),
  capTr: z.number().int("Trần là số triệu ₫ nguyên.").min(1, "Trần ít nhất 1 triệu ₫ mỗi tháng.").max(10_000),
});
export const POST = (req: Request) => withUser(async (s) => {
  const b = Body.parse(await req.json());
  const d = await db();
  const id = await d.tx((q) => createBrand(q, s.userId, { name: b.name, shopUrl: b.shopUrl, capVnd: b.capTr * 1_000_000 }));
  return { id, brands: await listBrands(s.userId) };
});
