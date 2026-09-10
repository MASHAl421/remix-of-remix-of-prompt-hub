import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Crown, ExternalLink, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StorageImage } from "@/components/storage-image";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { allPromptLinksQuery, imagesQuery, linksQuery, promptsQuery, type Status } from "@/lib/api";
import { inviteAdmin, listAdmins, removeAdmin } from "@/lib/admins.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Review queue — Prompt Aura admin" },
      {
        name: "description",
        content: "Approve, reject and manage prompts, links and images submitted to the library.",
      },
      { property: "og:title", content: "Review queue — Prompt Aura admin" },
      { property: "og:description", content: "Approve, reject and manage community submissions." },
    ],
  }),
  component: AdminPage,
});

type Tab = "prompts" | "links" | "images" | "admins";

function AdminPage() {
  const { isAdmin, loading } = useSession();
  const [tab, setTab] = useState<Tab>("prompts");
  const [status, setStatus] = useState<Status>("pending");

  const pendingPrompts = useQuery(promptsQuery("pending", true));
  const pendingLinks = useQuery(linksQuery("pending", true));
  const pendingImages = useQuery(imagesQuery("pending"));

  if (loading) {
    return <Shell>Checking your access…</Shell>;
  }
  if (!isAdmin) {
    return (
      <Shell>
        <p>
          You&apos;re signed in, but this account isn&apos;t a reviewer yet. Ask an existing reviewer
          to add you.
        </p>
        <ClaimFirstAdmin />
      </Shell>
    );
  }

  const counts: Record<string, number> = {
    prompts: pendingPrompts.data?.length ?? 0,
    links: pendingLinks.data?.length ?? 0,
    images: pendingImages.data?.length ?? 0,
  };

  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Review queue</h1>
            <p className="mt-2 text-muted-foreground">
              Nothing is public until you approve it here.
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="scroll-row mt-6">
          {(
            [
              ["prompts", "Prompts"],
              ["links", "Links"],
              ["images", "Images"],
              ["admins", "Reviewers"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-md border border-border px-4 py-2 text-sm",
                tab === key
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              {key !== "admins" && (counts[key] ?? 0) > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab !== "admins" && (
          <div className="scroll-row mt-4">
            {(["pending", "approved", "rejected"] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full border border-border px-3 py-1 text-xs capitalize",
                  status === s && "border-primary/60 text-primary",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {tab === "prompts" && <PromptQueue status={status} />}
          {tab === "links" && <LinkQueue status={status} />}
          {tab === "images" && <ImageQueue status={status} />}
          {tab === "admins" && <AdminsPanel />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-24 text-center text-muted-foreground">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

function ClaimFirstAdmin() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const { data, error } = await supabase.rpc("claim_first_admin");
        setBusy(false);
        if (error || !data) {
          toast.error("Reviewer access is already set up — ask a reviewer to add you.");
          return;
        }
        toast.success("You're the first reviewer");
        window.location.reload();
      }}
      className="mt-6 rounded-md border border-border px-4 py-2 text-sm hover:border-primary/60"
    >
      {busy ? "Checking…" : "Claim reviewer access (first user only)"}
    </button>
  );
}

function SignOutButton() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={async () => {
        await qc.cancelQueries();
        qc.clear();
        await supabase.auth.signOut();
        await navigate({ to: "/auth", replace: true });
      }}
      className="rounded-md border border-border px-3 py-2 text-sm hover:border-primary/60"
    >
      Sign out
    </button>
  );
}

function useModeration(table: "prompts" | "links" | "images", queryKey: string) {
  const qc = useQueryClient();
  return {
    setStatus: useMutation({
      mutationFn: async ({
        id,
        status,
        note,
      }: {
        id: string;
        status: Status;
        note: string | null;
      }) => {
        const { error } = await supabase
          .from(table)
          .update({ status, rejection_note: note ?? null })
          .eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: [queryKey] });
        toast.success("Updated");
      },
      onError: (e: Error) => toast.error(e.message),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: [queryKey] });
        toast.success("Deleted");
      },
      onError: (e: Error) => toast.error(e.message),
    }),
  };
}

