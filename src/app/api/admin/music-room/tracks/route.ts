import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) return fail("session_id is required.", 400);
    const { data, error } = await supabase.from("listening_session_tracks")
      .select("id,session_id,song_id,version_id,position,curator_note,songs(title,artist_name),song_versions(title,version_type,songs(title,artist_name))")
      .eq("session_id", sessionId).order("position", { ascending: true });
    if (error) return fail("Could not load session tracks.", 500);
    return NextResponse.json({ tracks: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return fail("Administrator access required.", 403); }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    let body: unknown;
    try { body = await request.json(); } catch { return fail("Expected JSON.", 400); }
    if (!body || typeof body !== "object") return fail("Invalid track payload.", 400);
    const input = body as Record<string, unknown>;
    const sessionId = typeof input.session_id === "string" ? input.session_id : "";
    const songId = typeof input.song_id === "string" && input.song_id ? input.song_id : null;
    const versionId = typeof input.version_id === "string" && input.version_id ? input.version_id : null;
    if (!sessionId || Number(Boolean(songId)) + Number(Boolean(versionId)) !== 1) return fail("Choose exactly one song or alternate version.", 400);
    const position = typeof input.position === "number" && Number.isFinite(input.position) ? Math.max(0, Math.trunc(input.position)) : 0;
    const curator_note = typeof input.curator_note === "string" ? input.curator_note.slice(0, 2000) : null;
    const { data, error } = await supabase.from("listening_session_tracks").insert({ session_id: sessionId, song_id: songId, version_id: versionId, position, curator_note })
      .select("id,session_id,song_id,version_id,position,curator_note").single();
    if (error) return fail("Could not add this track. Check the session, song, and version selections.", 400);
    return NextResponse.json({ track: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch { return fail("Administrator access required.", 403); }
}
