import { MedicBrand } from "@/components/medic-brand";
import Link from "next/link";

import {
  featureModules,
  foundationApiScaffolds,
  implementationPhases,
} from "@/lib/medic-blueprint";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="overflow-hidden rounded-[2.5rem] border border-white/20 bg-[var(--color-surface)] p-8 shadow-[0_28px_80px_rgba(6,18,11,0.28)] sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <MedicBrand caption="Medication reminders, routines, and connected care." />
            <div className="mt-8 max-w-4xl">
              <p className="font-label text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-primary)]">
                Initial Testing Workspace
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
                Clear, connected care flows for patients, caregivers, and family members.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-muted-foreground)]">
                MEDIC now supports account setup, care-circle invites, medication and
                schedule testing, wellness routines, appointments, and the first
                offline sync checks for medication logs.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-in"
                className="medic-button medic-button-primary"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="medic-button"
              >
                Create account
              </Link>
              <Link
                href="/test"
                className="medic-button medic-button-soft"
              >
                Open testing hub
              </Link>
              <Link
                href="/join"
                className="medic-button medic-button-soft"
              >
                Join a patient
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              {
                label: "Primary roles",
                value: "Patient, caregiver, and family member",
              },
              {
                label: "Care-circle linking",
                value: "Invite code and invite link flows are ready to test",
              },
              {
                label: "Offline scope today",
                value: "Medication log queue, push sync, and pull refresh",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.75rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_12px_24px_rgba(47,62,52,0.08)]"
              >
                <p className="font-label text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-primary)]">
                  {item.label}
                </p>
                <p className="mt-3 text-base leading-7 text-[var(--foreground)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/15 bg-[var(--color-surface)] p-6 shadow-[0_20px_48px_rgba(6,18,11,0.18)]">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Ready For Testing
          </h2>
          <div className="mt-5 grid gap-4">
            {foundationApiScaffolds.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[1.75rem] border border-[var(--color-border)] bg-white p-4 shadow-[0_12px_24px_rgba(47,62,52,0.06)]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-label rounded-full bg-[rgba(163,177,138,0.24)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--color-primary-strong)]">
                    {entry.method}
                  </span>
                  <code className="text-sm font-semibold text-[var(--foreground)]">
                    {entry.path}
                  </code>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
                  {entry.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/15 bg-[var(--color-surface)] p-6 shadow-[0_20px_48px_rgba(6,18,11,0.18)]">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Demo Accounts
          </h2>
          <div className="mt-5 grid gap-4">
            {[
              "walter.white@medic.local",
              "hector.salamanca@medic.local",
              "saul.goodman@medic.local",
            ].map((account) => (
              <div
                key={account}
                className="rounded-[1.6rem] border border-[var(--color-border)] bg-white px-5 py-4 text-sm leading-6 text-[var(--color-muted-foreground)] shadow-[0_12px_24px_rgba(47,62,52,0.06)]"
              >
                <p className="text-base font-semibold text-[var(--foreground)]">{account}</p>
                <p className="mt-1">
                  Password:{" "}
                  <code className="rounded-md bg-[var(--color-surface-muted)] px-2 py-1 text-[var(--color-primary-strong)]">
                    DemoPass123!
                  </code>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[rgba(163,177,138,0.12)] p-5 text-sm leading-6 text-[var(--color-muted-foreground)]">
            Matching caregiver and family-member accounts are also seeded after reset.
            <br />
            The working schema and build order live in{" "}
            <code className="text-[var(--color-primary-strong)]">docs/ERD.md</code> and{" "}
            <code className="text-[var(--color-primary-strong)]">
              docs/IMPLEMENTATION_PLAN.md
            </code>
            .
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-[var(--color-surface)] p-6 shadow-[0_20px_48px_rgba(6,18,11,0.18)]">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Build Order Snapshot
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {implementationPhases.map((phase, index) => (
            <div
              key={phase}
              className="rounded-[1.75rem] border border-[var(--color-border)] bg-white p-5 text-sm leading-6 text-[var(--color-muted-foreground)] shadow-[0_12px_24px_rgba(47,62,52,0.06)]"
            >
              <p className="font-label text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                Step {index + 1}
              </p>
              <p className="mt-3 text-base font-semibold text-[var(--foreground)]">
                {phase}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/15 bg-[var(--color-surface)] p-6 shadow-[0_20px_48px_rgba(6,18,11,0.18)]">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Module Map
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureModules.map((feature) => (
            <Link
              key={feature.id}
              href={feature.pagePath}
              className="rounded-[1.75rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_12px_24px_rgba(47,62,52,0.06)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-[0_18px_32px_rgba(47,62,52,0.12)]"
            >
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {feature.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
                {feature.summary}
              </p>
              <code className="mt-4 block text-xs font-semibold text-[var(--color-primary)]">
                {feature.pagePath}
              </code>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
