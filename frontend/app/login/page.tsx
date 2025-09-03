"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMagicLink = async () => {
    setLoading(true);
    const supabase = supabaseClient();
 const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: `${location.origin}/auth/callback` },
});
    setLoading(false);
    if (error) alert(error.message);
    else alert("Revisa tu email para iniciar sesión.");
  };

  return (
    <main className="p-6 space-y-4 max-w-sm">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="tu@email.com"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button
        disabled={loading || !email}
        onClick={handleMagicLink}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Enviando..." : "Ingresar con Magic Link"}
      </button>
      <button
        onClick={() => router.push("/")}
        className="text-sm underline"
      >
        Volver al inicio
      </button>
    </main>
  );
}
