// app/login/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import AuthPanel from "@/components/AuthPanel";

export default async function LoginPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      <AuthPanel />
    </main>
  );
}
