import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import {
  ALLOWED_IMAGE_TYPES,
  CATEGORIES,
  IMAGE_BUCKET,
  LINK_TYPES,
  MAX_IMAGE_BYTES,
} from "@/lib/constants";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit a master prompt — Prompt Vault" },
      {
        name: "description",
        content:
          "Share a master prompt with its reference image, niche category, tags and optional competitor links. Every submission is reviewed before publishing.",
      },
      { property: "og:title", content: "Submit a master prompt — Prompt Vault" },
      {
        property: "og:description",
        content: "Share a master prompt with an image, category, tags and competitor links.",
      },
    ],
  }),
  component: SubmitPage,
});

const promptSchema = z.object({
  title: z.string().trim().min(3).max(160),
  prompt_text: z.string().trim().min(10).max(12000),
  category: z.string().trim().min(2),
});

const linkSchema = z.object({
  title: z.string().trim().min(2).max(160),
  url: z.string().trim().url().max(2000),
  link_type: z.string().trim().min(2),
  note: z.string().trim().max(1000).optional(),
});

const imageSchema = z.object({
  caption: z.string().trim().min(2).max(200),
  category: z.string().trim().min(2),
});

async function uploadImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error("Please use a JPG, PNG, WEBP or GIF image.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be smaller than 8 MB.");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

const inputClass =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary";

function SubmitPage() {
  const [tab, setTab] = useState<"prompt" | "link" | "image">("prompt");

  return (
    <div className="min-h-screen font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Add to the vault</h1>
        <p className="mt-2 text-muted-foreground">
          No account needed. Everything you send lands in a review queue first.
        </p>
        <div className="mt-6 flex gap-2">
          {(
            [
              ["prompt", "Master prompt"],
              ["link", "Important link"],
              ["image", "Image"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={
                tab === key
                  ? "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  : "rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-8">
          {tab === "prompt" && <PromptForm />}
          {tab === "link" && <LinkForm />}
          {tab === "image" && <ImageForm />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PromptForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [competitors, setCompetitors] = useState<{ label: string; url: string }[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = promptSchema.safeParse({
      title: fd.get("title"),
      prompt_text: fd.get("prompt_text"),
      category: fd.get("category"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    if (!file) {
      toast.error("An image is required");
      return;
    }
    const tags = String(fd.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);

    setBusy(true);
    try {
      const imagePath = await uploadImage(file);
      // Pending rows aren't readable by visitors, so generate the id instead of
      // asking the insert to return it.
      const promptId = crypto.randomUUID();
      const { error } = await supabase
        .from("prompts")
        .insert({ id: promptId, ...parsed.data, tags, image_path: imagePath });
      if (error) throw error;

      const validLinks = competitors
        .filter((c) => c.url.trim().length > 4)
        .map((c) => ({ prompt_id: promptId, label: c.label.trim() || null, url: c.url.trim() }));
      if (validLinks.length > 0) {
        const { error: linkError } = await supabase.from("prompt_links").insert(validLinks);
        if (linkError) throw linkError;
      }
      setDone(true);
      form.reset();
      setFile(null);
      setCompetitors([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Thanks
        onAgain={() => setDone(false)}
        text="Thanks! Your prompt is waiting for review and will appear once an admin approves it."
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Title">
        <input name="title" required maxLength={160} className={inputClass} />
      </Field>
      <Field label="Master prompt">
        <textarea name="prompt_text" required rows={8} maxLength={12000} className={inputClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category">
          <select name="category" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Choose a niche
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tags (optional, comma separated)">
          <input name="tags" placeholder="viral, shorts, storytelling" className={inputClass} />
        </Field>
      </div>
      <Field label="Image (required)">
        <ImagePicker file={file} onChange={setFile} />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Competitor pages / channels (optional)</span>
          <button
            type="button"
            onClick={() => setCompetitors((c) => [...c, { label: "", url: "" }])}
            className="inline-flex items-center gap-1 text-sm text-primary"
          >
            <Plus className="size-4" /> Add link
          </button>
        </div>
        {competitors.map((c, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={c.label}
              onChange={(e) =>
                setCompetitors((list) =>
                  list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                )
              }
              placeholder="Name"
              className={inputClass + " max-w-40"}
            />
            <input
              value={c.url}
              onChange={(e) =>
                setCompetitors((list) =>
                  list.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                )
              }
              placeholder="https://…"
              className={inputClass}
            />
            <button
              type="button"
              aria-label="Remove link"
              onClick={() => setCompetitors((list) => list.filter((_, j) => j !== i))}
              className="rounded-md border border-border px-3 text-muted-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <SubmitButton busy={busy} label="Submit for review" />
    </form>
  );
}

function LinkForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = linkSchema.safeParse({
      title: fd.get("title"),
      url: fd.get("url"),
      link_type: fd.get("link_type"),
      note: String(fd.get("note") ?? "") || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("links").insert({
        title: parsed.data.title,
        url: parsed.data.url,
        link_type: parsed.data.link_type,
        note: parsed.data.note ?? null,
      });
      if (error) throw error;
      setDone(true);
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <Thanks onAgain={() => setDone(false)} text="Thanks! Your link is waiting for review." />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Title">
        <input name="title" required maxLength={160} className={inputClass} />
      </Field>
      <Field label="URL">
        <input name="url" type="url" required placeholder="https://…" className={inputClass} />
      </Field>
      <Field label="What kind of link is it?">
        <select name="link_type" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Choose a type
          </option>
          {LINK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Note (optional)">
        <textarea name="note" rows={3} maxLength={1000} className={inputClass} />
      </Field>
      <SubmitButton busy={busy} label="Submit for review" />
    </form>
  );
}

function ImageForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = imageSchema.safeParse({
      caption: fd.get("caption"),
      category: fd.get("category"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    if (!file) {
      toast.error("An image is required");
      return;
    }
    setBusy(true);
    try {
      const imagePath = await uploadImage(file);
      const { error } = await supabase.from("images").insert({ ...parsed.data, image_path: imagePath });
      if (error) throw error;
      setDone(true);
      form.reset();
      setFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <Thanks onAgain={() => setDone(false)} text="Thanks! Your image is waiting for review." />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Caption">
        <input name="caption" required maxLength={200} className={inputClass} />
      </Field>
      <Field label="Category">
        <select name="category" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Choose a niche
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Image (required)">
        <ImagePicker file={file} onChange={setFile} />
      </Field>
      <SubmitButton busy={busy} label="Submit for review" />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function ImagePicker({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-border p-4">
      <Upload className="size-5 text-muted-foreground" />
      <input
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      {file && <span className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</span>}
    </div>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {busy ? "Sending…" : label}
    </button>
  );
}

function Thanks({ text, onAgain }: { text: string; onAgain: () => void }) {
  return (
    <div className="rounded-xl border border-primary/40 bg-card p-6">
      <p className="text-sm">{text}</p>
      <button type="button" onClick={onAgain} className="mt-4 text-sm text-primary hover:underline">
        Add another
      </button>
    </div>
  );
}
