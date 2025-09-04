"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
// ⬇️ usa relativo si el alias @ no funciona en tu proyecto
import { supabase } from "../../../../lib/supabase/client";

type Job = {
  id: string;
  org_id: string | null;
  project_id: string | null;
  job_type: "image" | "video" | null;
  provider: "veo3" | "gen3" | "pika" | "kling" | "sora" | null;
  input_media_url: string | null;
  status: "draft" | "queued" | "running" | "completed" | "failed" | null;
  created_by: string | null;
  created_at: string;
};

const PAGE_SIZE = 10;

export default function ProjectJobsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);

  const from = useMemo(() => (page - 1) * PAGE_SIZE, [page]);
  const to = useMemo(() => from + PAGE_SIZE - 1, [from]);

  async function load() {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      console.log("[jobs] loading for projectId=", projectId, { from, to });
      const { count, error: countErr } = await supabase
        .from("content_jobs")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      if (countErr) throw countErr;
      setTotal(count ?? 0);

      const { data, error } = await supabase
        .from("content_jobs")
        .select(
          "id, org_id, project_id, job_type, provider, input_media_url, status, created_by, created_at"
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      console.log("[jobs] data:", data);
      setJobs((data ?? []) as Job[]);
    } catch (e: any) {
      console.error("[jobs] load error:", e);
      setError(e.message ?? "Error cargando jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [projectId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, page]);

  const maxPage = useMemo(() => {
    if (total == null) return 1;
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }, [total]);

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Jobs del Proyecto</h1>
          <p className="text-sm text-gray-600">
            Proyecto: <code className="text-gray-800">{String(projectId)}</code>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={`/ads?project_id=${encodeURIComponent(String(projectId))}`}
            className="px-3 py-2 rounded-md border"
          >
            Volver a ADS
          </a>
          <button
            className="px-3 py-2 rounded-md border"
            onClick={() => load()}
            disabled={loading}
          >
            {loading ? "Cargando…" : "Recargar"}
          </button>
        </div>
      </header>

      {/* aviso si no hay sesión (para evitar pantalla vacía por RLS) */}
      <AuthWarning />

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 bg-gray-50 text-xs font-medium px-4 py-2">
          <div className="col-span-3">Media</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-2">Provider</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-3">Creado</div>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Cargando…</div>
        ) : jobs.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">
            No hay jobs aún para este proyecto.
          </div>
        ) : (
          <ul className="divide-y">
            {jobs.map((j) => (
              <li key={j.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                <div className="col-span-3">
                  <MediaThumb url={j.input_media_url} jobType={j.job_type} />
                </div>
                <div className="col-span-2">
                  <Badge>{j.job_type ?? "-"}</Badge>
                </div>
                <div className="col-span-2">
                  <Badge tone={j.provider === "veo3" ? "success" : "muted"}>
                    {j.provider ?? "-"}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <StatusBadge status={j.status ?? "draft"} />
                </div>
                <div className="col-span-3 text-sm text-gray-700">
                  {new Date(j.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {total ?? 0} resultado{(total ?? 0) === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded-md border disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {page} / {maxPage}
          </span>
          <button
            className="px-3 py-1 rounded-md border disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            disabled={page >= maxPage || loading}
          >
            Siguiente
          </button>
        </div>
      </footer>
    </main>
  );
}

function AuthWarning() {
  // Mensaje simple para recordar sesión (útil con RLS)
  return (
    <div className="text-xs text-gray-600">
      Asegúrate de estar <b>logueado</b> y de ser <b>miembro</b> de la organización del proyecto; de lo contrario, RLS devolverá 0 filas.
    </div>
  );
}

function MediaThumb({ url, jobType }: { url: string | null; jobType: Job["job_type"] }) {
  if (!url) return <div className="text-xs text-gray-500">Sin media</div>;
  if (jobType === "video") {
    return (
      <video src={url} className="w-32 h-20 object-cover rounded border" controls />
    );
  }
  return <img src={url} alt="media" className="w-32 h-20 object-cover rounded border" />;
}

function Badge({
  children,
  tone = "default",
}: {
  children: any;
  tone?: "default" | "success" | "muted";
}) {
  const cls =
    tone === "success"
      ? "bg-green-100 text-green-800"
      : tone === "muted"
      ? "bg-gray-100 text-gray-700"
      : "bg-blue-100 text-blue-800";
  return (
    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: NonNullable<Job["status"]> }) {
  const map: Record<string, { label: string; tone: "muted" | "default" | "success" | "danger" }> = {
    draft: { label: "Borrador", tone: "muted" },
    queued: { label: "En cola", tone: "default" },
    running: { label: "Procesando", tone: "default" },
    completed: { label: "Completado", tone: "success" },
    failed: { label: "Fallido", tone: "danger" },
  };
  const toneCls =
    map[status]?.tone === "success"
      ? "bg-green-100 text-green-800"
      : map[status]?.tone === "danger"
      ? "bg-red-100 text-red-800"
      : map[status]?.tone === "muted"
      ? "bg-gray-100 text-gray-700"
      : "bg-blue-100 text-blue-800";
  return (
    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${toneCls}`}>
      {map[status]?.label ?? status}
    </span>
  );
}
