import { z } from "zod";
import { withBrand } from "@/lib/server/http";
import { tick } from "@/lib/server/zmkt";

// Bộ giả lập Meta Ads: chạy thêm N ngày (mặc định 1).
const Body = z.object({ days: z.number().int().min(1).max(14).default(1) });
export const POST = (req: Request) => withBrand(async (b) => {
  const { days } = Body.parse(await req.json().catch(() => ({})));
  for (let i = 0; i < days; i++) await tick(b);
});
