import { Link } from "@tanstack/react-router";
import { Home, ImageIcon, LinkIcon, PlusCircle, Shield, Sparkles } from "lucide-react";
import { useSession } from "@/hooks/use-session";

const nav = [
  { to: "/", label: "Prompts", icon: Home },
  { to: "/links", label: "Links", icon: LinkIcon },
  { to: "/images", label: "Images", icon: ImageIcon },
  { to: "/submit", label: "Submit", icon: PlusCircle },
] as const;

export function SiteHeader() {
  const { user, isAdmin } = useSession();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-glass-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-[0_0_24px_-6px_oklch(0.82_0.17_88/0.6)]">
              <Sparkles className="size-4" />
            </span>
            <span className="truncate font-display text-base font-semibold tracking-tight sm:text-lg">
              Prompt Aura
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 text-sm md:flex">
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

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/submit"
              className="rounded-lg bg-gradient-to-r from-primary to-chart-2 px-3 py-1.5 text-xs font-medium text-primary-foreground md:hidden"
            >
              Submit
            </Link>
            {isAdmin ? (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/10 sm:text-sm"
              >
                <Shield className="size-3.5" /> Admin
              </Link>
            ) : user ? null : (
              <Link
                to="/auth"
                className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
              >
                Admin sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar — thumb-friendly navigation */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-glass-border bg-background/85 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary" }}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground transition-colors"
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-glass-border bg-background/40 px-4 pb-28 pt-8 text-center text-sm text-muted-foreground backdrop-blur-xl md:mt-20 md:pb-8">
      Prompt Aura — a community library of master prompts. Every submission is reviewed before it
      appears.
    </footer>
  );
}
