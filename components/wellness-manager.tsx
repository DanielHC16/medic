"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatDateTime, formatDayList, formatStatusLabel } from "@/lib/display";
import type {
  ActivityLogRecord,
  ActivityPlanRecord,
  ActivitySummary,
  AppointmentRecord,
} from "@/lib/medic-types";

type RoutineDraft = {
  category: string;
  daysOfWeek: string;
  frequencyType: string;
  instructions: string;
  targetMinutes: string;
  title: string;
};

type AppointmentDraft = {
  appointmentAt: string;
  location: string;
  notes: string;
  providerName: string;
  status: string;
  title: string;
};

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createRoutineDraft(item?: ActivityPlanRecord): RoutineDraft {
  return {
    category: item?.category ?? "",
    daysOfWeek: item?.daysOfWeek.join(", ") ?? "",
    frequencyType: item?.frequencyType ?? "daily",
    instructions: item?.instructions ?? "",
    targetMinutes: item?.targetMinutes ? String(item.targetMinutes) : "",
    title: item?.title ?? "",
  };
}

function toDateTimeInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function createAppointmentDraft(item?: AppointmentRecord): AppointmentDraft {
  return {
    appointmentAt: toDateTimeInput(item?.appointmentAt),
    location: item?.location ?? "",
    notes: item?.notes ?? "",
    providerName: item?.providerName ?? "",
    status: item?.status ?? "scheduled",
    title: item?.title ?? "",
  };
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-[1.75rem] border border-black/5 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
        {props.label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        {props.value}
      </p>
    </article>
  );
}

function Field(props: {
  label: string;
  name?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{props.label}</span>
      <input
        name={props.name}
        required={props.required}
        value={props.value}
        onChange={props.onChange ? (event) => props.onChange!(event.target.value) : undefined}
        placeholder={props.placeholder}
        className="medic-field"
      />
    </label>
  );
}

type WellnessManagerProps = {
  activityLogs?: ActivityLogRecord[];
  activityPlans: ActivityPlanRecord[];
  activitySummary?: ActivitySummary;
  appointments: AppointmentRecord[];
  canManage: boolean;
  patientUserId: string;
};

