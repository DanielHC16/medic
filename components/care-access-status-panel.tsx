import Link from "next/link";

import type { LinkedPatientSummary, RoleSlug } from "@/lib/medic-types";

export function CareAccessStatusPanel(props: {
  linkedPatients: LinkedPatientSummary[];
  role: Exclude<RoleSlug, "patient">;
}) {
  const activePatients = props.linkedPatients.filter(
    (item) => item.relationshipStatus === "active",
  );
  const pendingPatients = props.linkedPatients.filter(
    (item) => item.relationshipStatus === "pending",
  );
  const revokedPatients = props.linkedPatients.filter(
    (item) => item.relationshipStatus === "revoked",
  );

  return (
    <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Care-circle access
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
          Only active connections can open patient data. Pending requests stay here until
          the patient approves them.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active" value={String(activePatients.length)} />
        <MetricCard label="Pending" value={String(pendingPatients.length)} />
        <MetricCard label="Revoked" value={String(revokedPatients.length)} />
      </div>

      {props.linkedPatients.length === 0 ? (
        <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
          No patient connections exist yet for this account.
        </p>
      ) : (
        <div className="grid gap-4">
          {props.linkedPatients.map((item) => (
            <article
              key={item.relationshipId}
              className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
            >
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {item.patientDisplayName}
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                Status: {item.relationshipStatus}
              </p>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/join" className="medic-button medic-button-primary">
          Join another patient
        </Link>
        <Link
          href={`/${props.role === "caregiver" ? "caregiver" : "family"}/profile`}
          className="medic-button"
        >
          Open profile
        </Link>
      </div>
    </section>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
        {props.label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {props.value}
      </p>
    </article>
  );
}
