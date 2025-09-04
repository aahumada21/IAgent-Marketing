"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";

type OrgRow = { id: string; name: string };
type MemberRow = { organization_id: string; role: "owner" | "admin" | "member" };
type ProjectRow = { id: string; name: string; org_id: string };

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string; email: string | null } | null>(null);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [memberships, setMemberships] = useState<MemberRow[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");

  const myRoleInSelected = useMemo(() => {
    if (!selectedOrgId) return null;
    return memberships.find((m) => m.organization_id === selectedOrgId)?.role ?? null;
  }, [memberships, selectedOrgId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
      setMe({ id: userData.user.id, email: userData.user.email ?? null });

      // memberships (alias organization_id <- org_id)
      const { data: mrows, error: mErr } = await supabase
        .from("members")
        .select("organization_id:org_id, role")
        .eq("user_id", userData.user.id);

      if (mErr) {
        setErr(mErr.message);
        setLoading(false);
        return;
      }
      setMemberships((mrows ?? []) as MemberRow[]);

      // cargar orgs por id
      const orgIds = (mrows ?? []).map((m: any) => m.organization_id);
      let orgList: OrgRow[] = [];
      if (orgIds.length) {
        const { data: orows, error: oErr } = await supabase
          .from("organizations")
          .select("id, name")
          .in("id", orgIds);

        if (oErr) {
          setErr(oErr.message);
          setLoading(false);
          return;
        }
        orgList = (orows ?? []) as OrgRow[];
      }
      setOrgs(orgList);

      if (orgList.length) setSelectedOrgId(orgList[0].id);

      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedOrgId) return;

    // balance via RPC
    (async () => {
      const { data, error } = await supabase.rpc("get_org_credit_balance", { p_org: selectedOrgId });
      if (error) {
        setErr(error.message);
        return;
      }
      setCredits((data as number) ?? 0);
    })();

    // proyectos de la org
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, org_id")
        .eq("org_id", selectedOrgId)
        .order("name", { ascending: true });

      if (error) {
        setErr(error.message);
        return;
      }
      setProjects((data ?? []) as ProjectRow[]);
    })();
  }, [selectedOrgId]);

  const createOrg = async () => {
    setErr(null);
    if (!orgName.trim() || !me) return;

    const { data: orgIns, error: orgErr } = await supabase
      .from("organizations")
      .insert({ name: orgName, owner_id: me.id })
      .select()
      .single();

    if (orgErr) {
      setErr(orgErr.message);
      return;
    }

    // trigger agrega owner a members
    setOrgs((prev) => [...prev, { id: orgIns.id, name: orgIns.name }]);
    setMemberships((prev) => [...prev, { organization_id: orgIns.id, role: "owner" }]);
    setSelectedOrgId(orgIns.id);
    setOrgName("");
  };

  const createProject = async () => {
    setErr(null);
    if (!selectedOrgId || !projectName.trim() || !me) return;

    const { data, error } = await supabase
      .from("projects")
      .insert({ name: projectName, org_id: selectedOrgId, created_by: me.id })
      .select()
      .single();

    if (error) {
      setErr(error.message);
      return;
    }
    setProjects((prev) => [...prev, data as ProjectRow]);
    setProjectName("");
  };

  const topUp = async (amount: number) => {
    if (!selectedOrgId) return;
    try {
      const { error } = await supabase.rpc("add_credits", {
        p_org: selectedOrgId,
        p_amount: amount,
        p_reason: `Manual top-up (${amount})`,
      });
      if (error) throw error;

      const { data, error: bErr } = await supabase.rpc("get_org_credit_balance", { p_org: selectedOrgId });
      if (bErr) throw bErr;
      setCredits((data as number) ?? 0);
    } catch (e: any) {
      setErr(e.message ?? "Error al cargar créditos");
    }
  };

  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <section className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Tus organizaciones</h2>
            <p className="text-sm text-neutral-500">Selecciona una o crea nueva.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {orgs.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedOrgId(o.id)}
                className={`rounded-lg px-3 py-1.5 border ${
                  selectedOrgId === o.id ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"
                }`}
                title={o.name}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            placeholder="Nombre de la organización"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-2"
          />
          <button onClick={createOrg} className="rounded-lg bg-emerald-600 text-white px-4 py-2">
            Crear org
          </button>
        </div>
      </section>

      {selectedOrgId && (
        <section className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Créditos</h2>
              <p className="text-sm text-neutral-500">
                Rol: <b>{myRoleInSelected ?? "—"}</b>
              </p>
            </div>
            <div className="text-2xl font-bold">{credits ?? 0}</div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              disabled={myRoleInSelected !== "owner"}
              onClick={() => topUp(5)}
              className="rounded-lg px-3 py-1.5 border disabled:opacity-50"
              title={myRoleInSelected !== "owner" ? "Solo owner puede cargar" : "Cargar +5"}
            >
              +5
            </button>
            <button
              disabled={myRoleInSelected !== "owner"}
              onClick={() => topUp(10)}
              className="rounded-lg px-3 py-1.5 border disabled:opacity-50"
              title={myRoleInSelected !== "owner" ? "Solo owner puede cargar" : "Cargar +10"}
            >
              +10
            </button>
          </div>
        </section>
      )}

      {selectedOrgId && (
        <section className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-semibold">Proyectos</h2>

          <ul className="mt-3 space-y-1">
            {projects.map((p) => (
              <li key={p.id} className="text-sm">
                • {p.name}
              </li>
            ))}
            {projects.length === 0 && <li className="text-sm text-neutral-500">Sin proyectos</li>}
          </ul>

          <div className="mt-3 flex gap-2">
            <input
              placeholder="Nombre del proyecto"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="flex-1 rounded-lg border px-3 py-2"
            />
            <button onClick={createProject} className="rounded-lg bg-blue-600 text-white px-4 py-2">
              Crear proyecto
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
