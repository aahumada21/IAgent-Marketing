"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
      },
    });
    setPending(false);
    if (error) return setError(error.message);
    if (data?.user && !data.user.confirmed_at) {
      setInfo("Te enviamos un correo para confirmar tu cuenta. Revisa tu bandeja y continúa desde allí.");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
        <h1 className="mb-1 text-2xl font-semibold">Crear cuenta</h1>
        <p className="mb-6 text-sm text-neutral-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Iniciar sesión</Link>
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm">Email</span>
            <input type="email" className="w-full rounded-lg border px-3 py-2"
              value={email} onChange={(e)=>setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm">Contraseña</span>
            <input type="password" className="w-full rounded-lg border px-3 py-2"
              value={password} onChange={(e)=>setPassword(e.target.value)} required autoComplete="new-password" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-700">{info}</p>}
          <button type="submit" disabled={pending}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-60">
            {pending ? "Creando…" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
