import { open } from "@/lib/server/http";
import { logout } from "@/lib/server/auth";

export const POST = () => open(logout);
