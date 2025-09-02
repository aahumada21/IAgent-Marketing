import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <main className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">Panel</h1>
      <p>Hola, {user.email}</p>
    </main>
  );
}
