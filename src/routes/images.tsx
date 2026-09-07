import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StorageImage } from "@/components/storage-image";
import { imagesQuery, myLikesQuery, toggleLike } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/images")({
  head: () => ({
    meta: [
      { title: "Image gallery — Prompt Vault" },
      {
        name: "description",
        content:
          "A reviewed gallery of reference images shared by the community, grouped by content niche.",
      },
      { property: "og:title", content: "Image gallery — Prompt Vault" },
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

  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Image gallery</h1>
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
                  <StorageImage
                    path={img.image_path}
                    alt={img.caption}
                    className="aspect-4/3 w-full object-cover"
                  />
                  <figcaption className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{img.caption}</p>
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
      <SiteFooter />
    </div>
  );
}
