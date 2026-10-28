import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase.from("listening_sessions")
      .select("id,title,slug,description,editorial_note,cover_art_path,is_published,sort_order,published_at,created_at")
      .order("sort_order", { ascending: true });
    if (error) return fail("Could not load listening sessions.", 500);
    return NextResponse.json({ sessions: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return fail("Administrator access required.", 403); }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    let body: unknown;
    try { body = await request.json(); } catch { return fail("Expected JSON.", 400); }
    if (!body || typeof body !== "object") return fail("Invalid session payload.", 400);
    const input = body as Record<string, unknown>;
    const title = typeof input.title === "string" ? input.title.trim().slice(0, 160) : "";
    const slug = typeof input.slug === "string" ? input.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "").slice(0, 120) : "";
    if (!title || !slug) return fail("Title and slug are required.", 400);
    const description = typeof input.description === "string" ? input.description.slice(0, 2000) : null;
    const editorial_note = typeof input.editorial_note === "string" ? input.editorial_note.slice(0, 4000) : null;
    const { data, error } = await supabase.from("listening_sessions").insert({
      title, slug, description, editorial_note, is_published: false, sort_order: Number.isFinite(input.sort_order) ? input.sort_order : 0,
    }).select("id,title,slug,description,editorial_note,is_published,sort_order,created_at").single();
    if (error) return fail(error.code === "23505" ? "That session slug is already in use." : "Could not create session.", error.code === "23505" ? 409 : 500);
    return NextResponse.json({ session: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch { return fail("Administrator access required.", 403); }
}
