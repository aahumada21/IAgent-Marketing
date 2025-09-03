"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CreateOrgForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate() {
    setLoading(true);
    setErr(null);
    try {
      const supabase = supabaseClient();
      const { data, error } = await supabase.rpc("create_org_and_join", { p_name: name });
      if (error) throw error;
      // Refresca la página para que el header y el dashboard muestren la nueva org y el balance.
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Error al crear la organización");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded border p-4">
      <h2 className="text-lg font-semibold mb-2">Crear organización</h2>
      <p className="text-sm text-gray-600 mb-3">
        Aún no perteneces a ninguna organización. Crea una para continuar.
      </p>
      <div className="flex flex-col gap-2 max-w-sm">
        <input
          className="border rounded px-3 py-2"
          placeholder="Nombre de la organización"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Creando..." : "Crear y unirme como Owner"}
        </button>
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </div>
    </div>
  );
}
