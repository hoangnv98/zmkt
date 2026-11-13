import { z } from "zod";
import { withBrand } from "@/lib/server/http";
import { setMetaConnected } from "@/lib/server/zmkt";

const Body = z.object({ kind: z.literal("meta_ads"), connected: z.boolean() });
export const POST = (req: Request) => withBrand(async (b, actor) => setMetaConnected(b, Body.parse(await req.json()).connected, actor));
