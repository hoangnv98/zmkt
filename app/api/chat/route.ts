import { z } from "zod";
import { withBrand } from "@/lib/server/http";
import { addChat, getState, history } from "@/lib/server/zmkt";
import { reply } from "@/lib/server/agent";

const Body = z.object({ text: z.string().trim().min(1).max(2000) });
export const POST = (req: Request) => withBrand(async (b, actor) => {
  const { text } = Body.parse(await req.json());
  await addChat(b, "user", text, actor.userId);
  await addChat(b, "assistant", await reply(await getState(b), await history(b)));
});
