import Link from "next/link";
import type { ReactNode } from "react";

import type { AuthenticatedUser } from "@/lib/medic-types";
import { LogoutButton } from "@/components/logout-button";

type AppShellProps = {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  links?: Array<{
    href: string;
    label: string;
  }>;
  title: string;
  user: AuthenticatedUser;
};

export function AppShell({
  actions,
  children,
  description,
  links = [],
  title,
  user,
}: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">
              MEDIC
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--color-muted-foreground)]">
                {description}
              </p>
            ) : null}
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
              Signed in as <span className="font-medium">{user.firstName}</span>{" "}
              ({user.role})
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="medic-button medic-button-soft text-sm"
              >
                {link.label}
              </Link>
            ))}
            {actions}
            <LogoutButton />
          </div>
        </div>
      </section>
      {children}
    </main>
  );
}
