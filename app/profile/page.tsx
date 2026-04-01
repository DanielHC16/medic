import { AppShell } from "@/components/app-shell";
import { listLinkedPatientsForMember, listPatientConnections } from "@/lib/db/medic-data";
import { requireCurrentUser } from "@/lib/auth/dal";

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const relatedRecords =
    user.role === "patient"
      ? await listPatientConnections(user.userId)
      : await listLinkedPatientsForMember(user.userId);

  return (
    <AppShell
      user={user}
      title="Profile"
      description="Review your role, contact details, and patient links."
      links={[
        { href: "/", label: "Overview" },
        { href: user.role === "patient" ? "/patient/dashboard" : `/${user.role === "caregiver" ? "caregiver" : "family"}/dashboard`, label: "Dashboard" },
      ]}
    >
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Account
          </h2>
          <dl className="mt-5 grid gap-3 text-sm text-[var(--color-muted-foreground)]">
            <div>
              <dt className="font-medium text-[var(--foreground)]">Name</dt>
              <dd>{user.firstName} {user.lastName}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--foreground)]">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--foreground)]">Phone</dt>
              <dd>{user.phone || "Not provided"}</dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--foreground)]">Role</dt>
              <dd>{user.role}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Access Relationships
          </h2>
          <div className="mt-4 grid gap-4">
            {relatedRecords.length === 0 ? (
              <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                No linked records yet.
              </p>
            ) : (
              relatedRecords.map((item) => (
                <article
                  key={"id" in item ? item.id : item.relationshipId}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  {"relatedDisplayName" in item ? (
                    <>
                      <p className="text-lg font-semibold text-[var(--foreground)]">
                        {item.relatedDisplayName}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                        {item.memberRole} · {item.relationshipStatus}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-[var(--foreground)]">
                        {item.patientDisplayName}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                        {item.relationshipStatus}
                      </p>
                    </>
                  )}
                </article>
              ))
            )}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
