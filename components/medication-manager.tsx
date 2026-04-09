"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatDateTime, formatDayList, formatStatusLabel, formatTimeList } from "@/lib/display";
import type {
  MedicationAdherenceSummary,
  MedicationLogRecord,
  MedicationLogStatus,
  MedicationRecord,
} from "@/lib/medic-types";

type MedicationManagerProps = {
  canManage: boolean;
  items: MedicationRecord[];
  logs?: MedicationLogRecord[];
  patientUserId: string;
  summary?: MedicationAdherenceSummary;
};

type MedicationDraft = {
  daysOfWeek: string;
  dosageUnit: string;
  dosageValue: string;
  form: string;
  frequencyType: string;
  instructions: string;
  name: string;
  timesOfDay: string;
};

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createDraft(item?: MedicationRecord): MedicationDraft {
  return {
    daysOfWeek: item?.scheduleDays.join(", ") ?? "",
    dosageUnit: item?.dosageUnit ?? "",
    dosageValue: item?.dosageValue ?? "",
    form: item?.form ?? "",
    frequencyType: item?.scheduleFrequencyType ?? "daily",
    instructions: item?.instructions ?? "",
    name: item?.name ?? "",
    timesOfDay: item?.scheduleTimes.join(", ") ?? "",
  };
}

