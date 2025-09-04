// frontend/app/(auth)/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) return setError(error.message);
    router.push("/dashboard"); // ajusta a tu ruta post-login
  };

  return (
    <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
      <h1 className="mb-1 text-2xl font-semibold">Iniciar sesión</h1>
      <p className="mb-6 text-sm text-neutral-500">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Crear cuenta
        </Link>
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm">Email</span>
          <input
            type="email"
            className="w-full rounded-lg border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Contraseña</span>
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>

      {/* Opcional: OAuth */}
      {/* <div className="mt-6">
        <button
          onClick={async () => {
            await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
          }}
          className="w-full rounded-lg border px-4 py-2"
        >
          Continuar con Google
        </button>
      </div> */}
    </div>
  );
}
