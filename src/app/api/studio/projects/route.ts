import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") return jsonError("Sign in to access cloud drafts.", 401);
  const { data, error } = await supabase.from("studio_projects")
    .select("id,title,draft,archived_at,created_at,updated_at")
    .eq("user_id", userId).is("archived_at", null).order("updated_at", { ascending: false }).limit(100);
  if (error) return jsonError("Could not load cloud drafts.", 500);
  return NextResponse.json({ projects: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") return jsonError("Sign in to save cloud drafts.", 401);
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Expected a JSON body.", 400); }
  if (!body || typeof body !== "object") return jsonError("Invalid draft payload.", 400);
  const input = body as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 160) : "";
  const draft = input.draft;
  if (!title || !draft || typeof draft !== "object" || JSON.stringify(draft).length > 500_000) return jsonError("Draft title and a valid draft under 500 KB are required.", 400);
  const { data, error } = await supabase.from("studio_projects").insert({ user_id: userId, title, draft }).select("id,title,draft,created_at,updated_at").single();
  if (error) return jsonError("Could not create cloud draft.", 500);
  return NextResponse.json({ project: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
