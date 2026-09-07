import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { PromptCard } from "@/components/prompt-card";
import { allPromptLinksQuery, myLikesQuery, promptsQuery } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import { getSavedPrompts } from "@/lib/visitor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt Vault — Master Prompts by Niche" },
      {
        name: "description",
        content:
          "Browse a reviewed collection of master prompts across pets, finance, horror, motivation and more — each with a reference image and competitor links.",
      },
      { property: "og:title", content: "Prompt Vault — Master Prompts by Niche" },
      {
        property: "og:description",
        content: "A reviewed collection of master prompts with reference images and competitor links.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: prompts = [], isLoading } = useQuery(promptsQuery());
  const { data: likes = [] } = useQuery(myLikesQuery());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [tag, setTag] = useState<string>("");
  const [sort, setSort] = useState<"new" | "liked">("new");
  const [onlySaved, setOnlySaved] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setSaved(getSavedPrompts());
    sync();
    window.addEventListener("mpl-saved-changed", sync);
    return () => window.removeEventListener("mpl-saved-changed", sync);
  }, []);

  const likedIds = useMemo(
    () => new Set(likes.filter((l) => l.item_type === "prompt").map((l) => l.item_id)),
    [likes],
  );

  const allTags = useMemo(
    () => Array.from(new Set(prompts.flatMap((p) => p.tags))).sort().slice(0, 30),
    [prompts],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = prompts.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (tag && !p.tags.includes(tag)) return false;
      if (onlySaved && !saved.includes(p.id)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.prompt_text.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    return sort === "liked" ? [...list].sort((a, b) => b.likes_count - a.likes_count) : list;
  }, [prompts, search, category, tag, sort, onlySaved, saved]);

  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4">
        <section className="py-12">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Master prompt library</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl">
            Every winning prompt, filed by niche.
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Search reviewed master prompts with their reference image and the competitor pages they
            came from. Anyone can add one — we review each submission before it goes live.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Submit a prompt
            </Link>
            <Link
              to="/links"
              className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/60"
            >
              Browse links
            </Link>
          </div>
        </section>

        <section className="space-y-4 border-t border-border/60 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search prompts…"
                className="w-full rounded-md border border-input bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "new" | "liked")}
              className="rounded-md border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="new">Newest</option>
              <option value="liked">Most liked</option>
            </select>
            <button
              type="button"
              onClick={() => setOnlySaved((v) => !v)}
              className={cn(
                "rounded-md border border-border px-3 py-2 text-sm",
                onlySaved && "border-primary/60 text-primary",
              )}
            >
              Saved ({saved.length})
            </button>
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(tag === t ? "" : t)}
                  className={cn(
                    "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground",
                    tag === t && "border-primary/60 text-primary",
                  )}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="pb-8">
          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">Loading prompts…</p>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              Nothing here yet. Be the first to submit a master prompt.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  liked={likedIds.has(p.id)}
                  saved={saved.includes(p.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
