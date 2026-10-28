-- Applied to Supabase project tmkseucvrlnztpgdnrna as migration
-- 20261028020232_studio_role_guard_and_track_target_check.
-- The target XOR constraint was preflighted against existing rows (0 invalid rows).

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Profile roles can only be changed by a trusted administrator.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_escalation on public.profiles;
create trigger prevent_profile_role_escalation
before update of role on public.profiles
for each row execute function public.prevent_profile_role_escalation();

alter table public.listening_session_tracks
  drop constraint if exists listening_session_tracks_exactly_one_target;
alter table public.listening_session_tracks
  add constraint listening_session_tracks_exactly_one_target
  check ((song_id is not null) <> (version_id is not null));

alter function public.touch_updated_at() set search_path = '';
