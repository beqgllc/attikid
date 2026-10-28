import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };
const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

async function auth() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return error || typeof userId !== "string" ? null : { supabase, userId };
}

export async function GET(_request: NextRequest, context: Context) {
  const session = await auth();
  if (!session) return fail("Sign in to play private voice notes.", 401);
  const { id } = await context.params;
  const { data: note, error } = await session.supabase.from("studio_voice_notes").select("storage_path").eq("id", id).eq("user_id", session.userId).maybeSingle();
  if (error || !note) return fail("Voice note not found.", 404);
  const { data, error: urlError } = await session.supabase.storage.from("studio-voice-notes").createSignedUrl(note.storage_path, 60);
  if (urlError || !data?.signedUrl) return fail("Could not create a temporary playback URL.", 500);
  return NextResponse.json({ url: data.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const session = await auth();
  if (!session) return fail("Sign in to delete private voice notes.", 401);
  const { id } = await context.params;
  const { data: note, error } = await session.supabase.from("studio_voice_notes").select("storage_path").eq("id", id).eq("user_id", session.userId).maybeSingle();
  if (error || !note) return fail("Voice note not found.", 404);
  const { error: deleteError } = await session.supabase.from("studio_voice_notes").delete().eq("id", id).eq("user_id", session.userId);
  if (deleteError) return fail("Could not delete voice-note metadata.", 500);
  const { error: storageError } = await session.supabase.storage.from("studio-voice-notes").remove([note.storage_path]);
  if (storageError) return fail("The note was removed from the library, but its audio file may need administrator cleanup.", 500);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
