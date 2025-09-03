import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import CreateOrgForm from "@/components/CreateOrgForm";
import CreditControls from "@/components/CreditControls";
import OwnerClaimButton from "@/components/OwnerClaimButton";

export default async function Dashboard() {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Usar RPC robusto
  const { data: orgRpc } = await supabase.rpc("get_my_org");
  const orgId: string | null = orgRpc ? (orgRpc as unknown as string) : null;

  let balance = 0;
  let isOwner = false;
  if (orgId) {
    // ¿Eres owner?
    const { data: ownerUuid } = await supabase.rpc("get_org_owner", { p_org: orgId });
    const { data: { user: u } } = await supabase.auth.getUser();
    if (ownerUuid && u?.id && ownerUuid === u.id) {
     isOwner = true;
   }
    const { data } = await supabase
      .from("credit_ledger")
      .select("delta")
      .eq("org_id", orgId);

    if (data) {
      balance = data.reduce((acc, row) => acc + row.delta, 0);
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Panel</h1>
      <p>Hola, {user.email}</p>

      {orgId ? (
        <>
          <p className="text-lg">
            Créditos disponibles: <span className="font-bold">{balance}</span>
          </p>
          <CreditControls orgId={orgId} initialBalance={balance} isOwner={isOwner} />
            <OwnerClaimButton orgId={orgId} />
          {/* Aquí puedes añadir más UI del dashboard */}
        </>
      ) : (
        <>
          <p className="text-red-500">⚠ No perteneces a ninguna organización</p>
          <CreateOrgForm />
        </>
      )}
    </main>
  );
}
