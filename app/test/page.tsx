import Link from "next/link";

import { MedicBrand } from "@/components/medic-brand";
import { TestLab } from "@/components/test-lab";
import { TestingWorkbench } from "@/components/testing-workbench";
import { getTestingWorkbenchSnapshot } from "@/lib/db/medic-data";
import {
  foundationApiScaffolds,
  placeholderApiScaffolds,
} from "@/lib/medic-blueprint";
import { isTestingWorkbenchEnabled } from "@/lib/testing";

export default async function TestPage() {
  const workbenchEnabled = isTestingWorkbenchEnabled();
  const snapshot = workbenchEnabled
    ? await getTestingWorkbenchSnapshot()
    : {
        patients: [],
        recentActivities: [],
        recentAppointments: [],
        recentInvitations: [],
        recentMedications: [],
        users: [],
      };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="overflow-hidden rounded-[2.5rem] border border-white/20 bg-[var(--color-surface)] p-8 shadow-[0_28px_80px_rgba(6,18,11,0.28)] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <MedicBrand
              caption="Readable, reliable checks for Neon, routes, and seeded MEDIC flows."
            />
            <p className="mt-8 font-label text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-primary)]">
              Testing Hub
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
              API and database connection checks
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--color-muted-foreground)]">
              Use this page to verify that MEDIC is online, Neon can be reached,
              the seed data is present, and the scaffolded feature routes respond
              before moving into the next build steps.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_12px_24px_rgba(47,62,52,0.08)]">
              <p className="font-label text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                Suggested Order
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                Health check, database status, bootstrap, sample data, then module
                routes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="medic-button medic-button-primary"
              >
                Back to overview
              </Link>
              <Link
                href="/sign-in"
                className="medic-button"
              >
                Open sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TestLab
        foundationChecks={foundationApiScaffolds}
        placeholderChecks={placeholderApiScaffolds}
      />

      <TestingWorkbench enabled={workbenchEnabled} snapshot={snapshot} />
    </main>
  );
}
