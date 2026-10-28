import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const [songsResult, versionsResult] = await Promise.all([
      supabase.from("songs").select("id,title,artist_name,slug").order("title").limit(500),
      supabase.from("song_versions").select("id,song_id,title,version_type,is_public").order("title").limit(1000),
    ]);
    if (songsResult.error || versionsResult.error) return NextResponse.json({ error: "Could not load the music catalog." }, { status: 500 });
    return NextResponse.json({ songs: songsResult.data ?? [], versions: versionsResult.data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Administrator access required." }, { status: 403 }); }
}
