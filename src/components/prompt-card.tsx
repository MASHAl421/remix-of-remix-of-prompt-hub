import { Link } from "@tanstack/react-router";
import { Bookmark, Copy, Crown, Eye, ExternalLink, Heart, Lock } from "lucide-react";
import { toast } from "sonner";
import type { Prompt, PromptLink } from "@/lib/api";
import { useLikeToggle } from "@/lib/use-like";
import { StorageImage } from "@/components/storage-image";
import { toggleSavedPrompt } from "@/lib/visitor";
import { cn } from "@/lib/utils";

export function PromptCard({
  prompt,
  liked,
  saved,
  links = [],
  index = 0,
  unlocked = false,
}: {
  prompt: Prompt;
  liked: boolean;
  saved: boolean;
  links?: PromptLink[];
  index?: number;
  unlocked?: boolean;
}) {
  const locked = prompt.is_premium && !unlocked;
  const like = useLikeToggle({
    itemType: "prompt",
    itemId: prompt.id,
    serverLiked: liked,
    serverCount: prompt.likes_count,
    invalidateKeys: [["my-likes"], ["prompts"]],
  });

  return (
    <article
      className="group glass animate-rise-in glow-ring flex flex-col overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1"
      style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
    >
      <Link to="/prompts/$promptId" params={{ promptId: prompt.id }} className="block overflow-hidden">
        <div className="relative">
          <StorageImage
            path={prompt.image_path}
            alt={prompt.title}
            className="aspect-[4/3] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-glass-border bg-secondary/60 px-2.5 py-1 text-secondary-foreground backdrop-blur">
            {prompt.category}
          </span>
          {prompt.is_premium && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/60 bg-primary/10 px-2.5 py-1 text-primary">
              <Crown className="size-3" /> Premium
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-muted-foreground">
            <Eye className="size-3.5" /> {prompt.views_count}
          </span>
        </div>
        <Link to="/prompts/$promptId" params={{ promptId: prompt.id }}>
          <h3 className="font-display text-base font-semibold leading-snug transition-colors group-hover:text-primary">
            {prompt.title}
          </h3>
        </Link>
        {locked ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5" /> Premium prompt — locked
          </p>
        ) : (
          <p className="line-clamp-3 text-sm text-muted-foreground">{prompt.prompt_text}</p>
        )}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs text-primary">
                #{tag}
              </span>
            ))}
          </div>
        )}
        {links.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-glass-border pt-2">
            <p className="text-xs font-medium text-muted-foreground">Competitor links</p>
            <ul className="space-y-1">
              {links.slice(0, 3).map((l) => (
                <li key={l.id}>
                  {l.url ? (
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      <span className="truncate">{l.label || l.url}</span>
                    </a>
                  ) : (
                    <span className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="size-3" />
                      <span className="truncate">{l.label || "Locked link"}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              if (locked) {
                toast.error("Premium prompt — only reviewers can copy this one");
                return;
              }
              void navigator.clipboard.writeText(prompt.prompt_text);
              toast.success("Prompt copied");
            }}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-transform active:scale-95 hover:scale-105",
              locked
                ? "border border-glass-border text-muted-foreground"
                : "bg-primary text-primary-foreground",
            )}
          >
            {locked ? <Lock className="size-3.5" /> : <Copy className="size-3.5" />}
            {locked ? "Locked" : "Copy"}
          </button>
          <button
            type="button"
            aria-pressed={like.liked}
            onClick={() => void like.toggle()}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-glass-border px-3.5 py-2 text-xs backdrop-blur transition-colors hover:border-primary/60",
              like.liked && "border-primary/60 text-primary",
            )}
          >
            <Heart
              key={like.popKey}
              className={cn("size-3.5", like.liked && "animate-heart-pop fill-current")}
            />{" "}
            {like.count}
          </button>
          <button
            type="button"
            aria-label={saved ? "Remove from saved" : "Save prompt"}
            onClick={() => toggleSavedPrompt(prompt.id)}
            className={cn(
              "ml-auto grid size-9 place-items-center rounded-lg border border-glass-border backdrop-blur transition-colors hover:border-primary/60",
              saved && "border-primary/60 text-primary",
            )}
          >
            <Bookmark className={cn("size-3.5", saved && "fill-current")} />
          </button>
        </div>
      </div>
    </article>
  );
}
