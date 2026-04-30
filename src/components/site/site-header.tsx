"use client";

/* ---------------------------------------------------------------------
   Kalaanba — Site Header (3-level)

   Bar 1  Utility — region pill · audience links · theme toggle
   Bar 2  Main nav — brand · primary nav · auth
   Bar 3  Live ticker — auto-scrolling fixture rail (`KxTicker`)
   --------------------------------------------------------------------- */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CaretDown,
  List,
  MagnifyingGlass,
  MapPin,
  X,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { KxTicker } from "@/components/showcase/motion";
import { KxThemeToggle } from "@/components/showcase/theme-toggle";

/* ---------- Static config ---------- */

const PRIMARY_NAV: { href: string; label: string }[] = [
  { href: "/matches", label: "Matches" },
  { href: "/table", label: "Table" },
  { href: "/players", label: "Players" },
  { href: "/clubs", label: "Clubs" },
  { href: "/zones", label: "Zones" },
  { href: "/news", label: "News" },
];

const AUDIENCE_LINKS: { href: string; label: string }[] = [
  { href: "/for-facilities", label: "For Facilities" },
  { href: "/for-organisers", label: "For Organisers" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
];

type TickerMatch = {
  id: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  status: "FT" | "HT" | string;
};

const TICKER_DEMO: TickerMatch[] = [
  { id: "m1", home: "Lamashegu", away: "Vittin",   homeScore: 2, awayScore: 1, status: "67'" },
  { id: "m2", home: "Choggu",    away: "Sakasaka", homeScore: 0, awayScore: 0, status: "HT"  },
  { id: "m3", home: "Aboabo",    away: "Gumani",   homeScore: 3, awayScore: 1, status: "FT"  },
  { id: "m4", home: "Bantama",   away: "Sagnarigu",homeScore: 1, awayScore: 1, status: "82'" },
  { id: "m5", home: "Tishigu",   away: "Kakpagyili",homeScore: 4, awayScore: 2, status: "FT" },
  { id: "m6", home: "Nyohini",   away: "Kalpohini",homeScore: 0, awayScore: 1, status: "23'" },
];

export function SiteHeader({
  ticker = TICKER_DEMO,
  region = "Tamale",
}: {
  ticker?: TickerMatch[];
  region?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Bar 1 — Utility */}
      <div className="border-b border-[var(--kx-border)] bg-[var(--kx-card-2)]">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-[var(--kx-border)]",
              "bg-[var(--kx-card)] px-2.5 py-1 text-[12px] font-medium text-[var(--kx-fg)]",
              "transition-colors hover:border-[var(--kx-border-strong)]",
            )}
          >
            <MapPin size={12} weight="fill" className="text-[var(--kx-pink)]" />
            <span>{region}</span>
            <CaretDown size={10} weight="bold" className="text-[var(--kx-fg-muted)]" />
          </button>

          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-5 md:flex">
              {AUDIENCE_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[12px] font-medium text-[var(--kx-fg-muted)] transition-colors hover:text-[var(--kx-fg)]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="-my-1">
              <KxThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Bar 2 — Main nav */}
      <div className="border-b border-[var(--kx-border)] bg-[var(--kx-card)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span
              className={cn(
                "grid h-9 w-9 place-items-center rounded-[10px]",
                "bg-[var(--kx-pink)] text-[var(--kx-on-pink)]",
                "[font-family:var(--kx-font-display)] text-[14px] font-extrabold tracking-tight",
                "shadow-[var(--kx-shadow-pink)]",
              )}
              aria-hidden
            >
              KB
            </span>
            <span className="hidden [font-family:var(--kx-font-display)] text-[18px] font-extrabold tracking-tight text-[var(--kx-fg)] sm:inline">
              KALA<span className="text-[var(--kx-pink)]">ANBA</span>
            </span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {PRIMARY_NAV.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative px-3 py-2 text-[14px] font-semibold transition-colors",
                    active
                      ? "text-[var(--kx-fg)]"
                      : "text-[var(--kx-fg-muted)] hover:text-[var(--kx-fg)]",
                  )}
                >
                  {l.label}
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute -bottom-[2px] left-3 right-3 h-[2px] rounded-full bg-[var(--kx-pink)]"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
            <button
              type="button"
              aria-label="Search"
              className="hidden h-10 w-10 place-items-center rounded-full text-[var(--kx-fg-muted)] transition-colors hover:bg-[var(--kx-card-2)] hover:text-[var(--kx-fg)] sm:grid"
            >
              <MagnifyingGlass size={18} weight="bold" />
            </button>

            <Link
              href="/sign-in"
              className={cn(
                "hidden h-10 items-center rounded-full border border-[var(--kx-border-strong)] px-4",
                "text-[13px] font-semibold text-[var(--kx-fg)] transition-colors",
                "hover:border-[var(--kx-fg)] sm:inline-flex",
              )}
            >
              Sign in
            </Link>

            <Link
              href="/get-started"
              className={cn(
                "inline-flex h-10 items-center rounded-full px-4",
                "bg-[var(--kx-pink)] text-[var(--kx-on-pink)]",
                "text-[13px] font-semibold tracking-tight",
                "shadow-[var(--kx-shadow-pink)]",
                "transition-transform hover:-translate-y-px active:translate-y-0",
              )}
            >
              Get started
            </Link>

            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full text-[var(--kx-fg)] transition-colors hover:bg-[var(--kx-card-2)] lg:hidden"
            >
              {mobileOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <nav className="border-t border-[var(--kx-border)] bg-[var(--kx-card)] px-4 pb-4 pt-2 lg:hidden">
            <ul className="flex flex-col">
              {PRIMARY_NAV.map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-[var(--kx-r-tile)] px-3 py-3 text-[15px] font-semibold transition-colors",
                        active
                          ? "bg-[var(--kx-card-2)] text-[var(--kx-fg)]"
                          : "text-[var(--kx-fg-muted)] hover:bg-[var(--kx-card-2)] hover:text-[var(--kx-fg)]",
                      )}
                    >
                      {l.label}
                      {active ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--kx-pink)]" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--kx-border)] pt-3">
              {AUDIENCE_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-[var(--kx-r-tile)] px-3 py-2 text-[12px] font-medium text-[var(--kx-fg-muted)] hover:text-[var(--kx-fg)]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </div>

      {/* Bar 3 — Auto-scrolling ticker (pauses on hover) */}
      <div className="border-b border-[var(--kx-border)] bg-[var(--kx-bg)]">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
          <KxTicker speed={60} className="!rounded-full">
            {ticker.map((m) => (
              <TickerItem key={m.id} match={m} />
            ))}
          </KxTicker>
        </div>
      </div>
    </header>
  );
}

function TickerItem({ match: m }: { match: TickerMatch }): ReactNode {
  const isLive = m.status !== "FT" && m.status !== "HT";
  return (
    <div className="flex shrink-0 items-center gap-2 text-[12px] font-medium text-[var(--kx-fg)]">
      <span className="text-[var(--kx-fg-muted)]">{m.home}</span>
      <span
        className={cn(
          "inline-flex h-6 min-w-12 items-center justify-center rounded-md px-1.5",
          "bg-[var(--kx-card-2)] text-[12px] font-extrabold tabular-nums tracking-tight text-[var(--kx-fg)]",
        )}
      >
        {m.homeScore} – {m.awayScore}
      </span>
      <span className="text-[var(--kx-fg-muted)]">{m.away}</span>
      <span
        className={cn(
          "ml-1 text-[11px] font-bold uppercase tracking-wide",
          isLive ? "text-[var(--kx-pink)]" : "text-[var(--kx-fg-muted)]",
        )}
      >
        {m.status}
      </span>
    </div>
  );
}
