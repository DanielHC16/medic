"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type HTMLAttributes,
  type SetStateAction,
  useEffect,
  useState,
} from "react";

import { MedicationReminderPanel } from "@/components/medication-reminder-panel";
import {
  formatDateTime,
  formatDayList,
  formatFrequencyLabel,
  formatStatusLabel,
  formatTimeList,
} from "@/lib/display";
import {
  getLocalDateKey,
  getMedicationIntervalHours,
  getMedicationDoseLimitForDate,
  getMedicationLogsForDate,
  getNextReminderSlot,
  getTakenCountForDate,
} from "@/lib/medication-reminders";
import type {
  MedicationAdherenceSummary,
  MedicationLogRecord,
  MedicationLogStatus,
  MedicationRecord,
  PreferredContactMethod,
  RoleSlug,
  TimeFormatPreference,
} from "@/lib/medic-types";

type MedicationManagerProps = {
  canManage: boolean;
  contactMethod?: PreferredContactMethod;
  items: MedicationRecord[];
  logs?: MedicationLogRecord[];
  patientDisplayName?: string;
  patientUserId: string;
  role?: RoleSlug;
  summary?: MedicationAdherenceSummary;
  timeFormat?: TimeFormatPreference;
  viewerDisplayName?: string;
};

type InstructionPresetValue =
  | "after_meal"
  | "bedtime"
  | "before_meal"
  | "custom"
  | "none"
  | "with_food"
  | "with_water";

type MedicationDraft = {
  daysOfWeek: string[];
  dosageUnit: string;
  dosageValue: string;
  form: string;
  frequencyType: string;
  imageDataUrl: string | null;
  instructionDetails: string;
  instructionPreset: InstructionPresetValue;
  name: string;
  timesOfDay: string[];
};

const WEEKDAY_OPTIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const EVERY_DAY = [...WEEKDAY_OPTIONS];

const FORM_SUGGESTIONS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Drop",
  "Cream",
  "Inhaler",
  "Patch",
] as const;

const DOSAGE_UNIT_SUGGESTIONS = [
  "mg",
  "mcg",
  "g",
  "mL",
  "IU",
  "tablet",
  "capsule",
  "drop",
  "puff",
] as const;

const FREQUENCY_OPTIONS = [
  { label: "Once daily", suggestedTimes: ["08:00"], value: "daily" },
  {
    label: "Twice daily",
    suggestedTimes: ["08:00", "20:00"],
    value: "twice_daily",
  },
  {
    label: "Three times daily",
    suggestedTimes: ["08:00", "13:00", "20:00"],
    value: "three_times_daily",
  },
  {
    label: "Four times daily",
    suggestedTimes: ["06:00", "12:00", "18:00", "22:00"],
    value: "four_times_daily",
  },
  { label: "Weekly schedule", suggestedTimes: ["09:00"], value: "weekly" },
  { label: "Custom schedule", suggestedTimes: ["09:00"], value: "custom" },
] as const;

const INSTRUCTION_PRESETS: Array<{
  description: string;
  label: string;
  text: string;
  value: InstructionPresetValue;
}> = [
  {
    description: "Use your own notes only.",
    label: "Custom only",
    text: "",
    value: "custom",
  },
  {
    description: "No preset instruction is added.",
    label: "No preset",
    text: "",
    value: "none",
  },
  {
    description: "Best when the dose should be taken with a meal.",
    label: "With food",
    text: "Take with food.",
    value: "with_food",
  },
  {
    description: "Useful when the dose should be taken before eating.",
    label: "Before meal",
    text: "Take before a meal.",
    value: "before_meal",
  },
  {
    description: "Useful when the dose should be taken after eating.",
    label: "After meal",
    text: "Take after a meal.",
    value: "after_meal",
  },
  {
    description: "A common hydration reminder for oral medicines.",
    label: "With water",
    text: "Take with a full glass of water.",
    value: "with_water",
  },
  {
    description: "Helpful for bedtime-only medications.",
    label: "Bedtime",
    text: "Take at bedtime.",
    value: "bedtime",
  },
] as const;

function getInstructionPreset(value: InstructionPresetValue) {
  return INSTRUCTION_PRESETS.find((preset) => preset.value === value);
}

