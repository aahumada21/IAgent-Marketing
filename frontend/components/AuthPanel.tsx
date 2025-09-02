"use client";
import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function AuthPanel() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Ajusta si necesitas forzar una URL de retorno específica:
        // emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });
    setLoading(false);
    if (error) return alert(error.message);
    setSent(true);
  }

  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/dashboard`
          : undefined
      }
    });
    setLoading(false);
    if (error) alert(error.message);
  }

  if (sent) {
    return (
      <div className="max-w-sm p-3 border rounded">
        <p className="text-sm">
          ✅ Te enviamos un enlace mágico a <b>{email}</b>. Revisa tu correo.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-3">
      <form onSubmit={signInWithEmail} className="space-y-2">
        <input
          className="w-full border p-2 rounded"
          placeholder="tu@email.cl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <button
          className="w-full border p-2 rounded disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Entrar con email"}
        </button>
      </form>

      <div className="text-center text-xs opacity-60">o</div>

      <button
        className="w-full border p-2 rounded disabled:opacity-50"
        onClick={signInWithGoogle}
        disabled={loading}
      >
        {loading ? "Abriendo Google..." : "Entrar con Google"}
      </button>
    </div>
  );
}
