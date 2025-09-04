"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      // 1) Estado inicial
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user?.email ?? null);

      // 2) Suscripción a cambios de sesión (login/logout/refresh)
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user?.email ?? null);
      });

      unsubscribe = () => sub.subscription.unsubscribe();
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
      // En App Router, esto basta para re-render del Client Component
      router.push("/login");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <nav className="w-full h-14 border-b flex items-center px-4 justify-between bg-white">
      <Link href="/" className="font-semibold">IAgent Marketing</Link>

      <div className="flex items-center gap-2">
        {email ? (
          <>
            <Link href="/dashboard" className="rounded-lg px-3 py-1.5 border hover:bg-neutral-50">
              Dashboard
            </Link>
            <span className="text-sm text-neutral-600">{email}</span>
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="rounded-lg px-3 py-1.5 bg-neutral-900 text-white hover:opacity-90 disabled:opacity-60"
              title="Cerrar sesión"
            >
              {signingOut ? "Cerrando…" : "Cerrar sesión"}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="rounded-lg px-3 py-1.5 border hover:bg-neutral-50">
              Iniciar sesión
            </Link>
            <Link href="/register" className="rounded-lg px-3 py-1.5 bg-blue-600 text-white hover:opacity-90">
              Crear cuenta
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
