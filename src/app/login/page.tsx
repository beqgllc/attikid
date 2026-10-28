"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [next, setNext] = useState("/studio/song-desk");
  useEffect(() => {
    const requestedNext = new URLSearchParams(window.location.search).get("next");
    if (requestedNext?.startsWith("/") && !requestedNext.startsWith("//")) setNext(requestedNext);
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    if (!isSupabaseConfigured()) { setBusy(false); setMessage("Authentication is not configured on this deployment yet."); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    router.replace(next); router.refresh();
  }

  return <main className="min-h-screen bg-[#11110f] text-[#e9e3d8] px-5 py-12">
    <div className="mx-auto w-full max-w-md">
      <Link href="/" className="text-sm font-bold tracking-[.18em]">ATTIKID®</Link>
      <p className="mt-16 text-xs tracking-[.2em] text-[#aaa49a]">STUDIO ACCESS</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-[-.06em]">Sign in.</h1>
      <p className="mt-4 text-sm leading-6 text-[#aaa49a]">Your drafts and private voice notes stay attached to your account.</p>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <label className="grid gap-2 text-xs"><span>Email</span><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="border border-[#393833] bg-transparent p-3 text-sm" /></label>
        <label className="grid gap-2 text-xs"><span>Password</span><input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="border border-[#393833] bg-transparent p-3 text-sm" /></label>
        {message && <p role="alert" className="text-sm text-[#e6a28c]">{message}</p>}
        <button disabled={busy} className="mt-2 bg-[#e9e3d8] p-3 text-xs font-semibold tracking-[.12em] text-[#11110f] disabled:opacity-50">{busy ? "SIGNING IN…" : "SIGN IN"}</button>
      </form>
      <div className="mt-6 flex justify-between gap-4 text-xs text-[#aaa49a]"><Link href="/forgot-password">Forgot password?</Link><Link href="/signup">Create account</Link></div>
    </div>
  </main>;
}
