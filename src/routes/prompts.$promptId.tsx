import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, Copy, ExternalLink, Eye, Heart, Crown, Lock } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StorageImage } from "@/components/storage-image";
import { myLikesQuery, promptLinksQuery, promptQuery } from "@/lib/api";
import { useLikeToggle } from "@/lib/use-like";
import { useSession } from "@/hooks/use-session";
import { getSavedPrompts, toggleSavedPrompt } from "@/lib/visitor";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prompts/$promptId")({
  head: () => ({
    meta: [
      { title: "Master prompt — Prompt Aura" },
      {
        name: "description",
        content: "Read the full master prompt, copy it, and see the competitor pages behind it.",
      },
      { property: "og:title", content: "Master prompt — Prompt Aura" },
      {
        property: "og:description",
        content: "Read the full master prompt, copy it, and see the competitor pages behind it.",
      },
    ],
  }),
  component: PromptDetail,
});

function PromptDetail() {
  const { promptId } = Route.useParams();
  const { isAdmin } = useSession();
  const { data: prompt, isLoading } = useQuery(promptQuery(promptId, isAdmin));
  const { data: links = [] } = useQuery(promptLinksQuery(promptId, isAdmin));
  const { data: likes = [] } = useQuery(myLikesQuery());
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setSaved(getSavedPrompts());
    sync();
    window.addEventListener("mpl-saved-changed", sync);
    return () => window.removeEventListener("mpl-saved-changed", sync);
  }, []);

  useEffect(() => {
    void supabase.rpc("increment_prompt_views", { _prompt_id: promptId });
  }, [promptId]);

  const liked = useMemo(
    () => likes.some((l) => l.item_type === "prompt" && l.item_id === promptId),
    [likes, promptId],
  );

  const like = useLikeToggle({
    itemType: "prompt",
    itemId: promptId,
    serverLiked: liked,
    serverCount: prompt?.likes_count ?? 0,
    invalidateKeys: [["my-likes"], ["prompt", promptId], ["prompts"]],
  });

  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All prompts
        </Link>

        {isLoading ? (
          <p className="py-20 text-center text-muted-foreground">Loading…</p>
        ) : !prompt ? (
          <p className="py-20 text-center text-muted-foreground">
            This prompt isn't available. It may still be waiting for review.
          </p>
        ) : (
          <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
            <article className="order-2 min-w-0 space-y-5 sm:space-y-6 md:order-1">
              <StorageImage
                path={prompt.image_path}
                alt={prompt.title}
                className="w-full rounded-2xl border border-glass-border object-cover shadow-[var(--shadow-cinema)]"
              />
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full border border-glass-border bg-secondary/60 px-3 py-1 text-secondary-foreground backdrop-blur">
                  {prompt.category}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="size-4" /> {prompt.views_count} views
                </span>
                {prompt.tags.map((t) => (
                  <span key={t} className="text-primary">
                    #{t}
                  </span>
                ))}
              </div>
              {prompt.is_premium && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-xs text-primary">
                  <Crown className="size-3.5" /> Premium
                </span>
              )}
              <h1 className="text-cinema font-display text-2xl font-bold leading-tight sm:text-3xl">{prompt.title}</h1>

              <div className="glass-strong animate-rise-in rounded-2xl p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Master prompt
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (prompt.is_premium && !isAdmin) {
                        toast.error("Premium prompt — only reviewers can copy this one");
                        return;
                      }
                      void navigator.clipboard.writeText(prompt.prompt_text);
                      toast.success("Prompt copied");
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90",
                      prompt.is_premium && !isAdmin
                        ? "border border-glass-border text-muted-foreground"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {prompt.is_premium && !isAdmin ? (
                      <>
                        <Lock className="size-3.5" /> Locked
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" /> Copy prompt
                      </>
                    )}
                  </button>
                </div>
                {prompt.is_premium && !isAdmin ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="size-4" /> This master prompt is premium — the full text is
                    available to reviewers only.
                  </p>
                ) : (
                  <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed sm:max-h-none">
                    {prompt.prompt_text}
                  </pre>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={like.liked}
                  onClick={() => void like.toggle()}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border border-glass-border px-4 py-2 text-sm backdrop-blur transition-colors hover:border-primary/60",
                    like.liked && "border-primary/60 text-primary",
                  )}
                >
                  <Heart
                    key={like.popKey}
                    className={cn("size-4", like.liked && "animate-heart-pop fill-current")}
                  />{" "}
                  {like.count}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSavedPrompt(prompt.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border border-glass-border px-4 py-2 text-sm backdrop-blur transition-colors hover:border-primary/60",
                    saved.includes(prompt.id) && "border-primary/60 text-primary",
                  )}
                >
                  <Bookmark className={cn("size-4", saved.includes(prompt.id) && "fill-current")} />
                  {saved.includes(prompt.id) ? "Saved" : "Save"}
                </button>
              </div>
            </article>

            {links.length > 0 && (
              <aside className="order-1 md:order-2 md:sticky md:top-24 md:self-start">
                <div className="glass rounded-2xl p-4">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Competitor pages & channels
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {links.map((l) => (
                      <li key={l.id}>
                        {l.url ? (
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-start gap-2 text-sm text-primary hover:underline"
                          >
                            <ExternalLink className="mt-0.5 size-4 shrink-0" />
                            <span className="break-all">{l.label || l.url}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-start gap-2 text-sm text-muted-foreground">
                            <Lock className="mt-0.5 size-4 shrink-0" />
                            <span className="break-all">{l.label || "Locked link"}</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
