"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import "./auth-modal.css";

type AuthMode = "signin" | "signup";
type AccountDetails = { email: string; username: string | null };

function accountFromUser(user: User): AccountDetails {
  const metadataUsername = user.user_metadata?.username;
  return {
    email: user.email ?? "",
    username: typeof metadataUsername === "string" ? metadataUsername : null,
  };
}

function readableAuthError(error: unknown): string {
  const authError = error as { code?: string; message?: string };
  const code = authError?.code ?? "";
  const message = authError?.message ?? "";

  if (code === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return "Your email address has not been confirmed yet. Open the confirmation link sent to your inbox, then sign in. You can resend the link below.";
  }
  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return "That email and password combination was not recognized. Check your details and try again.";
  }
  if (/too many requests/i.test(message)) {
    return "There have been too many attempts. Wait a little before trying again.";
  }
  return message || "We could not complete that request. Check your connection and try again.";
}

export function AuthModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [account, setAccount] = useState<AccountDetails | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAccount(session?.user ? accountFromUser(session.user) : null);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (active && !error) setAccount(data.session?.user ? accountFromUser(data.session.user) : null);
    }).catch(() => {
      if (active) setAccount(null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setMessage("");
    setSuccess(false);
    setConfirmationPending(false);
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setSuccess(false);
    setPassword("");
    setConfirmPassword("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setSuccess(false);

    if (!isSupabaseConfigured()) {
      setBusy(false);
      setMessage("Account access is not configured on this deployment yet.");
      return;
    }

    if (mode === "signup") {
      const cleanUsername = username.trim();
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(cleanUsername)) {
        setBusy(false);
        setMessage("Username must be 3–24 characters and use only letters, numbers, or underscores.");
        return;
      }
      if (password.length < 8) {
        setBusy(false);
        setMessage("Choose a password with at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setBusy(false);
        setMessage("The passwords do not match.");
        return;
      }
    }

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const cleanUsername = username.trim();
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: cleanUsername },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
          },
        });
        if (error) throw error;

        if (data.session && data.user) {
          setAccount(accountFromUser(data.user));
          close();
          router.refresh();
          return;
        }

        setConfirmationPending(true);
        setSuccess(true);
        setMessage(`Your account has been created. Check ${email.trim()} for the confirmation link. You must confirm your email before signing in.`);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      if (!data.session || !data.user) {
        setConfirmationPending(true);
        setMessage("Supabase did not start a session. Check your email for a confirmation link, then try again.");
        return;
      }

      setAccount(accountFromUser(data.user));
      close();
      router.refresh();
    } catch (error) {
      const friendlyMessage = readableAuthError(error);
      if (/has not been confirmed/i.test(friendlyMessage)) setConfirmationPending(true);
      setMessage(friendlyMessage);
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!email.trim() || !isSupabaseConfigured()) {
      setMessage("Enter the email address you used to register.");
      return;
    }

    setBusy(true);
    setMessage("");
    setSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      if (error) throw error;
      setSuccess(true);
      setMessage("A new confirmation email has been requested. Check your inbox and spam folder.");
    } catch (error) {
      setMessage(readableAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAccount(null);
      close();
      router.refresh();
    } catch (error) {
      setMessage(readableAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="ak-auth-trigger"
        onClick={() => {
          setMode("signin");
          setOpen(true);
          setMessage("");
          setSuccess(false);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {account ? "ACCOUNT" : "SIGN IN"} <span aria-hidden="true">↗</span>
      </button>

      {open && (
        <div
          className="ak-auth-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            aria-labelledby="ak-auth-title"
            aria-modal="true"
            className="ak-auth-dialog"
            role="dialog"
          >
            <button type="button" className="ak-auth-close" onClick={close} aria-label="Close account window">
              ×
            </button>

            {account ? (
              <>
                <p className="ak-auth-eyebrow">ATTIKID® ACCOUNT</p>
                <h2 id="ak-auth-title">You’re in.</h2>
                <p className="ak-auth-intro">You are signed in{account.username ? ` as @${account.username}` : ""}.</p>
                <div className="ak-auth-account">
                  <span>ACCOUNT EMAIL</span>
                  <strong>{account.email}</strong>
                </div>
                <Link className="ak-auth-submit ak-auth-account-link" href="/studio/song-desk" onClick={close}>
                  OPEN SONG DESK
                </Link>
                {message && <p className="ak-auth-message" role="alert">{message}</p>}
                <button type="button" className="ak-auth-signout" onClick={signOut} disabled={busy}>
                  {busy ? "PLEASE WAIT…" : "SIGN OUT"}
                </button>
              </>
            ) : (
              <>
                <p className="ak-auth-eyebrow">ATTIKID® ACCOUNT</p>
                <h2 id="ak-auth-title">{mode === "signin" ? "Welcome back." : "Make room."}</h2>
                <p className="ak-auth-intro">
                  {mode === "signin"
                    ? "Sign in to return to your workspace and saved drafts."
                    : "One free account gives your writing a place to live between sessions."}
                </p>

                {mode === "signup" && (
                  <section className="ak-auth-perks" aria-labelledby="ak-auth-perks-title">
                    <p id="ak-auth-perks-title">YOUR STUDIO ACCOUNT INCLUDES</p>
                    <ul>
                      <li><strong>Cloud-saved Song Desk drafts</strong><span>Keep in-progress writing tied to your account.</span></li>
                      <li><strong>Version checkpoints</strong><span>Save milestones and restore earlier drafts.</span></li>
                      <li><strong>Private voice notes</strong><span>Store and revisit recorded ideas and reference takes.</span></li>
                      <li><strong>Pick up across devices</strong><span>Sign in elsewhere to continue with your cloud-saved work.</span></li>
                    </ul>
                    <small>Creating an account is free. No paid plan is required.</small>
                  </section>
                )}

                <div className="ak-auth-switch" aria-label="Account action">
                  <button type="button" onClick={() => changeMode("signin")} aria-pressed={mode === "signin"} className={mode === "signin" ? "is-active" : ""}>
                    SIGN IN
                  </button>
                  <button type="button" onClick={() => changeMode("signup")} aria-pressed={mode === "signup"} className={mode === "signup" ? "is-active" : ""}>
                    CREATE ACCOUNT
                  </button>
                </div>

                <form className="ak-auth-form" onSubmit={submit}>
                  {mode === "signup" && (
                    <label>
                      <span>Username</span>
                      <input
                        autoComplete="username"
                        required
                        minLength={3}
                        maxLength={24}
                        pattern="[A-Za-z0-9_]{3,24}"
                        title="Use 3–24 letters, numbers, or underscores."
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="your_username"
                      />
                    </label>
                  )}
                  <label>
                    <span>Email</span>
                    <input
                      autoComplete="email"
                      required
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>
                  <label>
                    <span>Password {mode === "signup" ? "(8 characters minimum)" : ""}</span>
                    <input
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      minLength={mode === "signup" ? 8 : undefined}
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                    />
                  </label>
                  {mode === "signup" && (
                    <label>
                      <span>Verify password</span>
                      <input
                        autoComplete="new-password"
                        required
                        minLength={8}
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Enter your password again"
                      />
                    </label>
                  )}

                  {message && (
                    <p className={success ? "ak-auth-message is-success" : "ak-auth-message"} role={success ? "status" : "alert"}>
                      {message}
                    </p>
                  )}

                  {confirmationPending && (
                    <button type="button" className="ak-auth-resend" onClick={resendConfirmation} disabled={busy}>
                      RESEND CONFIRMATION EMAIL
                    </button>
                  )}

                  <button type="submit" className="ak-auth-submit" disabled={busy}>
                    {busy
                      ? "PLEASE WAIT…"
                      : mode === "signin"
                        ? "SIGN IN"
                        : "CREATE ACCOUNT"}
                  </button>
                </form>

                {mode === "signin" && (
                  <a className="ak-auth-forgot" href="/forgot-password" onClick={close}>
                    Forgot password?
                  </a>
                )}
                <p className="ak-auth-footnote">
                  {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
                  <button type="button" onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}>
                    {mode === "signin" ? "Create an account" : "Sign in"}
                  </button>
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
