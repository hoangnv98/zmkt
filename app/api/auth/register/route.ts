import { z } from "zod";
import { open } from "@/lib/server/http";
import { register } from "@/lib/server/auth";

const Body = z.object({
  name: z.string().trim().min(1, "Cần tên của bạn.").max(80),
  email: z.string().email("Email chưa đúng dạng, ví dụ ten@congty.vn."),
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.").max(200),
});
export const POST = (req: Request) => open(async () => { const b = Body.parse(await req.json()); await register(b.email, b.name, b.password); });
