import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Prompt Aura" },
      {
        name: "description",
        content: "Sign in to review and publish submissions to the master prompt library.",
      },
      { property: "og:title", content: "Admin sign in — Prompt Aura" },
      { property: "og:description", content: "Sign in to review submissions to the library." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = credentials.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        await navigate({ to: "/admin", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        if (data.session) await navigate({ to: "/admin", replace: true });
        else setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    await navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-bold">
          {mode === "signin" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accounts are for reviewers. Visitors can browse and submit without one.
        </p>

        {sent ? (
          <p className="mt-8 rounded-xl border border-primary/40 bg-card p-5 text-sm">
            Check your email to confirm your address, then come back and sign in.
          </p>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Password</span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => void google()}
              className="mt-3 w-full rounded-md border border-border px-4 py-2.5 text-sm hover:border-primary/60"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-6 text-sm text-primary hover:underline"
            >
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
