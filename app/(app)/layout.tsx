import { redirect } from "next/navigation";
import { StoreProvider } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { Chat } from "@/components/Chat";
import { NewBrand } from "@/components/NewBrand";
import { currentSession } from "@/lib/server/auth";
import { getState } from "@/lib/server/zmkt";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();
  if (!session) redirect("/dang-nhap");
  if (!session.brandId) redirect("/chon-thuong-hieu");
  const state = await getState(session.brandId);
  return (
    <StoreProvider initial={state}>
      <div className="shell">
        <div className="workpanel">
          <TopBar />
          <main className="work">{state.brand.sample ? children : <NewBrand />}</main>
        </div>
        <Chat />
      </div>
    </StoreProvider>
  );
}
