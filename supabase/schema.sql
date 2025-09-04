diff --git a/supabase/schema.sql b/supabase/schema.sql
new file mode 100644
--- /dev/null
+++ b/supabase/schema.sql
@@
+-- ==========================================
+-- RESET + SETUP DESDE CERO (PUBLIC SCHEMA)
+-- Modelo: organizations, members, projects, briefs, content_jobs, credit_ledger
+-- Convención: SIEMPRE usar org_id
+-- ==========================================
+create extension if not exists pgcrypto;
+
+-- 1) DROP previos
+drop function if exists public.is_member_of(uuid) cascade;
+drop function if exists public.has_org_role(uuid, text[]) cascade;
+drop function if exists public.get_org_credit_balance(uuid) cascade;
+drop function if exists public.add_credits(uuid, integer, text) cascade;
+drop function if exists public.tg_org_owner_membership() cascade;
+drop trigger if exists trg_org_owner_membership on public.organizations;
+drop table if exists public.content_jobs cascade;
+drop table if exists public.briefs cascade;
+drop table if exists public.projects cascade;
+drop table if exists public.members cascade;
+drop table if exists public.credit_ledger cascade;
+drop table if exists public.organizations cascade;
+
+-- 2) CREATE tablas
+create table public.organizations (
+  id          uuid primary key default gen_random_uuid(),
+  name        text not null,
+  owner_id    uuid not null references auth.users(id),
+  created_at  timestamptz not null default now()
+);
+
+create table public.members (
+  org_id    uuid not null references public.organizations(id) on delete cascade,
+  user_id   uuid not null references auth.users(id) on delete cascade,
+  role      text not null check (role in ('owner','admin','member')),
+  joined_at timestamptz not null default now(),
+  primary key (org_id, user_id)
+);
+create index members_user_id_idx on public.members(user_id);
+
+create table public.projects (
+  id          uuid primary key default gen_random_uuid(),
+  org_id      uuid not null references public.organizations(id) on delete cascade,
+  name        text not null,
+  created_by  uuid not null references auth.users(id),
+  created_at  timestamptz not null default now()
+);
+create index projects_org_id_idx on public.projects(org_id);
+
+create table public.briefs (
+  id          uuid primary key default gen_random_uuid(),
+  project_id  uuid not null references public.projects(id) on delete cascade,
+  title       text not null,
+  payload     jsonb not null default '{}'::jsonb,
+  created_by  uuid not null references auth.users(id),
+  created_at  timestamptz not null default now(),
+  updated_at  timestamptz
+);
+create index briefs_project_id_idx on public.briefs(project_id);
+
+create table public.content_jobs (
+  id          uuid primary key default gen_random_uuid(),
+  project_id  uuid not null references public.projects(id) on delete cascade,
+  job_type    text not null,
+  status      text not null default 'queued',
+  params      jsonb not null default '{}'::jsonb,
+  result_url  text,
+  created_by  uuid not null references auth.users(id),
+  created_at  timestamptz not null default now(),
+  updated_at  timestamptz
+);
+create index content_jobs_project_id_idx on public.content_jobs(project_id);
+
+create table public.credit_ledger (
+  id          uuid primary key default gen_random_uuid(),
+  org_id      uuid not null references public.organizations(id) on delete cascade,
+  amount      integer not null,
+  reason      text,
+  created_by  uuid not null references auth.users(id),
+  created_at  timestamptz not null default now()
+);
+create index credit_ledger_org_id_idx on public.credit_ledger(org_id);
+
+-- 3) RLS
+alter table public.organizations enable row level security;
+alter table public.members       enable row level security;
+alter table public.projects      enable row level security;
+alter table public.briefs        enable row level security;
+alter table public.content_jobs  enable row level security;
+alter table public.credit_ledger enable row level security;
+
+-- Helpers
+create or replace function public.is_member_of(p_org uuid)
+returns boolean
+language sql
+stable
+as $$
+  select exists(
+    select 1 from public.members m
+    where m.org_id = p_org and m.user_id = auth.uid()
+  );
+$$;
+
+create or replace function public.has_org_role(p_org uuid, roles text[])
+returns boolean
+language sql
+stable
+as $$
+  select exists(
+    select 1 from public.members m
+    where m.org_id = p_org
+      and m.user_id = auth.uid()
+      and m.role = any(roles)
+  );
+$$;
+
+-- ORGANIZATIONS
+create policy orgs_select_members_or_owner
+on public.organizations
+for select
+using (owner_id = auth.uid() or public.is_member_of(id));
+
+create policy orgs_insert_self_owner
+on public.organizations
+for insert
+with check (owner_id = auth.uid());
+
+create policy orgs_update_owner
+on public.organizations
+for update
+using (owner_id = auth.uid())
+with check (owner_id = auth.uid());
+
+create policy orgs_delete_owner
+on public.organizations
+for delete
+using (owner_id = auth.uid());
+
+-- MEMBERS
+create policy members_select_self
+on public.members
+for select using (user_id = auth.uid());
+
+create policy members_select_by_owner
+on public.members
+for select using (
+  exists(select 1 from public.organizations o where o.id = members.org_id and o.owner_id = auth.uid())
+);
+
+create policy members_insert_by_owner
+on public.members
+for insert with check (
+  exists(select 1 from public.organizations o where o.id = org_id and o.owner_id = auth.uid())
+);
+
+create policy members_update_by_owner
+on public.members
+for update
+using (exists(select 1 from public.organizations o where o.id = members.org_id and o.owner_id = auth.uid()))
+with check (exists(select 1 from public.organizations o where o.id = members.org_id and o.owner_id = auth.uid()));
+
+create policy members_delete_by_owner
+on public.members
+for delete
+using (exists(select 1 from public.organizations o where o.id = members.org_id and o.owner_id = auth.uid()));
+
+-- PROJECTS
+create policy projects_select_members
+on public.projects
+for select using (public.is_member_of(org_id));
+
+create policy projects_insert_admins
+on public.projects
+for insert with check (public.has_org_role(org_id, array['owner','admin']::text[]));
+
+create policy projects_update_admins
+on public.projects
+for update
+using (public.has_org_role(org_id, array['owner','admin']::text[]))
+with check (public.has_org_role(org_id, array['owner','admin']::text[]));
+
+create policy projects_delete_admins
+on public.projects
+for delete using (public.has_org_role(org_id, array['owner','admin']::text[]));
+
+-- BRIEFS
+create policy briefs_select_members
+on public.briefs
+for select using (
+  exists(
+    select 1 from public.projects p
+    join public.members m on m.org_id = p.org_id
+    where p.id = briefs.project_id and m.user_id = auth.uid()
+  )
+);
+
+create policy briefs_insert_members
+on public.briefs
+for insert with check (
+  exists(
+    select 1 from public.projects p
+    join public.members m on m.org_id = p.org_id
+    where p.id = briefs.project_id and m.user_id = auth.uid()
+  )
+);
+
+create policy briefs_update_creator_or_admin
+on public.briefs
+for update
+using (
+  created_by = auth.uid()
+  or exists(select 1 from public.projects p where p.id = briefs.project_id and public.has_org_role(p.org_id, array['owner','admin']::text[]))
+)
+with check (
+  created_by = auth.uid()
+  or exists(select 1 from public.projects p where p.id = briefs.project_id and public.has_org_role(p.org_id, array['owner','admin']::text[]))
+);
+
+create policy briefs_delete_creator_or_admin
+on public.briefs
+for delete
+using (
+  created_by = auth.uid()
+  or exists(select 1 from public.projects p where p.id = briefs.project_id and public.has_org_role(p.org_id, array['owner','admin']::text[]))
+);
+
+-- CONTENT JOBS
+create policy jobs_select_members
+on public.content_jobs
+for select using (
+  exists(
+    select 1 from public.projects p
+    join public.members m on m.org_id = p.org_id
+    where p.id = content_jobs.project_id and m.user_id = auth.uid()
+  )
+);
+
+create policy jobs_insert_members
+on public.content_jobs
+for insert with check (
+  exists(
+    select 1 from public.projects p
+    join public.members m on m.org_id = p.org_id
+    where p.id = content_jobs.project_id and m.user_id = auth.uid()
+  )
+);
+
+create policy jobs_update_creator_or_admin
+on public.content_jobs
+for update
+using (
+  created_by = auth.uid()
+  or exists(select 1 from public.projects p where p.id = content_jobs.project_id and public.has_org_role(p.org_id, array['owner','admin']::text[]))
+)
+with check (
+  created_by = auth.uid()
+  or exists(select 1 from public.projects p where p.id = content_jobs.project_id and public.has_org_role(p.org_id, array['owner','admin']::text[]))
+);
+
+create policy jobs_delete_creator_or_admin
+on public.content_jobs
+for delete
+using (
+  created_by = auth.uid()
+  or exists(select 1 from public.projects p where p.id = content_jobs.project_id and public.has_org_role(p.org_id, array['owner','admin']::text[]))
+);
+
+-- CREDIT LEDGER
+create policy credits_select_members
+on public.credit_ledger
+for select using (public.is_member_of(org_id));
+
+-- 4) RPCs
+create or replace function public.get_org_credit_balance(p_org uuid)
+returns integer
+language sql
+stable
+as $$
+  select coalesce(sum(amount),0)::int
+  from public.credit_ledger cl
+  where cl.org_id = p_org;
+$$;
+
+create or replace function public.add_credits(p_org uuid, p_amount integer, p_reason text default 'manual top-up')
+returns void
+language plpgsql
+security definer
+set search_path = public
+as $$
+declare
+  allowed boolean;
+begin
+  if p_amount is null or p_amount <= 0 then
+    raise exception 'amount must be positive';
+  end if;
+  select public.has_org_role(p_org, array['owner']::text[]) into allowed;
+  if not allowed then
+    raise exception 'only owner can top up';
+  end if;
+  insert into public.credit_ledger (org_id, amount, reason, created_by)
+  values (p_org, p_amount, coalesce(p_reason, 'manual top-up'), auth.uid());
+end;
+$$;
+
+-- 5) Trigger: auto-membership owner al crear org
+create or replace function public.tg_org_owner_membership()
+returns trigger
+language plpgsql
+security definer
+set search_path = public
+as $$
+begin
+  insert into public.members (org_id, user_id, role)
+  values (new.id, new.owner_id, 'owner')
+  on conflict (org_id, user_id) do nothing;
+  return new;
+end;
+$$;
+
+create trigger trg_org_owner_membership
+after insert on public.organizations
+for each row execute function public.tg_org_owner_membership();
+
+comment on schema public is 'Base multi-tenant limpia con RLS y RPCs listos.';
