import { z } from "zod";
import { withBrand } from "@/lib/server/http";
import { importOrders } from "@/lib/server/orders";

// Trình duyệt đọc file CSV thành chữ rồi gửi lên. Giới hạn 2 MB mỗi lần nhập.
const Body = z.object({
  fileName: z.string().trim().min(1).max(200),
  source: z.enum(["shopee", "tiktok_shop", "lazada", "website", "other"]),
  csv: z.string().min(1, "File trống.").max(2_000_000, "File lớn hơn 2 MB. Chia nhỏ rồi nhập tiếp."),
});

export const POST = (req: Request) => withBrand(async (b, actor) => importOrders(b, Body.parse(await req.json()), actor));
