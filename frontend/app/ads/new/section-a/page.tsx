  "use client";
  import { useSearchParams, useRouter } from "next/navigation";
  import { useEffect, useState } from "react";
  import { supabase } from "@/lib/supabase/client";
  import { uploadImageAndGetUrl } from "@/lib/storage/upload";
 
  type JobType = "image" | "video";
  type Provider = "veo3" | "gen3" | "pika" | "kling" | "sora";
  type PresetOption = "clean-product-spot" | "lifestyle-swipe" | "studio-loop";
  type Mode = "preset" | "custom";
 
  const presetTexts: Record<PresetOption, string> = {
    "clean-product-spot":
      "Preset: Clean Product Spot. Enfocar el producto sobre fondo neutro con luz suave lateral. Planos cerrados a detalles (textura, logotipo), cortes cada ~1.5s para ritmo ágil. Incluir precio y CTA al final sobre placa limpia. Duración objetivo 8–12s. Paleta sobria y minimalista.",
    "lifestyle-swipe":
      "Preset: Lifestyle Swipe. Mostrar el producto en uso en 3 micro-escenas, transición swipe entre tomas. Sensación cotidiana y aspiracional (exterior/interior), movimiento de manos natural. Subtítulos breves con beneficios clave y cierre con CTA: “Descúbrelo hoy”. Duración 10–12s.",
    "studio-loop":
      "Preset: Studio Loop. Producto sobre mesa/soporte en estudio; loop suave (giro/vaivén) con luces controladas para brillos. Un golpe de beat al 50% del clip para cambio de ángulo. Texto corto con ventaja principal + CTA final. Duración 6–10s, formato loopeable.",
  };
 
  export default function CreateAdSectionA() {
    const sp = useSearchParams();
    const router = useRouter();
    const projectId = sp.get("project_id");
    const orgId = sp.get("org_id");
 
    const [file, setFile] = useState<File | null>(null);
    const [jobType, setJobType] = useState<JobType>("image");
    const [provider, setProvider] = useState<Provider>("veo3");
    // NUEVO: Preset vs Personalizado
    const [mode, setMode] = useState<Mode>("preset");
    const [preset, setPreset] = useState<PresetOption>("clean-product-spot");
    const [instructions, setInstructions] = useState<string>(presetTexts["clean-product-spot"]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
 
    // Mantener textarea sincronizado con elección de preset
    useEffect(() => {
      if (mode === "preset") {
        setInstructions(presetTexts[preset]);
      }
    }, [mode, preset]);
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
        const promptTextToSave = mode === "preset" ? presetTexts[preset] : instructions;

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
                        // NUEVO: persistimos el prompt
            prompt_mode: mode,
            prompt_preset: mode === "preset" ? preset : null,
            prompt_text: promptTextToSave,

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
          {/* -------- NUEVO: PRESET vs PERSONALIZADO -------- */}
         <div className="space-y-3 rounded-2xl border p-4">
            <div className="flex gap-6">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "preset"}
                  onChange={() => setMode("preset")}
                />
                <span>Preset</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "custom"}
                  onChange={() => setMode("custom")}
                />
                <span>Personalizado</span>
              </label>
            </div>

            {mode === "preset" && (
              <div>
                <label className="block text-sm font-medium mb-1">Preset</label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as PresetOption)}
                 className="w-full border rounded p-2"
                >
                  <option value="clean-product-spot">clean-product-spot</option>
                  <option value="lifestyle-swipe">lifestyle-swipe</option>
                 <option value="studio-loop">studio-loop</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Los presets cargan instrucciones listas en el cuadro de texto (solo lectura).
                </p>
              </div>
            )}

            {/* Textarea compartido (readonly si preset) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {mode === "preset" ? "Instrucciones (desde preset)" : "Instrucciones personalizadas"}
              </label>
             <textarea
                className={`w-full rounded border p-2 min-h-[140px] ${
                  instructions.length > 800 ? "border-red-400" : ""
                }`}
                placeholder={
                  mode === "custom"
                    ? 'Ejemplos:\n• "Enfocar el producto sobre fondo blanco, luz suave lateral, acercamientos a detalles, ritmo ágil con cortes cada 1.5s. Mostrar precio y CTA al final."\n• "Escena lifestyle: persona usando el producto en exterior, transición swipe entre 3 tomas, destacar resistencia al agua. Cierre con logo + CTA: Descúbrelo hoy."'
                    : ""
                }
                readOnly={mode === "preset"}
                maxLength={1000}
               value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
              <div className="flex items-center justify-between text-xs">
                <span className={`${instructions.length > 800 ? "text-red-500" : "text-gray-500"}`}>
                  {instructions.length}/800 {instructions.length > 800 && "• Te pasaste del máximo recomendado"}
                </span>
                <span className="text-gray-500">Consejo: especifica ritmo, planos, beneficios y CTA.</span>
              </div>
            </div>
          </div>
          {/* -------- FIN PRESET vs PERSONALIZADO -------- */}
  
 
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
