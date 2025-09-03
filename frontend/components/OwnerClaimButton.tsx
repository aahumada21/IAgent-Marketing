"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Estados posibles:
 * - "unknown": aún cargando
 * - "none": la org no tiene owner
 * - "you": tú eres el owner
 * - "other": otra persona es owner
 */
type OwnerState = "unknown" | "none" | "you" | "other";

export default function OwnerClaimButton({ orgId }: { orgId: string }) {
  const [ownerState, setOwnerState] = useState<OwnerState>("unknown");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function refreshOwnerState() {
    const supabase = supabaseClient();

    const [{ data: userData }, { data: ownerUuid }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.rpc("get_org_owner", { p_org: orgId })
    ]);

    const uid = userData.user?.id || null;
    const owner = ownerUuid as string | null;

    if (!owner) {
      setOwnerState("none");
      return;
    }
    if (uid && owner === uid) {
      setOwnerState("you");
      return;
    }
    setOwnerState("other");
  }

  useEffect(() => {
    refreshOwnerState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function claim() {
    setLoading(true);
    setMsg(null);
    try {
      const supabase = supabaseClient();
      const { error } = await supabase.rpc("claim_ownership", { p_org: orgId });
      if (error) throw error;
      setMsg("✅ Ya eres owner.");
      await refreshOwnerState();
      router.refresh();
    } catch (e: any) {
      setMsg(`⚠ ${e?.message ?? "Error"}`);
    } finally {
      setLoading(false);
    }
  }

  // Texto del estado
  const badge = {
    unknown: "Verificando owner…",
    none: "Sin owner (libre)",
    you: "Ya eres owner",
    other: "Otro usuario es owner",
  }[ownerState];

  // Habilitación del botón:
  // - enabled cuando no hay owner ("none")
  // - disabled si ya eres owner ("you") o hay otro owner ("other")
  const buttonDisabled = loading || ownerState !== "none";

  return (
    <div className="flex items-center gap-3">
      <span
        className={`rounded-full px-2 py-1 text-xs ${
          ownerState === "you"
            ? "bg-emerald-100 text-emerald-700"
            : ownerState === "none"
            ? "bg-amber-100 text-amber-700"
            : ownerState === "other"
            ? "bg-gray-100 text-gray-700"
            : "bg-gray-100 text-gray-500"
        }`}
        title="Estado de ownership de la organización"
      >
        {badge}
      </span>

      <button
        onClick={claim}
        disabled={buttonDisabled}
        className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        title="Reclamar ownership de la organización"
      >
        {loading ? "Procesando..." : "Hacerme owner"}
      </button>

      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
