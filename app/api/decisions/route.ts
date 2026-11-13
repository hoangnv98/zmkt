import { z } from "zod";
import { withBrand } from "@/lib/server/http";
import { decide } from "@/lib/server/zmkt";

// Giao diện gửi id của lần xin duyệt và lựa chọn. "pending" nghĩa là mở lại quyết định.
// Lựa chọn hợp lệ được kiểm với danh sách options của chính lần xin duyệt đó.
const Body = z.object({ approvalId: z.string().uuid(), choice: z.string().min(1).max(40) });

export const POST = (req: Request) => withBrand(async (b, actor) => decide(b, Body.parse(await req.json()), actor));
