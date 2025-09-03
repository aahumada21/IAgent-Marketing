"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export function useCredits() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  async function consumeCredits(orgId: string, amount: number, reason?: string, jobId?: string) {
    setLoading(true);
    setError(null);
    try {
      const supabase = supabaseClient();
      const { data, error } = await supabase.rpc("consume_credits", {
        p_org: orgId,
        p_amount: amount,
        p_reason: reason ?? null,
        p_job: jobId ?? null,
        p_idem: crypto.randomUUID(),
      });
      if (error) throw error;
      if (Array.isArray(data) && data.length) {
        setBalance((data[0] as any).new_balance);
      }
      return data;
    } catch (e: any) {
      setError(e.message || "Error al consumir créditos");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { consumeCredits, balance, loading, error };
}
