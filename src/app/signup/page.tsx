"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(""); setSuccess(false);
    const { error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/studio/song-desk` },
    });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setSuccess(true); setMessage("Check your email for the confirmation link.");
  }

  return <main className="min-h-screen bg-[#11110f] text-[#e9e3d8] px-5 py-12"><div className="mx-auto w-full max-w-md">
    <Link href="/" className="text-sm font-bold tracking-[.18em]">ATTIKID®</Link>
    <p className="mt-16 text-xs tracking-[.2em] text-[#aaa49a]">CREATE YOUR WORKSPACE</p>
    <h1 className="mt-4 text-5xl font-semibold tracking-[-.06em]">Make room.</h1>
    <form onSubmit={submit} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-xs"><span>Email</span><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="border border-[#393833] bg-transparent p-3 text-sm" /></label>
      <label className="grid gap-2 text-xs"><span>Password (at least 8 characters)</span><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="border border-[#393833] bg-transparent p-3 text-sm" /></label>
      {message && <p role={success ? "status" : "alert"} className="text-sm text-[#aaa49a]">{message}</p>}
      <button disabled={busy} className="mt-2 bg-[#e9e3d8] p-3 text-xs font-semibold tracking-[.12em] text-[#11110f] disabled:opacity-50">{busy ? "CREATING…" : "CREATE ACCOUNT"}</button>
    </form>
    <p className="mt-6 text-xs text-[#aaa49a]">Already registered? <Link href="/login" className="text-[#e9e3d8] underline">Sign in</Link></p>
  </div></main>;
}
