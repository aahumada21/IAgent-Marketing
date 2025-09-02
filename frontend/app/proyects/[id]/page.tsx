export default async function JobView({ params }: { params: { id: string } }) {
  // Simulación: en producción leerías desde DB el output del job
  const output = {
    copies: {
      instagram_reel: {
        hook_variants: [
          "¿Sofá que dura décadas? Te lo mostramos en 15s.",
          "Tu living merece raulí, no plástico."
        ],
        script_15s:
          "0–3s: Hook.\n3–10s: Valor (hecho a mano, raulí, asesoría en casa).\n10–15s: CTA: Agenda tu visita.",
        cta: "Agenda tu asesoría gratuita"
      }
    },
    image_prompts: [
      "sofa premium fabric upholstery, warm living room, natural light, editorial photography, 3:4"
    ],
    landing_hero: {
      headline: "El sofá con alma",
      subheadline: "Hecho a mano en Chile, en raulí y a tu medida",
      bullets: ["Asesoría en tu hogar", "Impermeabilización invisible", "Garantía 5 años"],
      cta: "Quiero mi asesoría"
    }
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Job: {params.id}</h1>
      <pre className="bg-black/5 p-4 rounded text-sm overflow-auto">
        {JSON.stringify(output, null, 2)}
      </pre>
      <a href="/projects/demo-1" className="underline">← Volver al proyecto</a>
    </main>
  );
}
