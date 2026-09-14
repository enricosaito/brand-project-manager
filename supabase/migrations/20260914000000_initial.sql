-- Marcados initial schema
-- Workspaces → members; projects → assets, tasks, activity.
-- Everything is scoped by workspace_id and protected by RLS through
-- is_workspace_member(). Run in the Supabase SQL editor or with
-- `supabase db push` once the project is linked.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums (values match the TypeScript unions in lib/types.ts)
-- ---------------------------------------------------------------------------
create type public.project_type as enum
  ('brand', 'campaign', 'website', 'social', 'packaging', 'print', 'internal', 'other');
create type public.project_status as enum
  ('planning', 'in-progress', 'review', 'completed');
create type public.asset_type as enum
  ('image', 'video', 'document', 'design', 'presentation');
create type public.task_status as enum
  ('todo', 'in-progress', 'review', 'done');
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.workspace_role as enum ('owner', 'admin', 'member');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user, created by trigger)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that already exist.
insert into public.profiles (id, full_name)
select
  id,
  coalesce(
    nullif(raw_user_meta_data ->> 'full_name', ''),
    nullif(raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(email, ''), '@', 1)
  )
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Workspaces and membership
-- ---------------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#1F1BE4',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function public.set_updated_at();

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_idx on public.workspace_members (user_id);

-- security definer so policies can consult membership without recursing
-- into workspace_members' own RLS.
create or replace function public.is_workspace_member(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create or replace function public.shares_workspace_with(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid() and theirs.user_id = other
  );
$$;

-- Creates a workspace and makes the caller its owner in one step.
create or replace function public.create_workspace(ws_name text, ws_color text default '#1F1BE4')
returns public.workspaces language plpgsql security definer set search_path = public as $$
declare
  ws public.workspaces;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.workspaces (name, color, created_by)
  values (ws_name, ws_color, auth.uid())
  returning * into ws;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws.id, auth.uid(), 'owner');
  return ws;
end $$;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  description text not null default '',
  type public.project_type not null default 'other',
  status public.project_status not null default 'planning',
  cover_url text,
  owner_id uuid references public.profiles (id) on delete set null,
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_workspace_idx on public.projects (workspace_id, updated_at desc);

create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Assets
-- ---------------------------------------------------------------------------
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  type public.asset_type not null,
  extension text not null default '',
  storage_path text,
  preview_url text,
  width integer,
  height integer,
  duration numeric,
  size bigint not null default 0,
  uploaded_by uuid references public.profiles (id) on delete set null,
  tags text[] not null default '{}',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_workspace_idx on public.assets (workspace_id, created_at desc);
create index assets_project_idx on public.assets (project_id, created_at desc);

create trigger assets_updated_at before update on public.assets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  assignee_id uuid references public.profiles (id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_project_idx on public.tasks (project_id, status);
create index tasks_workspace_idx on public.tasks (workspace_id);

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Activity
-- ---------------------------------------------------------------------------
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  target text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index activity_workspace_idx on public.activity_events (workspace_id, created_at desc);
create index activity_project_idx on public.activity_events (project_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.assets enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_events enable row level security;

-- profiles: you can see yourself and anyone you share a workspace with
create policy "profiles: read self or teammates" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_workspace_with(id));
create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- workspaces: members read, admins update; creation goes through create_workspace()
create policy "workspaces: members read" on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));
create policy "workspaces: admins update" on public.workspaces
  for update to authenticated
  using (public.is_workspace_admin(id)) with check (public.is_workspace_admin(id));
create policy "workspaces: owners delete" on public.workspaces
  for delete to authenticated
  using (exists (
    select 1 from public.workspace_members
    where workspace_id = id and user_id = auth.uid() and role = 'owner'
  ));

-- workspace_members: members read, admins manage
create policy "members: members read" on public.workspace_members
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy "members: admins insert" on public.workspace_members
  for insert to authenticated
  with check (public.is_workspace_admin(workspace_id));
create policy "members: admins update" on public.workspace_members
  for update to authenticated
  using (public.is_workspace_admin(workspace_id));
create policy "members: admins delete or self leave" on public.workspace_members
  for delete to authenticated
  using (public.is_workspace_admin(workspace_id) or user_id = auth.uid());

-- workspace-scoped content: any member can do anything (roles come later)
create policy "projects: members all" on public.projects
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "assets: members all" on public.assets
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "tasks: members all" on public.tasks
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
create policy "activity: members all" on public.activity_events
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- Storage: one public bucket, objects live under <workspace_id>/...
-- Public read keeps previews simple (unguessable uuid paths); writes are
-- restricted to workspace members.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('assets', 'assets', true, 524288000)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

create or replace function public.storage_workspace_id(object_name text)
returns uuid language sql immutable as $$
  select case
    when split_part(object_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(object_name, '/', 1)::uuid
    else null
  end;
$$;

create policy "assets bucket: members insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'assets' and public.is_workspace_member(public.storage_workspace_id(name)));
create policy "assets bucket: members update" on storage.objects
  for update to authenticated
  using (bucket_id = 'assets' and public.is_workspace_member(public.storage_workspace_id(name)));
create policy "assets bucket: members delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'assets' and public.is_workspace_member(public.storage_workspace_id(name)));
create policy "assets bucket: members list" on storage.objects
  for select to authenticated
  using (bucket_id = 'assets' and public.is_workspace_member(public.storage_workspace_id(name)));

-- ---------------------------------------------------------------------------
-- Privileges. RLS decides *which rows*; these grants decide *whether* the
-- API roles may touch the tables at all. Anonymous visitors get nothing.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;
revoke all on all tables in schema public from anon;