function splitInstructions(value: string | null | undefined) {
  const text = value?.trim() || "";

  if (!text) {
    return {
      instructionDetails: "",
      instructionPreset: "none" as InstructionPresetValue,
    };
  }

  for (const preset of INSTRUCTION_PRESETS) {
    if (!preset.text) {
      continue;
    }

    if (text === preset.text) {
      return {
        instructionDetails: "",
        instructionPreset: preset.value,
      };
    }

    if (text.startsWith(`${preset.text} `)) {
      return {
        instructionDetails: text.slice(preset.text.length + 1).trim(),
        instructionPreset: preset.value,
      };
    }
  }

  return {
    instructionDetails: text,
    instructionPreset: "custom" as InstructionPresetValue,
  };
}

function buildInstructions(draft: MedicationDraft) {
  const presetText = getInstructionPreset(draft.instructionPreset)?.text || "";
  const detailText = draft.instructionDetails.trim();

  if (draft.instructionPreset === "custom") {
    return detailText || null;
  }

  if (presetText && detailText) {
    return `${presetText} ${detailText}`;
  }

  return presetText || detailText || null;
}

function createDraft(item?: MedicationRecord): MedicationDraft {
  const instructionState = splitInstructions(item?.instructions);

  return {
    daysOfWeek: item?.scheduleDays.length ? [...item.scheduleDays] : [...EVERY_DAY],
    dosageUnit: item?.dosageUnit ?? "mg",
    dosageValue: item?.dosageValue ?? "",
    form: item?.form ?? "Tablet",
    frequencyType: item?.scheduleFrequencyType ?? "daily",
    imageDataUrl: item?.imageDataUrl ?? null,
    instructionDetails: instructionState.instructionDetails,
    instructionPreset: instructionState.instructionPreset,
    name: item?.name ?? "",
    timesOfDay: item?.scheduleTimes.length ? [...item.scheduleTimes] : ["08:00"],
  };
}

function getSuggestedTimesForFrequency(frequencyType: string) {
  return (
    FREQUENCY_OPTIONS.find((option) => option.value === frequencyType)?.suggestedTimes ?? [
      "09:00",
    ]
  );
}

function applyFrequencyTemplate(current: MedicationDraft, nextFrequencyType: string) {
  const suggestedTimes = getSuggestedTimesForFrequency(nextFrequencyType);
  const existingTimes = current.timesOfDay.filter(Boolean);
  const targetCount = suggestedTimes.length;
  const nextTimes = Array.from({ length: targetCount }, (_, index) => {
    return existingTimes[index] || suggestedTimes[index] || "";
  });

  return {
    ...current,
    frequencyType: nextFrequencyType,
    timesOfDay: nextTimes,
  };
}

function getFormattedSlotTime(slot: Date | null, timeFormat: TimeFormatPreference) {
  if (!slot) {
    return "No more scheduled doses today";
  }

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    hour12: timeFormat !== "24h",
    minute: "2-digit",
  }).format(slot);
}

function getTakenButtonLabel(
  takenCount: number,
  doseLimit: number,
  scheduledToday: boolean,
) {
  if (!scheduledToday && takenCount < doseLimit) {
    return "Log off-schedule dose";
  }

  if (doseLimit <= 1) {
    return takenCount >= doseLimit ? "Taken for today" : "Mark taken";
  }

  return takenCount >= doseLimit
    ? "All doses logged today"
    : `Mark dose taken (${takenCount}/${doseLimit})`;
}

function getAttentionLogForDate(
  item: MedicationRecord,
  logs: MedicationLogRecord[],
  date: Date,
) {
  return getMedicationLogsForDate(logs, item.id, date).find(
    (log) => log.status === "missed" || log.status === "skipped",
  );
}

function buildMedicationPayload(draft: MedicationDraft) {
  const name = draft.name.trim();
  const dosageValue = draft.dosageValue.trim();
  const form = draft.form.trim();
  const dosageUnit = draft.dosageUnit.trim();
  const timesOfDay = draft.timesOfDay.map((value) => value.trim()).filter(Boolean);

  if (!name) {
    throw new Error("Medication name is required.");
  }

  if (!dosageValue) {
    throw new Error("Dosage value is required.");
  }

  if (!form) {
    throw new Error("Medication form is required.");
  }

  if (timesOfDay.length === 0) {
    throw new Error("Add at least one time of day for reminders.");
  }

  const daysOfWeek =
    draft.daysOfWeek.length > 0
      ? draft.daysOfWeek
      : draft.frequencyType === "weekly"
        ? []
        : [...EVERY_DAY];

  if (draft.frequencyType === "weekly" && daysOfWeek.length === 0) {
    throw new Error("Select at least one weekday for a weekly schedule.");
  }

  return {
    daysOfWeek,
    dosageUnit: dosageUnit || null,
    dosageValue,
    form,
    frequencyType: draft.frequencyType || "daily",
    imageDataUrl: draft.imageDataUrl,
    instructions: buildInstructions(draft),
    name,
    timesOfDay,
  };
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read the selected image."));
    };
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

