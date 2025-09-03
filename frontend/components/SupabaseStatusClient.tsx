"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

type LogEntry = { t: string; level: "info" | "error"; msg: string };

export default function SupabaseStatusClient({ orgId }: { orgId: string | null }) {
  const supabase = useMemo(() => supabaseClient(), []);
  const [authOk, setAuthOk] = useState<boolean>(false);
  const [dbOk, setDbOk] = useState<"unknown" | "ok" | "fail">("unknown");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Helper para agregar logs
  function pushLog(level: LogEntry["level"], msg: string) {
    setLogs(prev => [{ t: new Date().toLocaleTimeString(), level, msg }, ...prev].slice(0, 20));
  }

  // Estado de autenticación (cliente)
  useEffect(() => {
    (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setAuthOk(false);
        pushLog("error", `Auth error: ${error.message}`);
      } else {
        setAuthOk(!!user);
        pushLog("info", user ? "Auth OK (usuario presente)" : "Auth vacío");
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      pushLog("info", `Auth event: ${e}`);
    });

    return () => { sub.subscription.unsubscribe(); };
  }, [supabase]);

  // Ping a la base (ligero)
  async function pingDB() {
  try {
    const { data, error } = await supabase.rpc("health_check");
    if (error) throw error;
    const stamp = Array.isArray(data) && data.length ? (data[0] as any).now : null;
    setDbOk("ok");
    pushLog("info", `DB OK (health_check @ ${stamp ?? "now"})`);
  } catch (e: any) {
    setDbOk("fail");
    pushLog("error", `DB FAIL: ${e?.message ?? e}`);
  }
  }

  // Auto-ping inicial (suave)
  useEffect(() => {
    pingDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-3">
      {/* Badges de estado */}
      <span
        title="Autenticación Supabase"
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
          authOk ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        }`}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: authOk ? "#10b981" : "#ef4444" }} />
        Auth {authOk ? "OK" : "FAIL"}
      </span>

      <span
        title="Conexión a la base de datos"
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
          dbOk === "ok"
            ? "bg-emerald-100 text-emerald-700"
            : dbOk === "fail"
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background:
              dbOk === "ok" ? "#10b981" : dbOk === "fail" ? "#ef4444" : "#9ca3af",
          }}
        />
        DB {dbOk === "unknown" ? "…" : dbOk.toUpperCase()}
      </span>

      <button
        onClick={pingDB}
        className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
        title="Probar conexión y registrar en log"
      >
        Probar conexión
      </button>

      {/* Dropdown de Log */}
      <details className="relative">
        <summary className="cursor-pointer list-none rounded border px-2 py-1 text-xs hover:bg-gray-50">
          Log
        </summary>
        <div className="absolute right-0 mt-2 w-[320px] max-h-72 overflow-auto rounded-md border bg-white p-2 shadow-lg">
          {orgId ? (
            <div className="mb-2 text-xs text-gray-500">Org actual: <b>{orgId}</b></div>
          ) : (
            <div className="mb-2 text-xs text-gray-500">Sin organización</div>
          )}
          {logs.length === 0 ? (
            <div className="text-sm text-gray-500">Sin eventos aún…</div>
          ) : (
            <ul className="space-y-1 text-sm">
              {logs.map((l, i) => (
                <li key={i} className={`flex gap-2 ${l.level === "error" ? "text-red-600" : "text-gray-800"}`}>
                  <span className="shrink-0 tabular-nums text-gray-500">{l.t}</span>
                  <span>•</span>
                  <span>{l.msg}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
}
