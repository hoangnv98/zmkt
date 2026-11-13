import { withBrand } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const GET = () => withBrand(async () => {});
