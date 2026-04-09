"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import type {
  RoleSlug,
  TestingWorkbenchSnapshot,
} from "@/lib/medic-types";

type FeedbackState = {
  message: string;
  tone: "error" | "success";
} | null;

type TestingWorkbenchProps = {
  enabled: boolean;
  snapshot: TestingWorkbenchSnapshot;
};

export function TestingWorkbench({
  enabled,
  snapshot,
}: TestingWorkbenchProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pendingKind, setPendingKind] = useState<string | null>(null);
  const [newUserRole, setNewUserRole] = useState<RoleSlug>("patient");

  const defaultPatientId = snapshot.patients[0]?.userId ?? "";
  const defaultCreatorId =
    snapshot.users.find((user) => user.role === "caregiver")?.userId ||
    snapshot.users.find((user) => user.role === "patient")?.userId ||
    "";

  async function submitTestingAction(
    kind: string,
    payload: Record<string, unknown>,
    successMessage?: string,
  ) {
    setPendingKind(kind);
    setFeedback(null);

    try {
      const response = await fetch("/api/testing/workbench", {
        body: JSON.stringify({
          kind,
          ...payload,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as {
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Testing action failed.");
      }

      setFeedback({
        message: result.message || successMessage || "Testing action completed.",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : "Testing action failed.",
        tone: "error",
      });
    } finally {
      setPendingKind(null);
    }
  }

  async function handleResetDatabase() {
    setPendingKind("reset");
    setFeedback(null);

    try {
      const response = await fetch("/api/db/reset", {
        method: "POST",
      });
      const result = (await response.json()) as {
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to reset testing data.");
      }

      setFeedback({
        message: result.message || "Testing data was reset successfully.",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : "Unable to reset testing data.",
        tone: "error",
      });
    } finally {
      setPendingKind(null);
    }
  }

  async function handleCreateUser(formData: FormData) {
    await submitTestingAction("user", {
      assistanceLevel: formData.get("assistanceLevel"),
      dateOfBirth: formData.get("dateOfBirth"),
      email: formData.get("email"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      password: formData.get("password"),
      phone: formData.get("phone"),
      role: formData.get("role"),
    });
  }

  async function handleCreateInvite(formData: FormData) {
    await submitTestingAction("invite", {
      approvalMode: formData.get("approvalMode"),
      createdByUserId: formData.get("createdByUserId"),
      memberRole: formData.get("memberRole"),
      patientUserId: formData.get("patientUserId"),
    });
  }

  async function handleCreateMedication(formData: FormData) {
    await submitTestingAction("medication", {
      createdByUserId: formData.get("createdByUserId"),
      daysOfWeek: formData.get("daysOfWeek"),
      dosageUnit: formData.get("dosageUnit"),
      dosageValue: formData.get("dosageValue"),
      form: formData.get("form"),
      frequencyType: formData.get("frequencyType"),
      instructions: formData.get("instructions"),
      name: formData.get("name"),
      patientUserId: formData.get("patientUserId"),
      timesOfDay: formData.get("timesOfDay"),
    });
  }

  async function handleCreateActivity(formData: FormData) {
    await submitTestingAction("activity", {
      category: formData.get("category"),
      createdByUserId: formData.get("createdByUserId"),
      daysOfWeek: formData.get("daysOfWeek"),
      frequencyType: formData.get("frequencyType"),
      instructions: formData.get("instructions"),
      patientUserId: formData.get("patientUserId"),
      targetMinutes: formData.get("targetMinutes"),
      title: formData.get("title"),
    });
  }

  async function handleCreateAppointment(formData: FormData) {
    await submitTestingAction("appointment", {
      appointmentAt: formData.get("appointmentAt"),
      createdByUserId: formData.get("createdByUserId"),
      location: formData.get("location"),
      notes: formData.get("notes"),
      patientUserId: formData.get("patientUserId"),
      providerName: formData.get("providerName"),
      title: formData.get("title"),
    });
  }

  if (!enabled) {
    return (
      <section className="rounded-[2rem] border border-[rgba(217,123,123,0.24)] bg-[var(--color-surface)] p-6 shadow-[0_20px_48px_rgba(6,18,11,0.18)]">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Direct Database Workbench
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--color-muted-foreground)]">
          The direct testing workbench is disabled in production mode by default.
          Enable it only in local testing environments.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-white/15 bg-[var(--color-surface)] p-6 shadow-[0_20px_48px_rgba(6,18,11,0.18)]">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Direct Database Workbench
        </h2>
        <p className="max-w-4xl text-base leading-7 text-[var(--color-muted-foreground)]">
          Add patient, caregiver, and family-member records directly into Neon, then
          test invitations, medications, routines, and appointments without needing
          to go through the signed-in app flow first.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleResetDatabase}
            disabled={pendingKind === "reset"}
            className="medic-button medic-button-primary"
          >
            {pendingKind === "reset" ? "Resetting test data..." : "Reset seeded test data"}
          </button>
        </div>
      </div>

      {feedback ? (
        <p
          className={`mt-5 rounded-[1.4rem] px-4 py-3 text-sm font-medium ${
            feedback.tone === "success"
              ? "bg-[rgba(163,177,138,0.24)] text-[var(--foreground)]"
              : "bg-[rgba(217,123,123,0.14)] text-[var(--foreground)]"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <WorkbenchCard
          title="Create User Record"
          description="Add a patient, caregiver, or family-member account directly to the database."
        >
          <form action={handleCreateUser} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Role</span>
                <select
                  name="role"
                  value={newUserRole}
                  onChange={(event) => setNewUserRole(event.target.value as RoleSlug)}
                  className="medic-field"
                >
                  <option value="patient">Patient</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="family_member">Family Member</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Phone</span>
                <input
                  name="phone"
                  className="medic-field"
                  placeholder="09170000010"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  First name
                </span>
                <input
                  name="firstName"
                  required
                  className="medic-field"
                  placeholder="Daniel"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Last name
                </span>
                <input
                  name="lastName"
                  required
                  className="medic-field"
                  placeholder="Camacho"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Email</span>
                <input
                  name="email"
                  required
                  type="email"
                  className="medic-field"
                  placeholder="new.user@medic.local"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Password
                </span>
                <input
                  name="password"
                  className="medic-field"
                  placeholder="MedicTest123!"
                />
              </label>
            </div>

            {newUserRole === "patient" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Date of birth
                  </span>
                  <input name="dateOfBirth" type="date" className="medic-field" />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Assistance level
                  </span>
                  <select name="assistanceLevel" className="medic-field">
                    <option value="independent">Independent</option>
                    <option value="minimal_assistance">Minimal assistance</option>
                    <option value="caregiver_assistance">
                      Needs caregiver assistance
                    </option>
                    <option value="family_support">Needs family support</option>
                  </select>
                </label>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={pendingKind === "user"}
              className="medic-button medic-button-primary"
            >
              {pendingKind === "user" ? "Adding user..." : "Add user to database"}
            </button>
          </form>
        </WorkbenchCard>

        <WorkbenchCard
          title="Create Invite"
          description="Generate a caregiver or family-member invite directly for a patient record."
        >
          <form action={handleCreateInvite} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Patient</span>
                <select
                  name="patientUserId"
                  defaultValue={defaultPatientId}
                  className="medic-field"
                >
                  {snapshot.patients.map((patient) => (
                    <option key={patient.userId} value={patient.userId}>
                      {patient.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Created by
                </span>
                <select
                  name="createdByUserId"
                  defaultValue={defaultCreatorId || defaultPatientId}
                  className="medic-field"
                >
                  {snapshot.users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.displayName} ({user.role})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Invite role
                </span>
                <select
                  name="memberRole"
                  defaultValue="caregiver"
                  className="medic-field"
                >
                  <option value="caregiver">Caregiver</option>
                  <option value="family_member">Family Member</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Approval mode
                </span>
                <select
                  name="approvalMode"
                  defaultValue="manual"
                  className="medic-field"
                >
                  <option value="manual">Patient approves</option>
                  <option value="auto">Auto approve</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={pendingKind === "invite"}
              className="medic-button medic-button-primary"
            >
              {pendingKind === "invite" ? "Generating..." : "Generate invite"}
            </button>
          </form>
        </WorkbenchCard>

        <WorkbenchCard
          title="Create Medication"
          description="Add a medication and first schedule directly into the patient record."
        >
          <form action={handleCreateMedication} className="grid gap-4">
            <PatientAndCreatorSelectors
              creatorUsers={snapshot.users}
              defaultCreatorId={defaultCreatorId}
              defaultPatientId={defaultPatientId}
              patients={snapshot.patients}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Name</span>
                <input
                  name="name"
                  required
                  className="medic-field"
                  placeholder="Acetaminophen"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Form</span>
                <input
                  name="form"
                  required
                  className="medic-field"
                  placeholder="Tablet"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Dosage value
                </span>
                <input
                  name="dosageValue"
                  required
                  className="medic-field"
                  placeholder="500"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Dosage unit
                </span>
                <input
                  name="dosageUnit"
                  className="medic-field"
                  placeholder="mg"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Frequency
                </span>
                <input
                  name="frequencyType"
                  className="medic-field"
                  defaultValue="daily"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Times of day
                </span>
                <input
                  name="timesOfDay"
                  className="medic-field"
                  defaultValue="08:00,20:00"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Days of week
              </span>
              <input
                name="daysOfWeek"
                className="medic-field"
                defaultValue="Mon,Tue,Wed,Thu,Fri,Sat,Sun"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Instructions
              </span>
              <textarea
                name="instructions"
                className="medic-field"
                placeholder="Take after breakfast."
              />
            </label>

            <button
              type="submit"
              disabled={pendingKind === "medication"}
              className="medic-button medic-button-primary"
            >
              {pendingKind === "medication" ? "Adding medication..." : "Add medication"}
            </button>
          </form>
        </WorkbenchCard>

        <div className="grid gap-6">
          <WorkbenchCard
            title="Create Routine"
            description="Insert a wellness or physical activity routine for any patient."
          >
            <form action={handleCreateActivity} className="grid gap-4">
              <PatientAndCreatorSelectors
                creatorUsers={snapshot.users}
                defaultCreatorId={defaultCreatorId}
                defaultPatientId={defaultPatientId}
                patients={snapshot.patients}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="title"
                  className="medic-field"
                  placeholder="Morning stretching"
                />
                <input
                  name="category"
                  className="medic-field"
                  placeholder="mobility"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="frequencyType"
                  className="medic-field"
                  defaultValue="daily"
                />
                <input
                  name="targetMinutes"
                  type="number"
                  className="medic-field"
                  placeholder="10"
                />
              </div>

              <input
                name="daysOfWeek"
                className="medic-field"
                defaultValue="Mon,Tue,Wed,Thu,Fri"
              />
              <textarea
                name="instructions"
                className="medic-field"
                placeholder="Gentle warmup before walking."
              />

              <button
                type="submit"
                disabled={pendingKind === "activity"}
                className="medic-button medic-button-primary"
              >
                {pendingKind === "activity" ? "Adding routine..." : "Add routine"}
              </button>
            </form>
          </WorkbenchCard>

          <WorkbenchCard
            title="Create Appointment"
            description="Insert a checkup or clinic visit directly into a patient timeline."
          >
            <form action={handleCreateAppointment} className="grid gap-4">
              <PatientAndCreatorSelectors
                creatorUsers={snapshot.users}
                defaultCreatorId={defaultCreatorId}
                defaultPatientId={defaultPatientId}
                patients={snapshot.patients}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="title"
                  className="medic-field"
                  placeholder="Monthly checkup"
                />
                <input
                  name="providerName"
                  className="medic-field"
                  placeholder="Dr. Lim"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  name="location"
                  className="medic-field"
                  placeholder="ABC Clinic"
                />
                <input
                  name="appointmentAt"
                  type="datetime-local"
                  className="medic-field"
                />
              </div>

              <textarea
                name="notes"
                className="medic-field"
                placeholder="Follow-up discussion and lab review."
              />

              <button
                type="submit"
                disabled={pendingKind === "appointment"}
                className="medic-button medic-button-primary"
              >
                {pendingKind === "appointment"
                  ? "Adding appointment..."
                  : "Add appointment"}
              </button>
            </form>
          </WorkbenchCard>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <WorkbenchCard
          title="Current Users"
          description="These are the patient, caregiver, and family-member records currently available for testing."
        >
          <div className="grid gap-3">
            {snapshot.users.map((user) => (
              <article
                key={user.userId}
                className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold text-[var(--foreground)]">
                    {user.displayName}
                  </p>
                  <span className="rounded-full bg-[rgba(163,177,138,0.24)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-strong)]">
                    {user.role.replace("_", " ")}
                  </span>
                  {user.hasPatientProfile ? (
                    <span className="rounded-full bg-[rgba(93,173,226,0.2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-strong)]">
                      patient profile
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
                  {user.email}
                  {user.phone ? ` · ${user.phone}` : ""}
                </p>
              </article>
            ))}
          </div>
        </WorkbenchCard>

        <div className="grid gap-6">
          <WorkbenchCard
            title="Recent Testing Records"
            description="Quick visibility into the latest invites, medications, routines, and appointments."
          >
            <SnapshotList
              heading="Invites"
              emptyMessage="No invites created yet."
              items={snapshot.recentInvitations.map((item) => ({
                id: item.code,
                meta: `${item.patientDisplayName} · ${item.memberRole} · ${item.approvalMode}`,
                title: `${item.code} · ${item.status}`,
              }))}
            />

            <div className="mt-5">
              <SnapshotList
                heading="Medications"
                emptyMessage="No medications added yet."
                items={snapshot.recentMedications.map((item) => ({
                  id: item.id,
                  meta: `${item.patientDisplayName} · ${item.createdByDisplayName}`,
                  title: `${item.name} · ${item.scheduleSummary}`,
                }))}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <SnapshotList
                heading="Routines"
                emptyMessage="No routines added yet."
                items={snapshot.recentActivities.map((item) => ({
                  id: item.id,
                  meta: item.patientDisplayName,
                  title: `${item.title} · ${item.category}`,
                }))}
              />
              <SnapshotList
                heading="Appointments"
                emptyMessage="No appointments added yet."
                items={snapshot.recentAppointments.map((item) => ({
                  id: item.id,
                  meta: item.patientDisplayName,
                  title: `${item.title} · ${item.appointmentAt}`,
                }))}
              />
            </div>
          </WorkbenchCard>
        </div>
      </div>
    </section>
  );
}

function WorkbenchCard(props: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-[1.85rem] border border-[var(--color-border)] bg-white p-5 shadow-[0_12px_24px_rgba(47,62,52,0.07)]">
      <h3 className="text-xl font-semibold text-[var(--foreground)]">{props.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
        {props.description}
      </p>
      <div className="mt-4">{props.children}</div>
    </section>
  );
}

function PatientAndCreatorSelectors(props: {
  creatorUsers: TestingWorkbenchSnapshot["users"];
  defaultCreatorId: string;
  defaultPatientId: string;
  patients: TestingWorkbenchSnapshot["patients"];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--foreground)]">Patient</span>
        <select
          name="patientUserId"
          defaultValue={props.defaultPatientId}
          className="medic-field"
        >
          {props.patients.map((patient) => (
            <option key={patient.userId} value={patient.userId}>
              {patient.displayName}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--foreground)]">Created by</span>
        <select
          name="createdByUserId"
          defaultValue={props.defaultCreatorId || props.defaultPatientId}
          className="medic-field"
        >
          {props.creatorUsers.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.displayName} ({user.role})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function SnapshotList(props: {
  emptyMessage: string;
  heading: string;
  items: Array<{
    id: string;
    meta: string;
    title: string;
  }>;
}) {
  return (
    <div>
      <p className="font-label text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
        {props.heading}
      </p>
      <div className="mt-3 grid gap-3">
        {props.items.length === 0 ? (
          <p className="rounded-[1.2rem] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
            {props.emptyMessage}
          </p>
        ) : (
          props.items.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.2rem] bg-[var(--color-surface-muted)] px-4 py-3"
            >
              <p className="text-sm font-semibold leading-6 text-[var(--foreground)]">
                {item.title}
              </p>
              <p className="text-sm leading-6 text-[var(--color-muted-foreground)]">
                {item.meta}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
