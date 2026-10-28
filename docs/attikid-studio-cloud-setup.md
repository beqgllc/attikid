# ATTIKID Studio cloud integration

## Environment

Set these variables in local `.env.local` and in Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`: the project API URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key (or legacy anon key if the project has not moved to publishable keys).

Do not put the service-role key in a browser environment or any variable prefixed with `NEXT_PUBLIC_`.

## Supabase Auth

In Supabase Authentication → URL Configuration:

- Set the Site URL to `https://attikid.com`.
- Add `https://attikid.com/auth/callback` to Redirect URLs.
- Add the Vercel preview callback URLs needed for preview deployments, using the exact preview domains.
- Configure email confirmation and password-reset email templates to preserve the `redirectTo` query value.

## Database and storage

The Studio tables and private `studio-voice-notes` bucket already exist in the connected Supabase project. The role-escalation guard and the exactly-one-target check constraint were applied as migration `20261028020232_studio_role_guard_and_track_target_check`; the matching migration is checked into this repository.

Do not re-run a baseline migration that creates the existing tables. Review the existing RLS policies before changing them. Cloud draft and voice-note routes use the authenticated user's cookie session and depend on the existing owner-scoped policies.

Voice-note uploads are capped at 25 MiB per file. The browser must be on HTTPS (localhost is also permitted by browsers) and the user must grant microphone access.

## Smoke test

1. Deploy a preview with the two public Supabase environment variables.
2. Open `/signup`, create a test account, confirm the email, and return through `/auth/callback`.
3. Open `/studio/song-desk`; save a cloud draft, edit it, save again, and reload.
4. Save a checkpoint, change the lyrics, restore the checkpoint, and verify the draft content.
5. Record a short note, save it to private cloud storage, play it, and delete it. Repeat with a second account and verify that account cannot list or play the first account's note.
6. Open `/admin/music-room` with an account whose `profiles.role` is `admin`. Create an unpublished session, add catalog tracks, reorder them, and publish it.
7. Verify `/music-room` shows only published sessions and public versions. Attempt to publish a session with a private version and confirm the API rejects it.
8. Run `npm run lint`, `npm run typecheck`, `npm run test:run`, and `npm run build`.

## Current behavior and limits

- The browser-local draft and idea inbox continue to work independently of account sign-in.
- Cloud projects are explicitly saved/updated; local keystrokes are not silently pushed to the cloud.
- Cloud checkpoints store JSON snapshots. They are user-owned and capped to 50 checkpoints per project in reads; retention/cleanup policy can be added later.
- Rhyme suggestions use Datamuse. The existing Studio Rhyme Finder remains the deeper phonetic/rhyme-highlighting tool; Song Desk includes quick match modes and approximate syllable counts.
- Cadence counts are estimates, not audio alignment. The tempo panel calculates a 4/4 bar duration and a rough bars-per-line estimate.
- Curator publishing does not create songs or invent audio. It references existing song/version rows only.
