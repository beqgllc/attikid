"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    if (!isSupabaseConfigured()) { setBusy(false); setMessage("Authentication is not configured on this deployment yet."); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
    });
    setBusy(false);
    setMessage(error ? error.message : "If an account exists for that address, a reset link has been sent.");
  }
  return <main className="min-h-screen bg-[#11110f] text-[#e9e3d8] px-5 py-12"><div className="mx-auto w-full max-w-md">
    <Link href="/" className="text-sm font-bold tracking-[.18em]">ATTIKID®</Link>
    <h1 className="mt-16 text-5xl font-semibold tracking-[-.06em]">Reset access.</h1>
    <form onSubmit={submit} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-xs"><span>Email</span><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="border border-[#393833] bg-transparent p-3 text-sm" /></label>
      {message && <p role="status" className="text-sm text-[#aaa49a]">{message}</p>}
      <button disabled={busy} className="bg-[#e9e3d8] p-3 text-xs font-semibold tracking-[.12em] text-[#11110f]">{busy ? "SENDING…" : "SEND RESET LINK"}</button>
    </form>
    <Link href="/login" className="mt-6 inline-block text-xs text-[#aaa49a] underline">Back to sign in</Link>
  </div></main>;
}
