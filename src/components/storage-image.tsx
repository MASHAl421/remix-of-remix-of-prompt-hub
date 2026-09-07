import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IMAGE_BUCKET } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function useSignedImageUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-image", path],
    enabled: Boolean(path),
    staleTime: 45 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .createSignedUrl(path as string, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function StorageImage({
  path,
  alt,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const { data: url } = useSignedImageUrl(path);

  if (!url) {
    return <div className={cn("animate-pulse bg-muted", className)} aria-hidden="true" />;
  }

  return <img src={url} alt={alt} loading="lazy" className={className} />;
}
