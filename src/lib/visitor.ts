const VISITOR_KEY = "mpl_visitor_id";
const SAVED_KEY = "mpl_saved_prompts";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, "");
    window.localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function getSavedPrompts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleSavedPrompt(id: string): string[] {
  const current = getSavedPrompts();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("mpl-saved-changed"));
  return next;
}
