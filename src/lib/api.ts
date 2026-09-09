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
  is_premium: boolean;
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

export const promptsQuery = (status: Status = "approved", admin = false) =>
  queryOptions({
    queryKey: ["prompts", status, admin],
    queryFn: async () => {
      const { data, error } = admin
        ? await supabase
            .from("prompts")
            .select("*")
            .eq("status", status)
            .order("created_at", { ascending: false })
        : await supabase
            .from("public_prompts")
            .select("*")
            .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Prompt[];
    },
  });

export const promptQuery = (id: string, admin = false) =>
  queryOptions({
    queryKey: ["prompt", id, admin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(admin ? "prompts" : "public_prompts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Prompt | null;
    },
  });

export const promptLinksQuery = (id: string, admin = false) =>
  queryOptions({
    queryKey: ["prompt-links", id, admin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(admin ? "prompt_links" : "public_prompt_links")
        .select("*")
        .eq("prompt_id", id);
      if (error) throw error;
      return (data ?? []) as unknown as PromptLink[];
    },
  });

export const allPromptLinksQuery = (admin = false) =>
  queryOptions({
    queryKey: ["prompt-links", admin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(admin ? "prompt_links" : "public_prompt_links")
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as PromptLink[];
    },
  });

export const linksQuery = (status: Status = "approved", admin = false) =>
  queryOptions({
    queryKey: ["links", status, admin],
    queryFn: async () => {
      const { data, error } = admin
        ? await supabase
            .from("links")
            .select("*")
            .eq("status", status)
            .order("created_at", { ascending: false })
        : await supabase
            .from("public_links")
            .select("*")
            .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LinkItem[];
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
