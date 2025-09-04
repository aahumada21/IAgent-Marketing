  "use client";
  import { useSearchParams, useRouter } from "next/navigation";
  import { useState } from "react";
  import { supabase } from "@/lib/supabase/client";
  import { uploadImageAndGetUrl } from "@/lib/storage/upload";
 
  type JobType = "image" | "video";
  type Provider = "veo3" | "gen3" | "pika" | "kling" | "sora";
 
  export default function CreateAdSectionA() {
    const sp = useSearchParams();
    const router = useRouter();
    const projectId = sp.get("project_id");
    const orgId = sp.get("org_id");
 
    const [file, setFile] = useState<File | null>(null);
    const [jobType, setJobType] = useState<JobType>("image");
    const [provider, setProvider] = useState<Provider>("veo3");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
 
    async function onSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);
      if (!file) return setError("Debes subir una imagen.");
      if (!projectId || !orgId) return setError("Faltan 'project_id' u 'org_id' en la URL.");
      try {
        setUploading(true);
         // 0) asegurar usuario autenticado
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData?.user?.id;
      if (!userId) {
        throw new Error("Debes iniciar sesión para crear un anuncio.");
      }
        // 1) subir imagen y obtener URL (pública o signed)
        const mediaUrl = await uploadImageAndGetUrl(file, orgId);
 
        // 2) crear job
        const { error: insErr } = await supabase
          .from("content_jobs")
          .insert({
            org_id: orgId,
            project_id: projectId,
            job_type: jobType,          // mapea a content_jobs.job_type
            provider,                   // Veo3 habilitado
            input_media_url: mediaUrl,  // ajusta si tu columna tiene otro nombre
            status: "draft",
            created_by: userId, // <- aseguramos NOT NULL

          });
        if (insErr) throw insErr;
 
        router.push(`/projects/${projectId}/jobs`); // ajusta destino
      } catch (err: any) {
        setError(err.message ?? "Error al crear el anuncio.");
      } finally {
        setUploading(false);
      }
    }
 
    return (
      <main className="mx-auto max-w-2xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Crear Anuncio – Sección A</h1>
        <p className="text-sm text-gray-600">
          Sube 1 imagen base, elige si el resultado será un <b>Video</b> o una <b>Imagen</b>,
          y selecciona el <b>Provider</b>. Por ahora solo <b>Veo3</b> está habilitado.
        </p>
 
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Imagen base</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full border rounded p-2"
            />
          </div>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full border rounded p-2"
              >
                <option value="image">Imagen</option>
                <option value="video">Video</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Guarda en <code>content_jobs.job_type</code>.
              </p>
            </div>
 
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="w-full border rounded p-2"
              >
                <option value="veo3">Veo3</option>
                <option value="gen3" disabled>Gen-3 (Pronto)</option>
                <option value="pika" disabled>Pika (Pronto)</option>
                <option value="kling" disabled>Kling (Pronto)</option>
                <option value="sora" disabled>Sora (Pronto)</option>
              </select>
            </div>
          </div>
 
          {error && <div className="text-red-600 text-sm">{error}</div>}
 
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-60"
            >
              {uploading ? "Creando…" : "Crear anuncio"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-md border"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    );
  }
