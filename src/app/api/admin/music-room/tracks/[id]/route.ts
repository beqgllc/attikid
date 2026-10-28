import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };
const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await context.params;
    let body: unknown;
    try { body = await request.json(); } catch { return fail("Expected JSON.", 400); }
    if (!body || typeof body !== "object" || typeof (body as Record<string, unknown>).position !== "number") return fail("A numeric position is required.", 400);
    const position = Math.max(0, Math.trunc((body as { position: number }).position));
    const { data, error } = await supabase.from("listening_session_tracks").update({ position }).eq("id", id).select("id,position").maybeSingle();
    if (error) return fail("Could not reorder track.", 500);
    if (!data) return fail("Track not found.", 404);
    return NextResponse.json({ track: data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return fail("Administrator access required.", 403); }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { supabase } = await requireAdmin();
    const { id } = await context.params;
    const { data, error } = await supabase.from("listening_session_tracks").delete().eq("id", id).select("id").maybeSingle();
    if (error) return fail("Could not remove track.", 500);
    if (!data) return fail("Track not found.", 404);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return fail("Administrator access required.", 403); }
}
