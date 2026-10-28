"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setDone(true); setMessage("Password updated. You can return to your Studio workspace.");
  }
  return <main className="min-h-screen bg-[#11110f] text-[#e9e3d8] px-5 py-12"><div className="mx-auto w-full max-w-md">
    <Link href="/" className="text-sm font-bold tracking-[.18em]">ATTIKID®</Link>
    <h1 className="mt-16 text-5xl font-semibold tracking-[-.06em]">New password.</h1>
    <form onSubmit={submit} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-xs"><span>Password (at least 8 characters)</span><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="border border-[#393833] bg-transparent p-3 text-sm" /></label>
      {message && <p role={done ? "status" : "alert"} className="text-sm text-[#aaa49a]">{message}</p>}
      <button disabled={busy||done} className="bg-[#e9e3d8] p-3 text-xs font-semibold tracking-[.12em] text-[#11110f]">{busy ? "UPDATING…" : "UPDATE PASSWORD"}</button>
    </form>
    {done && <Link href="/studio/song-desk" className="mt-6 inline-block text-xs underline">Return to Song Desk</Link>}
  </div></main>;
}
