import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, Copy, ExternalLink, Eye, Heart } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StorageImage } from "@/components/storage-image";
import { myLikesQuery, promptLinksQuery, promptQuery, toggleLike } from "@/lib/api";
import { getSavedPrompts, toggleSavedPrompt } from "@/lib/visitor";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prompts/$promptId")({
  head: () => ({
    meta: [
      { title: "Master prompt — Prompt Vault" },
      {
        name: "description",
        content: "Read the full master prompt, copy it, and see the competitor pages behind it.",
      },
      { property: "og:title", content: "Master prompt — Prompt Vault" },
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
  const qc = useQueryClient();
  const { data: prompt, isLoading } = useQuery(promptQuery(promptId));
  const { data: links = [] } = useQuery(promptLinksQuery(promptId));
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

  const like = useMutation({
    mutationFn: () => toggleLike("prompt", promptId, liked),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-likes"] });
      void qc.invalidateQueries({ queryKey: ["prompt", promptId] });
    },
    onError: () => toast.error("Could not update your like"),
  });

  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
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
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <article className="min-w-0 space-y-6">
              <StorageImage
                path={prompt.image_path}
                alt={prompt.title}
                className="w-full rounded-xl border border-border/60 object-cover"
              />
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
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
              <h1 className="font-display text-3xl font-bold">{prompt.title}</h1>

              <div className="rounded-xl border border-border/60 bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Master prompt
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(prompt.prompt_text);
                      toast.success("Prompt copied");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Copy className="size-3.5" /> Copy prompt
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {prompt.prompt_text}
                </pre>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => like.mutate()}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm",
                    liked && "border-primary/60 text-primary",
                  )}
                >
                  <Heart className={cn("size-4", liked && "fill-current")} /> {prompt.likes_count}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSavedPrompt(prompt.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm",
                    saved.includes(prompt.id) && "border-primary/60 text-primary",
                  )}
                >
                  <Bookmark className={cn("size-4", saved.includes(prompt.id) && "fill-current")} />
                  {saved.includes(prompt.id) ? "Saved" : "Save"}
                </button>
              </div>
            </article>

            {links.length > 0 && (
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Competitor pages & channels
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {links.map((l) => (
                      <li key={l.id}>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-start gap-2 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="mt-0.5 size-4 shrink-0" />
                          <span className="break-all">{l.label || l.url}</span>
                        </a>
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
