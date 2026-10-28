import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const bucket = "studio-voice-notes";
const maxBytes = 25 * 1024 * 1024;
const allowed = new Set(["audio/webm","audio/ogg","audio/mp4","audio/mpeg","audio/wav","audio/x-wav","audio/aac","audio/3gpp"]);

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (authError || typeof userId !== "string") return fail("Sign in to access private voice notes.", 401);
  const { data, error } = await supabase.from("studio_voice_notes")
    .select("id,title,notes,lyrics,tags,storage_path,mime_type,duration_seconds,created_at,updated_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
  if (error) return fail("Could not load voice notes.", 500);
  return NextResponse.json({ notes: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (authError || typeof userId !== "string") return fail("Sign in to save private voice notes.", 401);
  let form: FormData;
  try { form = await request.formData(); } catch { return fail("Expected multipart form data.", 400); }
  const file = form.get("file");
  const titleValue = form.get("title");
  const tagsValue = form.get("tags");
  const notesValue = form.get("notes");
  const lyricsValue = form.get("lyrics");
  if (!(file instanceof File)) return fail("A voice-note audio file is required.", 400);
  const mime = file.type.toLowerCase().split(";")[0];
  if (!allowed.has(mime)) return fail("Unsupported audio format. Use WebM, OGG, MP4/M4A, MP3, WAV, AAC, or 3GP.", 415);
  if (file.size <= 0 || file.size > maxBytes) return fail("Voice notes must be between 1 byte and 25 MB.", 413);
  const title = typeof titleValue === "string" ? titleValue.trim().slice(0, 160) : "Voice note";
  const tags = typeof tagsValue === "string" ? [...new Set(tagsValue.split(",").map((tag) => tag.trim().replace(/^#/, "").slice(0, 32)).filter(Boolean))].slice(0, 12) : [];
  const notes = typeof notesValue === "string" ? notesValue.slice(0, 2000) : "";
  const lyrics = typeof lyricsValue === "string" ? lyricsValue.slice(0, 20000) : "";
  const ext = mime === "audio/mpeg" ? "mp3" : mime === "audio/mp4" ? "m4a" : mime === "audio/ogg" ? "ogg" : mime === "audio/wav" || mime === "audio/x-wav" ? "wav" : mime === "audio/aac" ? "aac" : mime === "audio/3gpp" ? "3gp" : "webm";
  const id = crypto.randomUUID();
  const storagePath = userId + "/" + id + "." + ext;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file, { contentType: mime, upsert: false });
  if (uploadError) return fail("Could not upload voice note. Check that the private storage bucket and owner policies are configured.", 500);
  const { data, error } = await supabase.from("studio_voice_notes").insert({
    id, user_id: userId, title: title || "Voice note", notes, lyrics, tags, storage_path: storagePath,
    mime_type: mime, duration_seconds: null,
  }).select("id,title,notes,tags,storage_path,mime_type,duration_seconds,created_at").single();
  if (error) {
    await supabase.storage.from(bucket).remove([storagePath]);
    return fail("Audio uploaded, but the note record could not be saved.", 500);
  }
  return NextResponse.json({ note: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
