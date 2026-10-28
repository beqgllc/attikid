"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";

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

  function close() {
    setOpen(false);
    setMessage("");
    setSuccess(false);
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setSuccess(false);
    setPassword("");
    setConfirmPassword("");
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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

      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: cleanUsername },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      setBusy(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      setSuccess(true);
      setMessage("Account created. Check your email for a confirmation link before signing in.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    close();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="ak-auth-trigger"
        onClick={() => { setMode("signin"); setOpen(true); }}
        aria-haspopup="dialog"
      >
        SIGN IN <span aria-hidden="true">↗</span>
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
            <p className="ak-auth-eyebrow">ATTIKID® ACCOUNT</p>
            <h2 id="ak-auth-title">{mode === "signin" ? "Welcome back." : "Make room."}</h2>
            <p className="ak-auth-intro">
              {mode === "signin"
                ? "Sign in to return to your workspace and saved drafts."
                : "Create an account for your workspace and saved drafts."}
            </p>

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
          </section>
        </div>
      )}
    </>
  );
}
