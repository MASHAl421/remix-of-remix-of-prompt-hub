import { Link } from "@tanstack/react-router";
import { Bookmark, Copy, Eye, ExternalLink, Heart } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Prompt, PromptLink } from "@/lib/api";
import { toggleLike } from "@/lib/api";
import { StorageImage } from "@/components/storage-image";
import { toggleSavedPrompt } from "@/lib/visitor";
import { cn } from "@/lib/utils";

export function PromptCard({
  prompt,
  liked,
  saved,
  links = [],
}: {
  prompt: Prompt;
  liked: boolean;
  saved: boolean;
  links?: PromptLink[];
}) {
  const qc = useQueryClient();
  const like = useMutation({
    mutationFn: () => toggleLike("prompt", prompt.id, liked),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-likes"] });
      void qc.invalidateQueries({ queryKey: ["prompts"] });
    },
    onError: () => toast.error("Could not update your like"),
  });

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-primary/50">
      <Link to="/prompts/$promptId" params={{ promptId: prompt.id }} className="block">
        <StorageImage
          path={prompt.image_path}
          alt={prompt.title}
          className="aspect-[4/3] w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
            {prompt.category}
          </span>
          <span className="ml-auto flex items-center gap-1 text-muted-foreground">
            <Eye className="size-3.5" /> {prompt.views_count}
          </span>
        </div>
        <Link to="/prompts/$promptId" params={{ promptId: prompt.id }}>
          <h3 className="font-display text-base font-semibold leading-snug">{prompt.title}</h3>
        </Link>
        <p className="line-clamp-3 text-sm text-muted-foreground">{prompt.prompt_text}</p>
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
          <div className="flex flex-col gap-1.5 border-t border-border/40 pt-2">
            <p className="text-xs font-medium text-muted-foreground">Competitor links</p>
            <ul className="space-y-1">
              {links.slice(0, 3).map((l) => (
                <li key={l.id}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    {l.label || l.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(prompt.prompt_text);
              toast.success("Prompt copied");
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Copy className="size-3.5" /> Copy
          </button>
          <button
            type="button"
            onClick={() => like.mutate()}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/60",
              liked && "border-primary/60 text-primary",
            )}
          >
            <Heart className={cn("size-3.5", liked && "fill-current")} /> {prompt.likes_count}
          </button>
          <button
            type="button"
            aria-label={saved ? "Remove from saved" : "Save prompt"}
            onClick={() => toggleSavedPrompt(prompt.id)}
            className={cn(
              "ml-auto rounded-md border border-border p-1.5 transition-colors hover:border-primary/60",
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
