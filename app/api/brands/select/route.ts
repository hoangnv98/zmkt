import { z } from "zod";
import { withUser } from "@/lib/server/http";
import { selectBrand } from "@/lib/server/auth";

const Body = z.object({ id: z.string().min(1) });
export const POST = (req: Request) => withUser(async (s) => selectBrand(s, Body.parse(await req.json()).id));
