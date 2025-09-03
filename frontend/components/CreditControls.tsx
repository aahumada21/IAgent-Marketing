"use client";

import { useCredits } from "@/lib/useCredits";
import { useState } from "react";

export default function CreditControls({
  orgId,
  initialBalance,
}: {
  orgId: string;
  initialBalance: number;
}) {
  const { topUp, balance, loading, error } = useCredits();
  const [localBalance, setLocalBalance] = useState<number>(initialBalance);
  const [msg, setMsg] = useState<string | null>(null);

  async function doTopUp(amount: number) {
    setMsg(null);
    const newBal = await topUp(orgId, amount, `topup_${amount}`);
    if (typeof newBal === "number") {
      setLocalBalance(newBal);
      setMsg(`✅ +${amount} créditos (nuevo balance: ${newBal})`);
    } else {
      // Si hubo error, el hook ya lo expuso; mostramos un mensaje adicional
      setMsg("⚠ No se pudo cargar créditos. Revisa el error.");
    }
  }

  const effectiveBalance = balance ?? localBalance;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => doTopUp(10)}
        disabled={loading !== null}
        className="rounded bg-emerald-600 px-3 py-2 text-white disabled:opacity-50"
        title="Agregar 10 créditos (validación real en el RPC)"
      >
        {loading ? "Procesando..." : "+10 créditos"}
      </button>

      <button
        onClick={() => doTopUp(5)}
        disabled={loading !== null}
        className="rounded bg-emerald-700 px-3 py-2 text-white disabled:opacity-50"
        title="Agregar 5 créditos (validación real en el RPC)"
      >
        {loading ? "Procesando..." : "+5 créditos"}
      </button>

      <span className="rounded border px-3 py-2 text-sm">
        Balance: <b className="tabular-nums">{effectiveBalance}</b>
      </span>

      {(msg || error) && (
        <span className="text-sm">
          {msg && <span className="mr-2">{msg}</span>}
          {error && <span className="text-red-600">[{error}]</span>}
        </span>
      )}
    </div>
  );
}
