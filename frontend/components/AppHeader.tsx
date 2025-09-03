import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import SupabaseStatusClient from "./SupabaseStatusClient";

export default async function AppHeader() {
  const supabase = supabaseServer();

  // Usuario
const { data: { user } } = await supabase.auth.getUser();
  // Organización del usuario
  let member: { org_id: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();
   member = data ?? null;
  }
  let balance = 0;
  let orgId: string | null = null;

  if (user && member?.org_id) {
    orgId = member.org_id as string;

    // Sumar delta del ledger para obtener saldo
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
              {user ? balance : "—"}
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
