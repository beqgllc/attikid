-- ATTIKID Studio cloud persistence and Music Room editorial data
-- Apply through Supabase migrations; tables are protected with row-level security.
create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled project' check (char_length(title) between 1 and 160),
  draft jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists studio_projects_user_updated_idx on public.studio_projects(user_id, updated_at desc);
alter table public.studio_projects enable row level security;
create policy "Owners can read studio projects" on public.studio_projects for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners can create studio projects" on public.studio_projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners can update studio projects" on public.studio_projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners can delete studio projects" on public.studio_projects for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.studio_draft_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot jsonb not null,
  version_note text,
  created_at timestamptz not null default now()
);
create index if not exists studio_draft_versions_project_created_idx on public.studio_draft_versions(project_id, created_at desc);
alter table public.studio_draft_versions enable row level security;
create policy "Owners can read draft history" on public.studio_draft_versions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners can create draft history" on public.studio_draft_versions for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.studio_projects p where p.id = project_id and p.user_id = (select auth.uid())));
create policy "Owners can delete draft history" on public.studio_draft_versions for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.studio_voice_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled voice note' check (char_length(title) between 1 and 160),
  notes text not null default '',
  lyrics text not null default '',
  tags text[] not null default '{}',
  storage_path text,
  mime_type text,
  duration_seconds numeric(9,2) check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists studio_voice_notes_user_updated_idx on public.studio_voice_notes(user_id, updated_at desc);
create index if not exists studio_voice_notes_tags_idx on public.studio_voice_notes using gin(tags);
alter table public.studio_voice_notes enable row level security;
create policy "Owners can read voice notes" on public.studio_voice_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners can create voice notes" on public.studio_voice_notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners can update voice notes" on public.studio_voice_notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners can delete voice notes" on public.studio_voice_notes for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.song_versions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs(id) on delete cascade,
  title text not null,
  version_type text not null default 'alternate' check (version_type in ('demo','acoustic','live','remix','alternate','instrumental','remaster','other')),
  audio_path text,
  story text not null default '',
  is_public boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists song_versions_song_public_order_idx on public.song_versions(song_id, is_public, sort_order);
alter table public.song_versions enable row level security;
create policy "Public can read published song versions" on public.song_versions for select to anon, authenticated using (is_public);
create policy "Admins can manage song versions" on public.song_versions for all to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create table if not exists public.listening_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  editorial_note text not null default '',
  cover_art_path text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.listening_sessions enable row level security;
create policy "Public can read published listening sessions" on public.listening_sessions for select to anon, authenticated using (is_published);
create policy "Admins can manage listening sessions" on public.listening_sessions for all to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create table if not exists public.listening_session_tracks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.listening_sessions(id) on delete cascade,
  song_id uuid references public.songs(id) on delete cascade,
  version_id uuid references public.song_versions(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  curator_note text not null default '',
  created_at timestamptz not null default now(),
  constraint listening_session_track_source_check check (song_id is not null or version_id is not null)
);
create index if not exists listening_session_tracks_order_idx on public.listening_session_tracks(session_id, position);
alter table public.listening_session_tracks enable row level security;
create policy "Public can read tracks in published sessions" on public.listening_session_tracks for select to anon, authenticated using (exists (select 1 from public.listening_sessions s where s.id = session_id and s.is_published));
create policy "Admins can manage listening session tracks" on public.listening_session_tracks for all to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studio-voice-notes', 'studio-voice-notes', false, 26214400, array['audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/ogg','audio/aac'])
on conflict (id) do nothing;
create policy "Users can read own studio voice note files" on storage.objects for select to authenticated using (bucket_id = 'studio-voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can upload own studio voice note files" on storage.objects for insert to authenticated with check (bucket_id = 'studio-voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can update own studio voice note files" on storage.objects for update to authenticated using (bucket_id = 'studio-voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'studio-voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can delete own studio voice note files" on storage.objects for delete to authenticated using (bucket_id = 'studio-voice-notes' and (storage.foldername(name))[1] = (select auth.uid())::text);