function PremiumToggle({
  table,
  id,
  value,
  queryKey,
}: {
  table: "prompts" | "links" | "images";
  id: string;
  value: boolean;
  queryKey: string;
}) {
  const qc = useQueryClient();
  const premium = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase.from(table).update({ is_premium: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, next) => {
      void qc.invalidateQueries({ queryKey: [queryKey] });
      toast.success(next ? "Marked premium — reviewers only" : "Now open to everyone");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <button
      type="button"
      disabled={premium.isPending}
      onClick={() => premium.mutate(!value)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm",
        value ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground",
      )}
    >
      <Crown className="size-4" />
      {value ? "Make public" : "Make premium"}
    </button>
  );
}

function ModerationActions({
  id,
  status,
  onStatus,
  onDelete,
}: {
  id: string;
  status: Status;
  onStatus: (status: Status, note: string | null) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" && (
        <button
          type="button"
          onClick={() => onStatus("approved", null)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          <Check className="size-4" /> Approve
        </button>
      )}
      {status !== "rejected" && (
        <button
          type="button"
          onClick={() => {
            const note = window.prompt("Reason for rejecting (optional)") ?? "";
            onStatus("rejected", note.trim() || null);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm"
        >
          <X className="size-4" /> Reject
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Delete this permanently?")) onDelete();
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
        aria-label={`Delete ${id}`}
      >
        <Trash2 className="size-4" /> Delete
      </button>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-16 text-center text-muted-foreground">Nothing {label} right now.</p>;
}

function PromptQueue({ status }: { status: Status }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(promptsQuery(status, true));
  const { data: allLinks = [] } = useQuery(allPromptLinksQuery(true));
  const { setStatus, remove } = useModeration("prompts", "prompts");

  const premium = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("prompts").update({ is_premium: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ["prompts"] });
      toast.success(v.value ? "Marked premium — reviewers only" : "Now visible to everyone");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linksByPrompt = new Map<string, typeof allLinks>();
  for (const l of allLinks) {
    const arr = linksByPrompt.get(l.prompt_id) ?? [];
    arr.push(l);
    linksByPrompt.set(l.prompt_id, arr);
  }

  if (isLoading) return <Empty label="loading" />;
  if (data.length === 0) return <Empty label={status} />;

  return (
    <div className="space-y-4">
      {data.map((p) => (
        <article key={p.id} className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <StorageImage
              path={p.image_path}
              alt={p.title}
              className="h-32 w-full rounded-lg object-cover sm:w-48"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold">
                {p.title}
                {p.is_premium && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-primary/60 px-2 py-0.5 align-middle text-xs text-primary">
                    <Crown className="size-3" /> Premium
                  </span>
                )}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.category} · {new Date(p.created_at).toLocaleDateString()}
                {p.tags.length > 0 && ` · ${p.tags.map((t) => `#${t}`).join(" ")}`}
              </p>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-secondary/40 p-3 font-sans text-sm">
                {p.prompt_text}
              </pre>
              {(() => {
                const promptLinks = linksByPrompt.get(p.id) ?? [];
                return promptLinks.length > 0 ? (
                  <div className="mt-3 rounded-md border border-border/60 bg-secondary/20 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Competitor pages & channels
                    </p>
                    <ul className="mt-2 space-y-1">
                      {promptLinks.map((l) => (
                        <li key={l.id}>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-start gap-1.5 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                            <span className="break-all">{l.label || l.url}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">No competitor links submitted.</p>
                );
              })()}
              {p.rejection_note && (
                <p className="mt-2 text-sm text-destructive">Note: {p.rejection_note}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <ModerationActions
                  id={p.id}
                  status={p.status}
                  onStatus={(s, note) => setStatus.mutate({ id: p.id, status: s, note })}
                  onDelete={() => remove.mutate(p.id)}
                />
                <button
                  type="button"
                  disabled={premium.isPending}
                  onClick={() => premium.mutate({ id: p.id, value: !p.is_premium })}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm",
                    p.is_premium
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <Crown className="size-4" />
                  {p.is_premium ? "Make public" : "Make premium"}
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function LinkQueue({ status }: { status: Status }) {
  const { data = [], isLoading } = useQuery(linksQuery(status, true));
  const { setStatus, remove } = useModeration("links", "links");

  if (isLoading) return <Empty label="loading" />;
  if (data.length === 0) return <Empty label={status} />;

  return (
    <div className="space-y-4">
      {data.map((l) => (
        <article key={l.id} className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="font-display text-lg font-semibold">
            {l.title}
            {l.is_premium && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-primary/60 px-2 py-0.5 align-middle text-xs text-primary">
                <Crown className="size-3" /> Premium
              </span>
            )}
          </h2>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            {l.url} <ExternalLink className="size-3.5" />
          </a>
          <p className="mt-1 text-xs text-muted-foreground">{l.link_type}</p>
          {l.note && <p className="mt-2 text-sm text-muted-foreground">{l.note}</p>}
          {l.rejection_note && (
            <p className="mt-2 text-sm text-destructive">Note: {l.rejection_note}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ModerationActions
              id={l.id}
              status={l.status}
              onStatus={(s, note) => setStatus.mutate({ id: l.id, status: s, note })}
              onDelete={() => remove.mutate(l.id)}
            />
            <PremiumToggle table="links" id={l.id} value={l.is_premium} queryKey="links" />
          </div>
        </article>
      ))}
    </div>
  );
}

function ImageQueue({ status }: { status: Status }) {
  const { data = [], isLoading } = useQuery(imagesQuery(status));
  const { setStatus, remove } = useModeration("images", "images");

  if (isLoading) return <Empty label="loading" />;
  if (data.length === 0) return <Empty label={status} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((img) => (
        <article key={img.id} className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <StorageImage path={img.image_path} alt={img.caption} className="aspect-4/3 w-full object-cover" />
          <div className="space-y-3 p-4">
            <div>
              <p className="text-sm font-medium">{img.caption}</p>
              <p className="mt-1 text-xs text-muted-foreground">{img.category}</p>
            </div>
            {img.rejection_note && (
              <p className="text-sm text-destructive">Note: {img.rejection_note}</p>
            )}
            <PremiumToggle table="images" id={img.id} value={img.is_premium} queryKey="images" />
            <ModerationActions
              id={img.id}
              status={img.status}
              onStatus={(s, note) => setStatus.mutate({ id: img.id, status: s, note })}
              onDelete={() => remove.mutate(img.id)}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function AdminsPanel() {
  const qc = useQueryClient();
  const list = useServerFn(listAdmins);
  const invite = useServerFn(inviteAdmin);
  const drop = useServerFn(removeAdmin);
  const [email, setEmail] = useState("");

  const admins = useQuery({ queryKey: ["admins"], queryFn: () => list({}) });

  const inviteMutation = useMutation({
    mutationFn: (value: string) => invite({ data: { email: value } }),
    onSuccess: () => {
      setEmail("");
      toast.success("Reviewer added — they'll get an email invite if they're new");
      void qc.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => drop({ data: { userId } }),
    onSuccess: () => {
      toast.success("Reviewer removed");
      void qc.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-xl space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return;
          inviteMutation.mutate(email.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="reviewer@email.com"
          className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={inviteMutation.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          Add reviewer
        </button>
      </form>

      {admins.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading reviewers…</p>
      ) : (
        <ul className="space-y-2">
          {(admins.data ?? []).map((a) => (
            <li
              key={a.user_id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3 text-sm"
            >
              <span>{a.email}</span>
              <button
                type="button"
                onClick={() => removeMutation.mutate(a.user_id)}
                className="text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
