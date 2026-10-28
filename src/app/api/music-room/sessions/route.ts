import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("listening_sessions")
    .select("id,title,slug,description,editorial_note,cover_art_path,sort_order,published_at,listening_session_tracks(position,curator_note,songs(id,title,artist_name,slug,audio_path,artwork_path,duration_seconds),song_versions(id,title,version_type,audio_path,story,metadata,songs(id,title,artist_name,slug,audio_path,artwork_path,duration_seconds)))")
    .eq("is_published", true).order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: "Could not load listening sessions." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ sessions: data ?? [] }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
