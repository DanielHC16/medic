import Link from "next/link";

import type { FeatureModule } from "@/lib/medic-blueprint";

type FeatureShellProps = {
  feature: FeatureModule;
};

export function FeatureShell({ feature }: FeatureShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-primary)]">
          Blank Module
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          {feature.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-muted-foreground)]">
          {feature.summary}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/test"
            className="medic-button medic-button-primary"
          >
            Open Test Page
          </Link>
          <Link
            href="/"
            className="medic-button"
          >
            Back To Overview
          </Link>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Connected Placeholder APIs
          </h2>
          <div className="mt-4 space-y-4">
            {feature.apiRoutes.map((route) => (
              <div
                key={route.path}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-wide text-[var(--color-primary)]">
                    {route.method}
                  </span>
                  <code className="text-sm text-[var(--foreground)]">
                    {route.path}
                  </code>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
                  {route.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Intended Roles
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {feature.roles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm text-[var(--foreground)]"
              >
                {role}
              </span>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-sm leading-6 text-[var(--color-muted-foreground)]">
            This page is intentionally blank for the first phase. The real UI
            should be built only after the underlying API contract and database
            shape are stable.
          </div>
        </aside>
      </section>
    </main>
  );
}
