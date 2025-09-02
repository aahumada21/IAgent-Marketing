"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    // Opcional: redirige al home
    window.location.href = "/";
  }

  return (
    <header className="w-full border-b bg-white">
      <nav className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <a href="/" className="font-bold text-lg">AI Ads</a>
        <div className="flex items-center gap-4 text-sm">
          <a href="/projects" className="hover:underline">Proyectos</a>
          <a href="/dashboard" className="hover:underline">Panel</a>
          {email ? (
            <>
              <span className="opacity-70">{email}</span>
              <button onClick={logout} className="border px-3 py-1 rounded hover:bg-gray-100">
                Salir
              </button>
            </>
          ) : (
            <a href="/login" className="border px-3 py-1 rounded hover:bg-gray-100">Entrar</a>
          )}
        </div>
      </nav>
    </header>
  );
}
