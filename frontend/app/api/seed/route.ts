import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

async function runSeed() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "No auth" }, { status: 401 });

  const { data: org, error: e1 } = await supabase
    .from("organizations")
    .insert({ name: "Mi Empresa", owner: user.id })
    .select("id")
    .single();
  if (e1 || !org) return NextResponse.json({ ok: false, error: e1?.message }, { status: 400 });

  const { error: e2 } = await supabase
    .from("members")
    .insert({ org_id: org.id, user_id: user.id, role: "owner" });
  if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 400 });

  const { error: e3 } = await supabase
    .from("credit_ledger")
    .insert({ org_id: org.id, delta: 100, reason: "seed" });
  if (e3) return NextResponse.json({ ok: false, error: e3.message }, { status: 400 });

  return NextResponse.json({ ok: true, orgId: org.id });
}

export async function POST() { return runSeed(); }
export async function GET()  { return runSeed(); }
