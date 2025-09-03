import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import CreateOrgForm from "@/components/CreateOrgForm";
import CreditButton from "@/components/CreditButton";

export default async function Dashboard() {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

   // Obtener membership vía RPC (más confiable)
  const { data: memRpc } = await supabase.rpc("get_my_membership");
  let orgId: string | null = (Array.isArray(memRpc) && memRpc.length) ? (memRpc[0] as any).org_id : null;
  let balance = 0;

  if (orgId) {
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
          <CreditButton orgId={orgId} />
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