export function WellnessManager({
  activityLogs = [],
  activityPlans,
  activitySummary,
  appointments,
  canManage,
  patientUserId,
}: WellnessManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [routineDraft, setRoutineDraft] = useState<RoutineDraft>(createRoutineDraft());
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentDraft>(
    createAppointmentDraft(),
  );

  const activePlans = activityPlans.filter((item) => item.isActive);
  const archivedPlans = activityPlans.filter((item) => !item.isActive);

  async function runRequest(
    url: string,
    method: string,
    body?: Record<string, unknown>,
    fallbackMessage?: string,
  ) {
    const response = await fetch(url, {
      body: body ? JSON.stringify(body) : undefined,
      headers: body
        ? {
            "Content-Type": "application/json",
          }
        : undefined,
      method,
    });
    const payload = (await response.json()) as { message?: string; ok: boolean };

    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || fallbackMessage || "Request failed.");
    }
  }

  async function createActivity(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        "/api/activities",
        "POST",
        {
          category: formData.get("category"),
          daysOfWeek: parseCommaList(String(formData.get("daysOfWeek") || "")),
          frequencyType: formData.get("frequencyType"),
          instructions: formData.get("instructions"),
          patientUserId,
          targetMinutes: formData.get("targetMinutes"),
          title: formData.get("title"),
        },
        "Unable to create activity plan.",
      );

      setRoutineDraft(createRoutineDraft());
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create activity plan.",
      );
    } finally {
      setPending(false);
    }
  }

  async function saveRoutine(activityPlanId: string) {
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        `/api/activities/${activityPlanId}`,
        "PATCH",
        {
          category: routineDraft.category,
          daysOfWeek: parseCommaList(routineDraft.daysOfWeek),
          frequencyType: routineDraft.frequencyType,
          instructions: routineDraft.instructions,
          patientUserId,
          targetMinutes: routineDraft.targetMinutes,
          title: routineDraft.title,
        },
        "Unable to update routine.",
      );

      setEditingRoutineId(null);
      setRoutineDraft(createRoutineDraft());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update routine.");
    } finally {
      setPending(false);
    }
  }

  async function archiveRoutine(activityPlanId: string) {
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        `/api/activities/${activityPlanId}?patientId=${patientUserId}`,
        "DELETE",
        undefined,
        "Unable to archive routine.",
      );
      setEditingRoutineId(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to archive routine.");
    } finally {
      setPending(false);
    }
  }

  async function logRoutine(activityPlanId: string, status: "done" | "missed") {
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        "/api/activity-logs",
        "POST",
        {
          activityPlanId,
          patientUserId,
          status,
        },
        "Unable to record routine progress.",
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to record routine progress.",
      );
    } finally {
      setPending(false);
    }
  }

  async function createAppointmentItem(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        "/api/appointments",
        "POST",
        {
          appointmentAt: formData.get("appointmentAt"),
          location: formData.get("location"),
          notes: formData.get("notes"),
          patientUserId,
          providerName: formData.get("providerName"),
          title: formData.get("appointmentTitle"),
        },
        "Unable to create appointment.",
      );

      setAppointmentDraft(createAppointmentDraft());
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create appointment.",
      );
    } finally {
      setPending(false);
    }
  }

  async function saveAppointment(appointmentId: string) {
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        `/api/appointments/${appointmentId}`,
        "PATCH",
        {
          appointmentAt: appointmentDraft.appointmentAt,
          location: appointmentDraft.location,
          notes: appointmentDraft.notes,
          patientUserId,
          providerName: appointmentDraft.providerName,
          status: appointmentDraft.status,
          title: appointmentDraft.title,
        },
        "Unable to update appointment.",
      );

      setEditingAppointmentId(null);
      setAppointmentDraft(createAppointmentDraft());
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update appointment.",
      );
    } finally {
      setPending(false);
    }
  }

  async function cancelAppointmentItem(appointmentId: string) {
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        `/api/appointments/${appointmentId}?patientId=${patientUserId}`,
        "DELETE",
        undefined,
        "Unable to cancel appointment.",
      );
      setEditingAppointmentId(null);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to cancel appointment.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {activitySummary ? (
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Active routines" value={String(activitySummary.activePlans)} />
          <MetricCard
            label="Completed today"
            value={String(activitySummary.completedToday)}
          />
          <MetricCard label="Missed today" value={String(activitySummary.missedToday)} />
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Wellness routines
          </h2>
          <div className="mt-4 grid gap-4">
            {activePlans.length === 0 ? (
              <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                No active wellness routines yet.
              </p>
            ) : (
              activePlans.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  {editingRoutineId === item.id ? (
                    <div className="grid gap-4">
                      <Field
                        label="Routine title"
                        value={routineDraft.title}
                        onChange={(value) =>
                          setRoutineDraft((current) => ({ ...current, title: value }))
                        }
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field
                          label="Category"
                          value={routineDraft.category}
                          onChange={(value) =>
                            setRoutineDraft((current) => ({ ...current, category: value }))
                          }
                        />
                        <Field
                          label="Frequency"
                          value={routineDraft.frequencyType}
                          onChange={(value) =>
                            setRoutineDraft((current) => ({
                              ...current,
                              frequencyType: value,
                            }))
                          }
                        />
                        <Field
                          label="Days of week"
                          value={routineDraft.daysOfWeek}
                          onChange={(value) =>
                            setRoutineDraft((current) => ({ ...current, daysOfWeek: value }))
                          }
                        />
                        <Field
                          label="Target minutes"
                          value={routineDraft.targetMinutes}
                          onChange={(value) =>
                            setRoutineDraft((current) => ({
                              ...current,
                              targetMinutes: value,
                            }))
                          }
                        />
                      </div>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          Instructions
                        </span>
                        <textarea
                          value={routineDraft.instructions}
                          onChange={(event) =>
                            setRoutineDraft((current) => ({
                              ...current,
                              instructions: event.target.value,
                            }))
                          }
                          className="medic-field min-h-28"
                        />
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => saveRoutine(item.id)}
                          disabled={pending}
                          className="medic-button medic-button-primary px-4 py-2 text-sm"
                        >
                          Save routine
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRoutineId(null)}
                          disabled={pending}
                          className="medic-button px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-lg font-semibold text-[var(--foreground)]">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                          {item.category} / {item.frequencyType} / {formatDayList(item.daysOfWeek)}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                          {item.targetMinutes
                            ? `${item.targetMinutes} minutes`
                            : "No target minutes"}{" "}
                          / Latest: {formatStatusLabel(item.latestCompletionStatus)}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                          {item.instructions || "No extra instructions."}
                        </p>
                      </div>
                      {canManage ? (
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => logRoutine(item.id, "done")}
                            disabled={pending}
                            className="medic-button medic-button-primary px-4 py-2 text-sm"
                          >
                            Mark done
                          </button>
                          <button
                            type="button"
                            onClick={() => logRoutine(item.id, "missed")}
                            disabled={pending}
                            className="medic-button medic-button-soft px-4 py-2 text-sm"
                          >
                            Mark missed
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRoutineId(item.id);
                              setRoutineDraft(createRoutineDraft(item));
                            }}
                            disabled={pending}
                            className="medic-button px-4 py-2 text-sm"
                          >
                            Edit routine
                          </button>
                          <button
                            type="button"
                            onClick={() => archiveRoutine(item.id)}
                            disabled={pending}
                            className="medic-button px-4 py-2 text-sm"
                          >
                            Archive
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Appointments
          </h2>
          <div className="mt-4 grid gap-4">
            {appointments.length === 0 ? (
              <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                No appointments yet.
              </p>
            ) : (
              appointments.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  {editingAppointmentId === item.id ? (
                    <div className="grid gap-4">
                      <Field
                        label="Title"
                        value={appointmentDraft.title}
                        onChange={(value) =>
                          setAppointmentDraft((current) => ({ ...current, title: value }))
                        }
                      />
                      <Field
                        label="Provider"
                        value={appointmentDraft.providerName}
                        onChange={(value) =>
                          setAppointmentDraft((current) => ({
                            ...current,
                            providerName: value,
                          }))
                        }
                      />
                      <Field
                        label="Location"
                        value={appointmentDraft.location}
                        onChange={(value) =>
                          setAppointmentDraft((current) => ({
                            ...current,
                            location: value,
                          }))
                        }
                      />
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          Appointment time
                        </span>
                        <input
                          type="datetime-local"
                          value={appointmentDraft.appointmentAt}
                          onChange={(event) =>
                            setAppointmentDraft((current) => ({
                              ...current,
                              appointmentAt: event.target.value,
                            }))
                          }
                          className="medic-field"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          Status
                        </span>
                        <select
                          value={appointmentDraft.status}
                          onChange={(event) =>
                            setAppointmentDraft((current) => ({
                              ...current,
                              status: event.target.value,
                            }))
                          }
                          className="medic-field"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          Notes
                        </span>
                        <textarea
                          value={appointmentDraft.notes}
                          onChange={(event) =>
                            setAppointmentDraft((current) => ({
                              ...current,
                              notes: event.target.value,
                            }))
                          }
                          className="medic-field min-h-24"
                        />
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => saveAppointment(item.id)}
                          disabled={pending}
                          className="medic-button medic-button-primary px-4 py-2 text-sm"
                        >
                          Save appointment
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAppointmentId(null)}
                          disabled={pending}
                          className="medic-button px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-lg font-semibold text-[var(--foreground)]">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                          {item.providerName || "Provider not set"} /{" "}
                          {item.location || "No location"}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                          {formatDateTime(item.appointmentAt)}
                        </p>
                        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                          Status: {formatStatusLabel(item.status)}
                        </p>
                      </div>
                      {canManage ? (
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAppointmentId(item.id);
                              setAppointmentDraft(createAppointmentDraft(item));
                            }}
                            disabled={pending}
                            className="medic-button px-4 py-2 text-sm"
                          >
                            Edit appointment
                          </button>
                          {item.status !== "cancelled" ? (
                            <button
                              type="button"
                              onClick={() => cancelAppointmentItem(item.id)}
                              disabled={pending}
                              className="medic-button medic-button-soft px-4 py-2 text-sm"
                            >
                              Cancel appointment
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {canManage ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Add routine
            </h2>
            <form action={createActivity} className="mt-5 grid gap-4">
              <Field label="Routine title" name="title" required />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Category" name="category" required />
                <Field label="Frequency" name="frequencyType" placeholder="daily" required />
                <Field label="Days of week" name="daysOfWeek" placeholder="Mon, Tue, Wed" />
                <Field label="Target minutes" name="targetMinutes" placeholder="10" />
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Instructions
                </span>
                <textarea name="instructions" className="medic-field min-h-24" />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="medic-button medic-button-primary"
              >
                {pending ? "Saving routine..." : "Add routine"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Add appointment
            </h2>
            <form action={createAppointmentItem} className="mt-5 grid gap-4">
              <Field label="Appointment title" name="appointmentTitle" required />
              <Field label="Provider" name="providerName" />
              <Field label="Location" name="location" />
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Appointment time
                </span>
                <input
                  name="appointmentAt"
                  type="datetime-local"
                  className="medic-field"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Notes
                </span>
                <textarea name="notes" className="medic-field min-h-24" />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="medic-button medic-button-primary"
              >
                {pending ? "Saving appointment..." : "Add appointment"}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {archivedPlans.length > 0 ? (
        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Archived routines
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {archivedPlans.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <p className="text-base font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  {item.category} / {item.frequencyType}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activityLogs.length > 0 ? (
        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Recent routine activity
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {activityLogs.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <p className="text-base font-semibold text-[var(--foreground)]">
                  {item.activityTitle}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  Status: {formatStatusLabel(item.completionStatus)}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  Recorded: {formatDateTime(item.completedAt || item.createdAt)}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {message ? (
        <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
