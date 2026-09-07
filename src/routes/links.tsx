import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Heart } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { linksQuery, myLikesQuery, toggleLike } from "@/lib/api";
import { LINK_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: "Important links — Prompt Vault" },
      {
        name: "description",
        content:
          "A curated, reviewed collection of tools, tutorials, channels and communities worth bookmarking.",
      },
      { property: "og:title", content: "Important links — Prompt Vault" },
      {
        property: "og:description",
        content: "Curated tools, tutorials, channels and communities worth bookmarking.",
      },
    ],
  }),
  component: LinksPage,
});

function LinksPage() {
  const qc = useQueryClient();
  const { data: links = [], isLoading } = useQuery(linksQuery());
  const { data: likes = [] } = useQuery(myLikesQuery());
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");

  const likedIds = useMemo(
    () => new Set(likes.filter((l) => l.item_type === "link").map((l) => l.item_id)),
    [likes],
  );

  const like = useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) => toggleLike("link", id, liked),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-likes"] });
      void qc.invalidateQueries({ queryKey: ["links"] });
    },
    onError: () => toast.error("Could not update your like"),
  });

  const visible = links.filter((l) => {
    if (type !== "All" && l.link_type !== type) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return l.title.toLowerCase().includes(q) || (l.note ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Important links</h1>
        <p className="mt-2 text-muted-foreground">
          Tools, tutorials, channels and communities the community keeps coming back to.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links…"
            className="min-w-56 flex-1 rounded-md border border-glass-border bg-background/40 backdrop-blur px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-glass-border bg-background/40 backdrop-blur px-3 py-2 text-sm"
          >
            <option value="All">All types</option>
            {LINK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-muted-foreground">Loading links…</p>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No links here yet.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {visible.map((l) => {
              const liked = likedIds.has(l.id);
              return (
                <li
                  key={l.id}
                  className="flex items-start gap-4 glass rounded-2xl p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                        {l.link_type}
                      </span>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1.5 font-medium hover:text-primary"
                      >
                        {l.title}
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                    {l.note && <p className="mt-1.5 text-sm text-muted-foreground">{l.note}</p>}
                    <p className="mt-1 truncate text-xs text-muted-foreground/70">{l.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => like.mutate({ id: l.id, liked })}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm",
                      liked && "border-primary/60 text-primary",
                    )}
                  >
                    <Heart className={cn("size-4", liked && "fill-current")} /> {l.likes_count}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
