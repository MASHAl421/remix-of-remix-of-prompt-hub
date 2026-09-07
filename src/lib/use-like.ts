import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleLike } from "@/lib/api";

/**
 * Like toggle with instant feedback: first click adds a like and bumps the
 * counter, clicking again removes it and lowers the counter. The optimistic
 * value is held only until the server counts have been refetched.
 */
export function useLikeToggle({
  itemType,
  itemId,
  serverLiked,
  serverCount,
  invalidateKeys,
}: {
  itemType: "prompt" | "link" | "image";
  itemId: string;
  serverLiked: boolean;
  serverCount: number;
  invalidateKeys: unknown[][];
}) {
  const qc = useQueryClient();
  const [pending, setPending] = useState<boolean | null>(null);
  const [pop, setPop] = useState(0);

  const liked = pending ?? serverLiked;
  const count = Math.max(0, serverCount + (pending === null || pending === serverLiked ? 0 : pending ? 1 : -1));

  async function toggle() {
    const next = !liked;
    setPending(next);
    setPop((n) => n + 1);
    try {
      await toggleLike(itemType, itemId, !next);
      await Promise.all(invalidateKeys.map((key) => qc.invalidateQueries({ queryKey: key })));
    } catch {
      toast.error("Could not update your like");
    } finally {
      setPending(null);
    }
  }

  return { liked, count, toggle, popKey: pop };
}