export function MedicationManager({
  canManage,
  items,
  logs = [],
  patientUserId,
  summary,
}: MedicationManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MedicationDraft>(createDraft());

  const activeItems = items.filter((item) => item.isActive);
  const archivedItems = items.filter((item) => !item.isActive);

  async function handleCreateMedication(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/medications", {
        body: JSON.stringify({
          daysOfWeek: parseCommaList(String(formData.get("daysOfWeek") || "")),
          dosageUnit: formData.get("dosageUnit"),
          dosageValue: formData.get("dosageValue"),
          form: formData.get("form"),
          frequencyType: formData.get("frequencyType"),
          instructions: formData.get("instructions"),
          name: formData.get("name"),
          patientUserId,
          timesOfDay: parseCommaList(String(formData.get("timesOfDay") || "")),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to add medication.");
      }

      setDraft(createDraft());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add medication.");
    } finally {
      setPending(false);
    }
  }

  function startEditing(item: MedicationRecord) {
    setEditingId(item.id);
    setDraft(createDraft(item));
    setMessage(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft(createDraft());
  }

  async function handleUpdateMedication(medicationId: string) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/medications/${medicationId}`, {
        body: JSON.stringify({
          daysOfWeek: parseCommaList(draft.daysOfWeek),
          dosageUnit: draft.dosageUnit,
          dosageValue: draft.dosageValue,
          form: draft.form,
          frequencyType: draft.frequencyType,
          instructions: draft.instructions,
          name: draft.name,
          patientUserId,
          timesOfDay: parseCommaList(draft.timesOfDay),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as {
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to update medication.");
      }

      cancelEditing();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update medication.");
    } finally {
      setPending(false);
    }
  }

  async function archiveMedicationItem(medicationId: string) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/medications/${medicationId}?patientId=${patientUserId}`,
        {
          method: "DELETE",
        },
      );
      const payload = (await response.json()) as {
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to archive medication.");
      }

      if (editingId === medicationId) {
        cancelEditing();
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to archive medication.");
    } finally {
      setPending(false);
    }
  }

  async function recordLog(item: MedicationRecord, status: MedicationLogStatus) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/medication-logs", {
        body: JSON.stringify({
          medicationId: item.id,
          patientUserId,
          scheduleId: item.scheduleId,
          scheduledFor: new Date().toISOString(),
          status,
          takenAt: status === "taken" ? new Date().toISOString() : null,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || `Unable to record "${status}" status.`);
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : `Unable to record "${status}" status.`,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {summary ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Active meds" value={String(summary.activeMedications)} />
          <MetricCard label="Due today" value={String(summary.dueToday)} />
          <MetricCard label="Taken" value={String(summary.takenToday)} />
          <MetricCard label="Missed" value={String(summary.missedToday)} />
          <MetricCard label="Skipped" value={String(summary.skippedToday)} />
          <MetricCard label="Logged" value={String(summary.loggedToday)} />
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Medication list
          </h2>
          <div className="mt-4 grid gap-4">
            {activeItems.length === 0 ? (
              <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                No active medications have been added yet.
              </p>
            ) : (
              activeItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                >
                  {editingId === item.id ? (
                    <div className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field
                          label="Name"
                          value={draft.name}
                          onChange={(value) =>
                            setDraft((current) => ({ ...current, name: value }))
                          }
                        />
                        <Field
                          label="Form"
                          value={draft.form}
                          onChange={(value) =>
                            setDraft((current) => ({ ...current, form: value }))
                          }
                        />
                        <Field
                          label="Dosage value"
                          value={draft.dosageValue}
                          onChange={(value) =>
                            setDraft((current) => ({ ...current, dosageValue: value }))
                          }
                        />
                        <Field
                          label="Dosage unit"
                          value={draft.dosageUnit}
                          onChange={(value) =>
                            setDraft((current) => ({ ...current, dosageUnit: value }))
                          }
                        />
                        <Field
                          label="Frequency"
                          value={draft.frequencyType}
                          onChange={(value) =>
                            setDraft((current) => ({
                              ...current,
                              frequencyType: value,
                            }))
                          }
                        />
                        <Field
                          label="Times of day"
                          value={draft.timesOfDay}
                          onChange={(value) =>
                            setDraft((current) => ({ ...current, timesOfDay: value }))
                          }
                          placeholder="08:00, 20:00"
                        />
                      </div>

                      <Field
                        label="Days of week"
                        value={draft.daysOfWeek}
                        onChange={(value) =>
                          setDraft((current) => ({ ...current, daysOfWeek: value }))
                        }
                        placeholder="Mon, Tue, Wed"
                      />
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          Instructions
                        </span>
                        <textarea
                          value={draft.instructions}
                          onChange={(event) =>
                            setDraft((current) => ({
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
                          onClick={() => handleUpdateMedication(item.id)}
                          disabled={pending}
                          className="medic-button medic-button-primary px-4 py-2 text-sm"
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={pending}
                          className="medic-button px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-[var(--foreground)]">
                            {item.name}
                          </p>
                          <p className="text-sm text-[var(--color-muted-foreground)]">
                            {item.dosageValue}
                            {item.dosageUnit ? ` ${item.dosageUnit}` : ""} / {item.form}
                          </p>
                          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                            {item.scheduleFrequencyType || "Manual"} /{" "}
                            {formatTimeList(item.scheduleTimes)} /{" "}
                            {formatDayList(item.scheduleDays)}
                          </p>
                          {item.instructions ? (
                            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                              {item.instructions}
                            </p>
                          ) : null}
                        </div>

                        <div className="grid gap-1 text-sm text-[var(--color-muted-foreground)]">
                          <span>
                            Latest log: {formatStatusLabel(item.latestLogStatus)}
                          </span>
                          <span>
                            Last recorded: {formatDateTime(item.latestTakenAt)}
                          </span>
                        </div>
                      </div>

                      {canManage ? (
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => recordLog(item, "taken")}
                            disabled={pending}
                            className="medic-button medic-button-primary px-4 py-2 text-sm"
                          >
                            Mark taken
                          </button>
                          <button
                            type="button"
                            onClick={() => recordLog(item, "missed")}
                            disabled={pending}
                            className="medic-button medic-button-soft px-4 py-2 text-sm"
                          >
                            Mark missed
                          </button>
                          <button
                            type="button"
                            onClick={() => recordLog(item, "skipped")}
                            disabled={pending}
                            className="medic-button medic-button-soft px-4 py-2 text-sm"
                          >
                            Mark skipped
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            disabled={pending}
                            className="medic-button px-4 py-2 text-sm"
                          >
                            Edit details
                          </button>
                          <button
                            type="button"
                            onClick={() => archiveMedicationItem(item.id)}
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

          {archivedItems.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Archived medications
              </h3>
              <div className="mt-3 grid gap-3">
                {archivedItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-[var(--color-border)] bg-white p-4"
                  >
                    <p className="text-base font-semibold text-[var(--foreground)]">
                      {item.name}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      {item.dosageValue}
                      {item.dosageUnit ? ` ${item.dosageUnit}` : ""} / {item.form}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Add medication
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
            Create a medication and its starting schedule in one step.
          </p>

          {canManage ? (
            <form action={handleCreateMedication} className="mt-5 grid gap-4">
              <Field label="Name" name="name" required />

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Dosage value" name="dosageValue" required />
                <Field
                  label="Dosage unit"
                  name="dosageUnit"
                  placeholder="mg"
                />
              </div>

              <Field
                label="Form"
                name="form"
                placeholder="Tablet"
                required
              />
              <Field
                label="Frequency"
                name="frequencyType"
                placeholder="daily"
                required
              />
              <Field
                label="Days of week"
                name="daysOfWeek"
                placeholder="Mon, Tue, Wed, Thu, Fri, Sat, Sun"
              />
              <Field
                label="Times of day"
                name="timesOfDay"
                placeholder="08:00, 20:00"
              />

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Instructions
                </span>
                <textarea
                  name="instructions"
                  className="medic-field min-h-24"
                />
              </label>

              <button
                type="submit"
                disabled={pending}
                className="medic-button medic-button-primary"
              >
                {pending ? "Saving..." : "Add medication"}
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
              Family members have view-only medication access.
            </p>
          )}

          {message ? (
            <p className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
              {message}
            </p>
          ) : null}
        </section>
      </div>

      {logs.length > 0 ? (
        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Recent medication activity
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {logs.map((log) => (
              <article
                key={log.id}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <p className="text-base font-semibold text-[var(--foreground)]">
                  {log.medicationName}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  Status: {formatStatusLabel(log.status)}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  Recorded: {formatDateTime(log.takenAt || log.createdAt)}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  Source: {formatStatusLabel(log.source)}
                </p>
                {log.notes ? (
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                    {log.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
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
