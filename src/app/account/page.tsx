import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || typeof claims?.sub !== "string") redirect("/login?next=/account");
  const { data: profile } = await supabase.from("profiles").select("display_name,role").eq("id", claims.sub).maybeSingle();
  return <main className="min-h-screen bg-[#11110f] px-5 py-10 text-[#e9e3d8]">
    <div className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between border-b border-[#393833] pb-5"><Link href="/" className="font-bold tracking-[.18em]">ATTIKID®</Link><Link href="/studio/song-desk" className="text-xs">SONG DESK ↗</Link></header>
      <p className="mt-14 text-xs tracking-[.2em] text-[#aaa49a]">ACCOUNT / STUDIO</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-[-.06em]">Your workspace.</h1>
      <section className="mt-8 border border-[#393833] p-5">
        <p className="text-xs text-[#aaa49a]">SIGNED-IN EMAIL</p><p className="mt-2 text-lg">{typeof claims.email === "string" ? claims.email : "Email not available"}</p>
        <p className="mt-6 text-xs text-[#aaa49a]">DISPLAY NAME</p><p className="mt-2">{profile?.display_name || "Creator"}</p>
        <p className="mt-6 text-xs text-[#aaa49a]">ACCOUNT ROLE</p><p className="mt-2">{profile?.role || "visitor"}</p>
      </section>
      <div className="mt-6 flex flex-wrap gap-4 text-xs"><Link href="/studio/song-desk" className="border border-[#393833] px-4 py-3">OPEN SONG DESK ↗</Link>{profile?.role === "admin" && <Link href="/admin/music-room" className="border border-[#393833] px-4 py-3">CURATOR DESK ↗</Link>}<Link href="/forgot-password" className="border border-[#393833] px-4 py-3">RESET PASSWORD ↗</Link></div>
    </div>
  </main>;
}
