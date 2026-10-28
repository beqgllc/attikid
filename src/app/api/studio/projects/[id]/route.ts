import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };
const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") return null;
  return { supabase, userId };
}

export async function PATCH(request: NextRequest, context: Context) {
  const auth = await authenticatedClient();
  if (!auth) return fail("Sign in to update cloud drafts.", 401);
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("Invalid project id.", 400);
  let body: unknown;
  try { body = await request.json(); } catch { return fail("Expected a JSON body.", 400); }
  if (!body || typeof body !== "object") return fail("Invalid draft payload.", 400);
  const input = body as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 160) : "";
  const draft = input.draft;
  if (!title || !draft || typeof draft !== "object" || JSON.stringify(draft).length > 500_000) return fail("Draft title and a valid draft under 500 KB are required.", 400);
  const { data, error } = await auth.supabase.from("studio_projects").update({ title, draft, updated_at: new Date().toISOString() })
    .eq("id", id).eq("user_id", auth.userId).select("id,title,draft,updated_at").maybeSingle();
  if (error) return fail("Could not update cloud draft.", 500);
  if (!data) return fail("Draft not found or you do not own it.", 404);
  return NextResponse.json({ project: data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const auth = await authenticatedClient();
  if (!auth) return fail("Sign in to archive cloud drafts.", 401);
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("Invalid project id.", 400);
  const { data, error } = await auth.supabase.from("studio_projects").update({ archived_at: new Date().toISOString() })
    .eq("id", id).eq("user_id", auth.userId).select("id").maybeSingle();
  if (error) return fail("Could not archive cloud draft.", 500);
  if (!data) return fail("Draft not found or you do not own it.", 404);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