export function MedicationManager({
  canManage,
  contactMethod = "app",
  items,
  logs = [],
  patientDisplayName,
  patientUserId,
  role = "patient",
  summary,
  timeFormat = "12h",
  viewerDisplayName,
}: MedicationManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createDraftState, setCreateDraftState] = useState<MedicationDraft>(() =>
    createDraft(),
  );
  const [editDraft, setEditDraft] = useState<MedicationDraft>(() => createDraft());
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const activeItems = items.filter((item) => item.isActive);
  const archivedItems = items.filter((item) => !item.isActive);
  const todayWeekday = WEEKDAY_OPTIONS[now.getDay()];
  const resolvedPatientDisplayName = patientDisplayName || viewerDisplayName || "Patient";

  async function runRequest(
    url: string,
    method: "DELETE" | "PATCH" | "POST",
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

  async function handleCreateMedication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        "/api/medications",
        "POST",
        {
          ...buildMedicationPayload(createDraftState),
          patientUserId,
        },
        "Unable to add medication.",
      );

      setCreateDraftState(createDraft());
      setMessage("Medication added.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add medication.");
    } finally {
      setPending(false);
    }
  }

  function startEditing(item: MedicationRecord) {
    setEditingId(item.id);
    setEditDraft(createDraft(item));
    setMessage(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditDraft(createDraft());
  }

  async function handleUpdateMedication(medicationId: string) {
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        `/api/medications/${medicationId}`,
        "PATCH",
        {
          ...buildMedicationPayload(editDraft),
          patientUserId,
        },
        "Unable to update medication.",
      );

      cancelEditing();
      setMessage("Medication updated.");
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
      await runRequest(
        `/api/medications/${medicationId}?patientId=${patientUserId}`,
        "DELETE",
        undefined,
        "Unable to archive medication.",
      );

      if (editingId === medicationId) {
        cancelEditing();
      }

      setMessage("Medication archived.");
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
      const timestamp = new Date();
      const isoValue = timestamp.toISOString();
      const scheduledSlot = getNextReminderSlot(item, logs, timestamp) ?? timestamp;
      const scheduledFor = scheduledSlot.toISOString();
      const localDate = getLocalDateKey(scheduledSlot);
      const attentionLog = status === "taken"
        ? getAttentionLogForDate(item, logs, timestamp)
        : null;

      await runRequest(
        "/api/medication-logs",
        "POST",
        {
          logId: attentionLog?.id,
          localDate,
          medicationId: item.id,
          patientUserId,
          scheduleId: item.scheduleId,
          scheduledFor,
          status,
          takenAt: status === "taken" ? isoValue : null,
        },
        `Unable to record "${status}" status.`,
      );

      setMessage(
        status === "taken"
          ? `${item.name} was logged for ${localDate}.`
          : `${item.name} was marked ${status.replace(/_/g, " ")}.`,
      );
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
      <MedicationReminderPanel
        contactMethod={contactMethod}
        logs={logs}
        medications={activeItems}
        patientDisplayName={resolvedPatientDisplayName}
        patientUserId={patientUserId}
        role={role}
        timeFormat={timeFormat}
        viewerDisplayName={viewerDisplayName}
      />

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

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Medication list
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
                Local day tracking is live, so a dose already marked for today cannot be
                recorded again beyond the scheduled limit for the same date.
              </p>
            </div>
            <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Tracking date: {getLocalDateKey(now)}
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            {activeItems.length === 0 ? (
              <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                No active medications have been added yet.
              </p>
            ) : (
              activeItems.map((item) => {
                const takenCountToday = getTakenCountForDate(item, logs, now);
                const doseLimitToday = getMedicationDoseLimitForDate(item, now);
                const nextReminderSlot = getNextReminderSlot(item, logs, now);
                const scheduledToday =
                  item.scheduleDays.length === 0 || item.scheduleDays.includes(todayWeekday);
                const takenLocked = takenCountToday >= doseLimitToday;

                return (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                  >
                    {editingId === item.id ? (
                      <div className="grid gap-4">
                        <MedicationFormFields
                          draft={editDraft}
                          formIdPrefix={`edit-${item.id}`}
                          pending={pending}
                          setDraft={setEditDraft}
                        />

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
                      <div className="grid gap-4 xl:grid-cols-[auto_1fr]">
                        {item.imageDataUrl ? (
                          <div className="h-24 w-24 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
                            <Image
                              src={item.imageDataUrl}
                              alt={`${item.name} photo`}
                              width={96}
                              height={96}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : null}

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
                                {formatFrequencyLabel(item.scheduleFrequencyType)} /{" "}
                                {formatTimeList(item.scheduleTimes)} /{" "}
                                {formatDayList(item.scheduleDays)}
                              </p>
                              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                                Minimum interval: every {getMedicationIntervalHours(item)} hours
                              </p>
                              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                                {scheduledToday
                                  ? `Next reminder: ${getFormattedSlotTime(
                                      nextReminderSlot,
                                      timeFormat,
                                    )}`
                                  : "Not scheduled for today"}
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
                              <span>
                                Today: {takenCountToday}/{doseLimitToday} doses logged
                              </span>
                            </div>
                          </div>

                          {canManage ? (
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => recordLog(item, "taken")}
                                disabled={pending || takenLocked}
                                className="medic-button medic-button-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {getTakenButtonLabel(
                                  takenCountToday,
                                  doseLimitToday,
                                  scheduledToday,
                                )}
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
                      </div>
                    )}
                  </article>
                );
              })
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
            Use the guided form to set schedule times, weekdays, instructions, and an
            optional medication image for the patient and care circle.
          </p>

          {canManage ? (
            <form onSubmit={handleCreateMedication} className="mt-5 grid gap-4">
              <MedicationFormFields
                draft={createDraftState}
                formIdPrefix="create"
                pending={pending}
                setDraft={setCreateDraftState}
              />

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
                  Date key: {log.loggedForDate || "Not set"}
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

function MedicationFormFields(props: {
  draft: MedicationDraft;
  formIdPrefix: string;
  pending: boolean;
  setDraft: Dispatch<SetStateAction<MedicationDraft>>;
}) {
  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const imageDataUrl = await readImageAsDataUrl(file);
      props.setDraft((current) => ({
        ...current,
        imageDataUrl,
      }));
    } finally {
      event.target.value = "";
    }
  }

  function toggleWeekday(day: string) {
    props.setDraft((current) => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(day)
        ? current.daysOfWeek.filter((value) => value !== day)
        : [...current.daysOfWeek, day],
    }));
  }

  function updateTime(index: number, value: string) {
    props.setDraft((current) => ({
      ...current,
      timesOfDay: current.timesOfDay.map((entry, entryIndex) =>
        entryIndex === index ? value : entry,
      ),
    }));
  }

  function addTimeSlot() {
    props.setDraft((current) => ({
      ...current,
      timesOfDay: [...current.timesOfDay, ""],
    }));
  }

  function removeTimeSlot(index: number) {
    props.setDraft((current) => ({
      ...current,
      timesOfDay:
        current.timesOfDay.length === 1
          ? [""]
          : current.timesOfDay.filter((_, entryIndex) => entryIndex !== index),
    }));
  }

  return (
    <div className="grid gap-4">
      <Field
        label="Medication name"
        value={props.draft.name}
        minLength={2}
        maxLength={100}
        onChange={(value) =>
          props.setDraft((current) => ({
            ...current,
            name: value,
          }))
        }
        required
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Dosage value"
          type="number"
          step="0.01"
          min="0.001"
          max="999999"
          inputMode="decimal"
          value={props.draft.dosageValue}
          onChange={(value) =>
            props.setDraft((current) => ({
              ...current,
              dosageValue: value,
            }))
          }
          required
        />
        <Field
          label="Dosage unit"
          listId={`${props.formIdPrefix}-dosage-units`}
          value={props.draft.dosageUnit}
          maxLength={20}
          onChange={(value) =>
            props.setDraft((current) => ({
              ...current,
              dosageUnit: value,
            }))
          }
          placeholder="mg"
        />
      </div>

      <datalist id={`${props.formIdPrefix}-dosage-units`}>
        {DOSAGE_UNIT_SUGGESTIONS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>

      <Field
        label="Medication form"
        listId={`${props.formIdPrefix}-medication-forms`}
        value={props.draft.form}
        maxLength={60}
        onChange={(value) =>
          props.setDraft((current) => ({
            ...current,
            form: value,
          }))
        }
        placeholder="Tablet"
        required
      />

      <datalist id={`${props.formIdPrefix}-medication-forms`}>
        {FORM_SUGGESTIONS.map((form) => (
          <option key={form} value={form} />
        ))}
      </datalist>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--foreground)]">Frequency</span>
        <select
          value={props.draft.frequencyType}
          onChange={(event) =>
            props.setDraft((current) =>
              applyFrequencyTemplate(current, event.target.value),
            )
          }
          className="medic-field"
        >
          {FREQUENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-2">
        <span className="text-sm font-medium text-[var(--foreground)]">
          Weekdays
        </span>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_OPTIONS.map((day) => {
            const isSelected = props.draft.daysOfWeek.includes(day);

            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleWeekday(day)}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  isSelected
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface-muted)] text-[var(--foreground)]"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-[var(--foreground)]">Time of day</span>
          <button
            type="button"
            onClick={addTimeSlot}
            className="medic-button px-3 py-1 text-xs"
          >
            Add time
          </button>
        </div>
        <div className="grid gap-3">
          {props.draft.timesOfDay.map((time, index) => (
            <div key={`${props.formIdPrefix}-time-${index}`} className="flex gap-3">
              <input
                type="time"
                value={time}
                onChange={(event) => updateTime(index, event.target.value)}
                required
                className="medic-field"
              />
              <button
                type="button"
                onClick={() => removeTimeSlot(index)}
                className="medic-button px-3 py-2 text-sm"
                disabled={props.pending}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-medium text-[var(--foreground)]">
          Instruction preset
        </span>
        <div className="grid gap-3 sm:grid-cols-2">
          {INSTRUCTION_PRESETS.map((preset) => (
            <label
              key={preset.value}
              className={`grid gap-1 rounded-3xl border p-4 ${
                props.draft.instructionPreset === preset.value
                  ? "border-[var(--color-primary)] bg-[rgba(92,139,107,0.08)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-muted)]"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <input
                  type="radio"
                  name={`${props.formIdPrefix}-instruction-preset`}
                  checked={props.draft.instructionPreset === preset.value}
                  onChange={() =>
                    props.setDraft((current) => ({
                      ...current,
                      instructionPreset: preset.value,
                    }))
                  }
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                {preset.label}
              </span>
              <span className="text-xs leading-5 text-[var(--color-muted-foreground)]">
                {preset.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-[var(--foreground)]">
          Extra instructions
        </span>
        <textarea
          value={props.draft.instructionDetails}
          onChange={(event) =>
            props.setDraft((current) => ({
              ...current,
              instructionDetails: event.target.value,
            }))
          }
          placeholder="Example: Crush and mix with applesauce if swallowing is difficult."
          maxLength={1000}
          className="medic-field min-h-24"
        />
      </label>

      <div className="grid gap-3">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Medication image
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="medic-field file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </label>

        {props.draft.imageDataUrl ? (
          <div className="grid gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
            <div className="h-36 w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
              <Image
                src={props.draft.imageDataUrl}
                alt="Medication preview"
                width={720}
                height={360}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={() =>
                props.setDraft((current) => ({
                  ...current,
                  imageDataUrl: null,
                }))
              }
              className="medic-button w-fit px-4 py-2 text-sm"
            >
              Remove image
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field(props: {
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  listId?: string;
  max?: string;
  maxLength?: number;
  min?: string;
  minLength?: number;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
  type?: string;
  value?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{props.label}</span>
      <input
        type={props.type || "text"}
        value={props.value}
        onChange={props.onChange ? (event) => props.onChange?.(event.target.value) : undefined}
        placeholder={props.placeholder}
        required={props.required}
        list={props.listId}
        inputMode={props.inputMode}
        max={props.max}
        maxLength={props.maxLength}
        min={props.min}
        minLength={props.minLength}
        step={props.step}
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
