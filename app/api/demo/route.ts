import { z } from "zod";
import { withBrand } from "@/lib/server/http";
import { reseed } from "@/lib/server/zmkt";

// Nạp lại dữ liệu mẫu ở một thời điểm. Chỉ cho thương hiệu ví dụ.
const Body = z.object({ stage: z.enum(["before", "running", "after"]) });
export const POST = (req: Request) => withBrand(async (b, actor) => reseed(b, Body.parse(await req.json()).stage, actor));
