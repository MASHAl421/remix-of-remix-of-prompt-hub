import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Heart, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StorageImage } from "@/components/storage-image";
import { imagesQuery, myLikesQuery, toggleLike } from "@/lib/api";
import { useSession } from "@/hooks/use-session";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/images")({
  head: () => ({
    meta: [
      { title: "Image gallery — Prompt Aura" },
      {
        name: "description",
        content:
          "A reviewed gallery of reference images shared by the community, grouped by content niche.",
      },
      { property: "og:title", content: "Image gallery — Prompt Aura" },
      {
        property: "og:description",
        content: "Reference images shared by the community, grouped by niche.",
      },
    ],
  }),
  component: ImagesPage,
});

function ImagesPage() {
  const qc = useQueryClient();
  const { isAdmin } = useSession();
  const { data: images = [], isLoading } = useQuery(imagesQuery());
  const { data: likes = [] } = useQuery(myLikesQuery());
  const [category, setCategory] = useState("All");

  const likedIds = useMemo(
    () => new Set(likes.filter((l) => l.item_type === "image").map((l) => l.item_id)),
    [likes],
  );

  const like = useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) => toggleLike("image", id, liked),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-likes"] });
      void qc.invalidateQueries({ queryKey: ["images"] });
    },
    onError: () => toast.error("Could not update your like"),
  });

  const visible = images.filter((i) => category === "All" || i.category === category);
  const [preview, setPreview] = useState<{ path: string; caption: string } | null>(null);

  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Image gallery</h1>
            <p className="mt-2 text-muted-foreground">
              Reference shots and thumbnails shared by the community.
            </p>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-glass-border bg-background/40 backdrop-blur px-3 py-2 text-sm"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-muted-foreground">Loading images…</p>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No images here yet.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((img) => {
              const liked = likedIds.has(img.id);
              return (
                <figure
                  key={img.id}
                  className="overflow-hidden glass rounded-2xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (img.is_premium && !isAdmin) {
                        toast.error("Premium image — only reviewers can open the full size");
                        return;
                      }
                      setPreview({ path: img.image_path, caption: img.caption });
                    }}
                    className="relative block w-full cursor-zoom-in"
                    aria-label={`Open ${img.caption}`}
                  >
                    {img.is_premium && (
                      <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-primary/60 bg-background/70 px-2 py-0.5 text-xs text-primary backdrop-blur">
                        <Crown className="size-3" /> Premium
                      </span>
                    )}
                    <StorageImage
                      path={img.image_path}
                      alt={img.caption}
                      className="aspect-4/3 w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </button>
                  <figcaption className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {img.is_premium && !isAdmin && <Lock className="size-3.5 shrink-0" />}
                        {img.caption}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{img.category}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => like.mutate({ id: img.id, liked })}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm",
                        liked && "border-primary/60 text-primary",
                      )}
                    >
                      <Heart className={cn("size-4", liked && "fill-current")} /> {img.likes_count}
                    </button>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        )}
      </main>
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={preview.caption}
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setPreview(null)}
            className="absolute right-4 top-4 rounded-full border border-white/30 p-2 text-white"
          >
            <X className="size-5" />
          </button>
          <figure onClick={(e) => e.stopPropagation()} className="max-h-full max-w-5xl">
            <StorageImage
              path={preview.path}
              alt={preview.caption}
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/80">{preview.caption}</figcaption>
          </figure>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}
