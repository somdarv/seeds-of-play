import { SiteHeader } from "@/components/site/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-[var(--kx-r-card)] border border-[var(--kx-border)] bg-[var(--kx-card)] p-10 text-center">
          <p className="[font-family:var(--kx-font-display)] text-[12px] font-extrabold uppercase tracking-[0.16em] text-[var(--kx-fg-muted)]">
            Page canvas
          </p>
          <h1 className="mt-3 [font-family:var(--kx-font-display)] text-[28px] font-extrabold tracking-tight text-[var(--kx-fg)] sm:text-[36px]">
            Header is in place.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[14px] text-[var(--kx-fg-muted)]">
            Three-level chrome: region · audience links · brand · primary nav · auth · live ticker.
            Real screens land below this line.
          </p>
        </div>
      </main>
    </>
  );
}
