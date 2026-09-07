import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/visitor";

export type Status = "pending" | "approved" | "rejected";

export type Prompt = {
  id: string;
  title: string;
  prompt_text: string;
  category: string;
  tags: string[];
  image_path: string;
  status: Status;
  rejection_note: string | null;
  likes_count: number;
  views_count: number;
  created_at: string;
};

export type PromptLink = {
  id: string;
  prompt_id: string;
  label: string | null;
  url: string;
};

export type LinkItem = {
  id: string;
  title: string;
  url: string;
  link_type: string;
  note: string | null;
  status: Status;
  rejection_note: string | null;
  likes_count: number;
  created_at: string;
};

export type ImageItem = {
  id: string;
  caption: string;
  category: string;
  image_path: string;
  status: Status;
  rejection_note: string | null;
  likes_count: number;
  created_at: string;
};

export const promptsQuery = (status: Status = "approved") =>
  queryOptions({
    queryKey: ["prompts", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Prompt[];
    },
  });

export const promptQuery = (id: string) =>
  queryOptions({
    queryKey: ["prompt", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("prompts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Prompt | null;
    },
  });

export const promptLinksQuery = (id: string) =>
  queryOptions({
    queryKey: ["prompt-links", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_links")
        .select("*")
        .eq("prompt_id", id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as PromptLink[];
    },
  });

export const allPromptLinksQuery = () =>
  queryOptions({
    queryKey: ["prompt-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_links")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as PromptLink[];
    },
  });

export const linksQuery = (status: Status = "approved") =>
  queryOptions({
    queryKey: ["links", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LinkItem[];
    },
  });

export const imagesQuery = (status: Status = "approved") =>
  queryOptions({
    queryKey: ["images", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ImageItem[];
    },
  });

export const myLikesQuery = () =>
  queryOptions({
    queryKey: ["my-likes"],
    queryFn: async () => {
      const visitorId = getVisitorId();
      if (!visitorId) return [] as { item_type: string; item_id: string }[];
      const { data, error } = await supabase
        .from("likes")
        .select("item_type,item_id")
        .eq("visitor_id", visitorId);
      if (error) throw error;
      return (data ?? []) as { item_type: string; item_id: string }[];
    },
  });

export async function toggleLike(itemType: "prompt" | "link" | "image", itemId: string, liked: boolean) {
  const visitorId = getVisitorId();
  if (liked) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .eq("visitor_id", visitorId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ item_type: itemType, item_id: itemId, visitor_id: visitorId });
    if (error) throw error;
  }
}
