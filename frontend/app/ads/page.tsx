  "use client";
  import { useEffect, useMemo, useState } from "react";
  import { useRouter, useSearchParams } from "next/navigation";
  import { supabase } from "@/lib/supabase/client";
  
  type Org = { id: string; name: string | null };
  type Project = { id: string; name: string | null; org_id: string };
  
  export default function AdsHomePage() {
    const router = useRouter();
    const sp = useSearchParams();
    const qsOrg = sp.get("org_id");
    const qsProject = sp.get("project_id");
  
    const [loading, setLoading] = useState(true);
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [orgId, setOrgId] = useState<string | null>(qsOrg);
    const [projectId, setProjectId] = useState<string | null>(qsProject);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      (async () => {
        setLoading(true);
        setError(null);
        try {
          // 1) Cargar organizaciones del usuario (RLS debe filtrar)
          const { data: orgsData, error: orgsErr } = await supabase
            .from("organizations")
            .select("id,name")
            .order("name", { ascending: true });
          if (orgsErr) throw orgsErr;
          setOrgs(orgsData ?? []);
  
          // Si venía org por query y existe, la usamos; si no, preselecciona la primera
          const initialOrgId =
            (qsOrg && orgsData?.some((o) => o.id === qsOrg) ? qsOrg : null) ??
            (orgsData && orgsData[0]?.id ? orgsData[0].id : null);
          setOrgId(initialOrgId);
  
          // 2) Cargar proyectos (si hay org seleccionada)
          if (initialOrgId) {
            const { data: projData, error: projErr } = await supabase
              .from("projects")
              .select("id,name,org_id")
              .eq("org_id", initialOrgId)
              .order("created_at", { ascending: false });
            if (projErr) throw projErr;
            setProjects(projData ?? []);
  
            // Si venía project por query y coincide con la org, usarlo; si no, primero
            const initialProjectId =
              (qsProject &&
                projData?.some((p) => p.id === qsProject && p.org_id === initialOrgId)
                ? qsProject
                : null) ?? (projData && projData[0]?.id ? projData[0].id : null);
            setProjectId(initialProjectId);
          } else {
            setProjects([]);
            setProjectId(null);
          }
        } catch (e: any) {
          setError(e.message ?? "Error cargando datos.");
        } finally {
          setLoading(false);
        }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    // Cuando cambia org, recarga proyectos
    useEffect(() => {
      (async () => {
        if (!orgId) {
          setProjects([]);
          setProjectId(null);
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const { data: projData, error: projErr } = await supabase
            .from("projects")
            .select("id,name,org_id")
            .eq("org_id", orgId)
            .order("created_at", { ascending: false });
          if (projErr) throw projErr;
          setProjects(projData ?? []);
          setProjectId((prev) => {
            if (prev && projData?.some((p) => p.id === prev)) return prev;
            return projData && projData[0]?.id ? projData[0].id : null;
          });
        } catch (e: any) {
          setError(e.message ?? "Error cargando proyectos.");
        } finally {
          setLoading(false);
        }
      })();
    }, [orgId]);
  
    // Sin org   project no se habilitan acciones
    const canProceed = useMemo(() => !!orgId && !!projectId, [orgId, projectId]);
  
    // Helper para navegar manteniendo org_id y project_id
    const hrefWithQP = (base: string) =>
      `${base}?org_id=${encodeURIComponent(orgId ?? "")}&project_id=${encodeURIComponent(
        projectId ?? ""
      )}`;
  
    return (
      <main className="mx-auto max-w-5xl p-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Anuncios (ADS)</h1>
          <p className="text-sm text-gray-600">
            Selecciona tu Organización y Proyecto para comenzar. Desde aquí accedes a la creación
            de anuncios (Sección A) y a futuras secciones del flujo.
          </p>
        </header>
  
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-1">Organización</label>
            <select
              className="w-full border rounded p-2"
              value={orgId ?? ""}
              onChange={(e) => setOrgId(e.target.value || null)}
              disabled={loading}
            >
              {orgs.length === 0 && <option value="">Sin organizaciones</option>}
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name ?? o.id}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-1">Proyecto</label>
            <select
              className="w-full border rounded p-2"
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value || null)}
              disabled={loading || !orgId}
            >
              {!orgId && <option value="">Selecciona una organización</option>}
              {orgId && projects.length === 0 && <option value="">Sin proyectos</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.id}
                </option>
              ))}
            </select>
          </div>
  
          <div className="col-span-1">
            <label className="block text-sm font-medium mb-1">Estado</label>
            <div className="border rounded p-2 text-sm">
              {loading ? "Cargando…" : canProceed ? "Listo para crear" : "Selecciona org y proyecto"}
            </div>
          </div>
        </section>
  
        {error && <div className="text-red-600 text-sm">{error}</div>}
  
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Crear Anuncio – Sección A */}
          <ActionCard
            title="Crear Anuncio – Sección A (Entrada)"
            description="Sube 1 imagen base, selecciona el Tipo (Video/Imagen) y el Provider (Veo3)."
            ctaLabel="Abrir Sección A"
            href={hrefWithQP("/ads/new/section-a")}
            disabled={!canProceed}
          />
  
          {/* Sección B – Prompting (Pronto) */}
          <DisabledCard
            title="Sección B – Prompting (Pronto)"
            description="Configura opción preconfigurada o personalizada y genera el prompt."
          />
  
          {/* Proveedores */}
          <ProviderCard />
  
          {/* Ver Jobs del Proyecto (ajusta la ruta si usas otra) */}
          <ActionCard
            title="Ver Jobs del Proyecto"
            description="Lista de content_jobs asociados al proyecto."
            ctaLabel="Ir al listado"
            href={`/projects/${projectId ?? ""}/jobs`}
            disabled={!canProceed}
          />
        </section>
      </main>
    );
  }
  
  function ActionCard(props: {
    title: string;
    description: string;
    ctaLabel: string;
    href: string;
    disabled?: boolean;
  }) {
    const { title, description, ctaLabel, href, disabled } = props;
    return (
      <div className="border rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="mt-auto">
          <a
            href={disabled ? undefined : href}
            onClick={(e) => disabled && e.preventDefault()}
            className={`inline-block px-4 py-2 rounded-md text-white ${
              disabled ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:opacity-90"
            }`}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    );
  }
  
  function DisabledCard(props: { title: string; description: string }) {
    const { title, description } = props;
    return (
      <div className="border rounded-2xl p-5 shadow-sm flex flex-col gap-3 opacity-60">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="mt-auto">
          <button className="px-4 py-2 rounded-md bg-gray-300 text-gray-700 cursor-not-allowed">
            Pronto
          </button>
        </div>
      </div>
    );
  }
  
  function ProviderCard() {
    return (
      <div className="border rounded-2xl p-5 shadow-sm">
        <h3 className="text-lg font-semibold mb-3">Proveedores</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium">Veo3</span>
            <span className="ml-2 text-gray-600">Habilitado</span>
          </li>
          <li className="flex items-center gap-2 opacity-60">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
            <span className="font-medium">Gen-3</span>
            <span className="ml-2 text-gray-600">Pronto</span>
          </li>
          <li className="flex items-center gap-2 opacity-60">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
            <span className="font-medium">Pika</span>
            <span className="ml-2 text-gray-600">Pronto</span>
          </li>
          <li className="flex items-center gap-2 opacity-60">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
            <span className="font-medium">Kling</span>
            <span className="ml-2 text-gray-600">Pronto</span>
          </li>
          <li className="flex items-center gap-2 opacity-60">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
            <span className="font-medium">Sora</span>
            <span className="ml-2 text-gray-600">Pronto</span>
          </li>
        </ul>
      </div>
    );
  }
