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
    if (!body || typeof body !== "object") return fail("Invalid session payload.", 400);
    const input = body as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (typeof input.title === "string") patch.title = input.title.trim().slice(0, 160);
    if (typeof input.description === "string" || input.description === null) patch.description = input.description;
    if (typeof input.editorial_note === "string" || input.editorial_note === null) patch.editorial_note = input.editorial_note;
    if (typeof input.cover_art_path === "string" || input.cover_art_path === null) patch.cover_art_path = input.cover_art_path;
    if (typeof input.sort_order === "number" && Number.isFinite(input.sort_order)) patch.sort_order = Math.trunc(input.sort_order);
    if (typeof input.is_published === "boolean") {
      patch.is_published = input.is_published;
      patch.published_at = input.is_published ? new Date().toISOString() : null;
    }
    if (!Object.keys(patch).length) return fail("No supported fields to update.", 400);
    const { data, error } = await supabase.from("listening_sessions").update(patch).eq("id", id)
      .select("id,title,slug,description,editorial_note,cover_art_path,is_published,sort_order,published_at").maybeSingle();
    if (error) return fail("Could not update listening session.", 500);
    if (!data) return fail("Listening session not found.", 404);
    return NextResponse.json({ session: data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return fail("Administrator access required.", 403); }
}
