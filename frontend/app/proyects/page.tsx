import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import AuthPanel from "@/components/AuthPanel";

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Bienvenido a AI Ads</h1>
      <p className="opacity-70">Inicia sesión para continuar.</p>
      <AuthPanel />
    </main>
  );
}
