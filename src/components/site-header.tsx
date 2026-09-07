import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useSession } from "@/hooks/use-session";

const nav = [
  { to: "/", label: "Prompts" },
  { to: "/links", label: "Links" },
  { to: "/images", label: "Images" },
  { to: "/submit", label: "Submit" },
] as const;

export function SiteHeader() {
  const { user, isAdmin } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Prompt Vault</span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {isAdmin ? (
          <Link
            to="/admin"
            className="rounded-md border border-primary/40 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10"
          >
            Admin
          </Link>
        ) : user ? null : (
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            Admin sign in
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
      Prompt Vault — a community library of master prompts. Every submission is reviewed before it
      appears.
    </footer>
  );
}
