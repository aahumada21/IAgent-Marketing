import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import SupabaseStatusClient from "./SupabaseStatusClient";

export default async function AppHeader() {
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  // Obtener orgId vía RPC robusto
  let orgId: string | null = null;
  if (user) {
    const { data: orgRpc, error: orgErr } = await supabase.rpc("get_my_org");
    if (!orgErr && orgRpc) {
      orgId = orgRpc as unknown as string; // la función retorna uuid escalar
    }
  }

  // Calcular balance solo si hay org
  let balance = 0;
  if (user && orgId) {
    const { data: ledger, error } = await supabase
      .from("credit_ledger")
      .select("delta")
      .eq("org_id", orgId);

    if (!error && ledger) {
      balance = ledger.reduce((acc, row) => acc + row.delta, 0);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-semibold">IAgent Marketing</Link>
          {user ? (
            <span className="hidden text-sm text-gray-500 sm:inline">
              Hola, {user.email}
            </span>
          ) : (
            <span className="hidden text-sm text-gray-500 sm:inline">
              Invitado
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Créditos */}
          <div className="rounded-full border px-3 py-1 text-sm">
            Créditos:{" "}
            <span className="font-semibold">
              {user ? (orgId ? balance : "—") : "—"}
            </span>
          </div>

          {/* Estado Supabase (cliente) */}
          <SupabaseStatusClient orgId={orgId} />
          {!user && (
            <Link
              href="/login"
              className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
              title="Iniciar sesión"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
