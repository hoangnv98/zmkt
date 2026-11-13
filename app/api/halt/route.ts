import { z } from "zod";
import { withBrand } from "@/lib/server/http";
import { setHalted } from "@/lib/server/zmkt";

const Body = z.object({ halted: z.boolean() });
export const POST = (req: Request) => withBrand(async (b, actor) => setHalted(b, Body.parse(await req.json()).halted, actor));
