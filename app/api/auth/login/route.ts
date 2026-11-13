import { z } from "zod";
import { open } from "@/lib/server/http";
import { login } from "@/lib/server/auth";

const Body = z.object({ email: z.string().email("Email chưa đúng dạng, ví dụ ten@congty.vn."), password: z.string().min(1, "Nhập mật khẩu.") });
export const POST = (req: Request) => open(async () => { const b = Body.parse(await req.json()); await login(b.email, b.password); });
