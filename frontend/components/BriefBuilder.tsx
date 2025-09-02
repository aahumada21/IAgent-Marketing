"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const Schema = z.object({
  productName: z.string().min(2),
  goal: z.string().min(5),
  platforms: z.array(z.enum(["instagram_reel","tiktok","meta_feed","landing_hero"])).min(1),
  brandVoice: z.string().min(2),
  audience: z.string().min(2)
});
type Form = z.infer<typeof Schema>;

export default function BriefBuilder({ onSubmit }: { onSubmit?: (data: Form)=>void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(Schema), defaultValues:{ platforms: [] } });

  return (
    <form onSubmit={handleSubmit((data)=> onSubmit?.(data))} className="space-y-3 max-w-xl">
      <input className="w-full border p-2 rounded" placeholder="Producto" {...register("productName")} />
      {errors.productName && <p className="text-red-600 text-sm">Producto requerido</p>}

      <input className="w-full border p-2 rounded" placeholder="Objetivo (ej. captación de leads)" {...register("goal")} />
      {errors.goal && <p className="text-red-600 text-sm">Objetivo requerido</p>}

      <input className="w-full border p-2 rounded" placeholder="Tono de marca (ej. lujo cálido)" {...register("brandVoice")} />
      <input className="w-full border p-2 rounded" placeholder="Audiencia (ej. familias 28-55)" {...register("audience")} />

      <fieldset className="border p-2 rounded">
        <legend className="px-1 text-sm">Plataformas</legend>
        {["instagram_reel","tiktok","meta_feed","landing_hero"].map(p => (
          <label key={p} className="mr-3 text-sm">
            <input type="checkbox" value={p} {...register("platforms")} className="mr-1" />
            {p}
          </label>
        ))}
        {errors.platforms && <p className="text-red-600 text-sm">Elige al menos una</p>}
      </fieldset>

      <button className="border px-4 py-2 rounded">Guardar brief</button>
    </form>
  );
}
