"use client";

import { useCredits } from "@/lib/useCredits";

export default function CreditButton({ orgId }: { orgId: string }) {
  const { consumeCredits, balance, loading, error } = useCredits();

  return (
    <div className="mt-4">
      <button
        onClick={() => consumeCredits(orgId, 5, "generate_content")}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Procesando..." : "Consumir 5 créditos"}
      </button>

      {error && <p className="text-red-500 mt-2">⚠ {error}</p>}
      {balance !== null && (
        <p className="text-green-600 mt-2">Nuevo balance: {balance}</p>
      )}
    </div>
  );
}
