import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { PromptCard } from "@/components/prompt-card";
import { allPromptLinksQuery, myLikesQuery, promptsQuery } from "@/lib/api";
import { useSession } from "@/hooks/use-session";
import { CATEGORIES } from "@/lib/constants";
import { getSavedPrompts } from "@/lib/visitor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt Aura — Master Prompts by Niche" },
      {
        name: "description",
        content:
          "Browse a reviewed collection of master prompts across pets, finance, horror, motivation and more — each with a reference image and competitor links.",
      },
      { property: "og:title", content: "Prompt Aura — Master Prompts by Niche" },
      {
        property: "og:description",
        content: "A reviewed collection of master prompts with reference images and competitor links.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { isAdmin } = useSession();
  const { data: prompts = [], isLoading } = useQuery(promptsQuery("approved", isAdmin));
  const { data: likes = [] } = useQuery(myLikesQuery());
  const { data: allLinks = [] } = useQuery(allPromptLinksQuery(isAdmin));

  const linksByPrompt = useMemo(() => {
    const map = new Map<string, typeof allLinks>();
    for (const l of allLinks) {
      const arr = map.get(l.prompt_id) ?? [];
      arr.push(l);
      map.set(l.prompt_id, arr);
    }
    return map;
  }, [allLinks]);
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
        <section className="animate-rise-in py-10 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-background/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-primary backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Master prompt library
          </span>
          <h1 className="text-cinema mt-3 max-w-3xl font-display text-3xl font-bold leading-[1.1] sm:mt-4 sm:text-5xl lg:text-6xl">
            Every winning prompt, filed by niche.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Search reviewed master prompts with their reference image and the competitor pages they
            came from. Anyone can add one — we review each submission before it goes live.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:flex sm:flex-wrap">
            <Link
              to="/submit"
              className="rounded-lg bg-gradient-to-r from-primary to-chart-2 px-5 py-3 text-center text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-105 sm:py-2.5"
            >
              Submit a prompt
            </Link>
            <Link
              to="/links"
              className="glass rounded-lg px-5 py-3 text-center text-sm transition-colors hover:border-primary/60 sm:py-2.5"
            >
              Browse links
            </Link>
          </div>
        </section>

        <section className="glass animate-rise-in space-y-3 rounded-2xl p-3 sm:space-y-4 sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts…"
              className="w-full rounded-lg border border-glass-border bg-background/40 py-2.5 pl-9 pr-3 text-sm outline-none backdrop-blur focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-w-0 rounded-lg border border-glass-border bg-background/40 px-3 py-2.5 text-sm backdrop-blur"
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
              className="min-w-0 rounded-lg border border-glass-border bg-background/40 px-3 py-2.5 text-sm backdrop-blur"
            >
              <option value="new">Newest</option>
              <option value="liked">Most liked</option>
            </select>
            <button
              type="button"
              onClick={() => setOnlySaved((v) => !v)}
              className={cn(
                "rounded-lg border border-glass-border bg-background/40 px-3 py-2.5 text-sm backdrop-blur transition-colors hover:border-primary/60",
                onlySaved && "border-primary/60 text-primary",
              )}
            >
              Saved ({saved.length})
            </button>
            {(tag || category !== "All" || search || onlySaved) && (
              <button
                type="button"
                onClick={() => {
                  setTag("");
                  setCategory("All");
                  setSearch("");
                  setOnlySaved(false);
                }}
                className="rounded-lg border border-glass-border bg-background/40 px-3 py-2.5 text-sm text-muted-foreground backdrop-blur"
              >
                Clear
              </button>
            )}
          </div>
          {allTags.length > 0 && (
            <div className="scroll-row -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(tag === t ? "" : t)}
                  className={cn(
                    "rounded-full border border-glass-border px-3 py-1.5 text-xs text-muted-foreground backdrop-blur transition-colors hover:border-primary/50",
                    tag === t && "border-primary/60 text-primary",
                  )}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="py-6 sm:py-8">
          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">Loading prompts…</p>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              Nothing here yet. Be the first to submit a master prompt.
            </p>
          ) : (
            <>
              <p className="pb-3 text-xs text-muted-foreground">
                {visible.length} prompt{visible.length === 1 ? "" : "s"}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {visible.map((p, i) => (
                  <PromptCard
                    key={p.id}
                    index={i}
                    prompt={p}
                    liked={likedIds.has(p.id)}
                    saved={saved.includes(p.id)}
                    links={linksByPrompt.get(p.id) ?? []}
                    unlocked={isAdmin}
                  />
                ))}
              </div>
            </>
          )}
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
