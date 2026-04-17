"use client";

import { useRouter } from "next/navigation";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useRef,
  useState,
} from "react";

import { WellnessAiPanel } from "@/components/wellness-ai-panel";
import { formatDateTime, formatDayList, formatStatusLabel } from "@/lib/display";
import type {
  ActivityLogRecord,
  ActivityPlanRecord,
  ActivitySummary,
  AppointmentRecord,
} from "@/lib/medic-types";
import type { WellnessRoutineSuggestion } from "@/lib/wellness-ai-shared";

type RoutineDraft = {
  category: string;
  daysOfWeek: string[];
  frequencyType: string;
  instructions: string;
  targetMinutes: string;
  title: string;
};

type AppointmentDraft = {
  appointmentDate: string;
  appointmentTime: string;
  location: string;
  notes: string;
  providerName: string;
  status: string;
  title: string;
};

const WEEKDAY_OPTIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const EVERY_DAY = [...WEEKDAY_OPTIONS];
const WEEKDAY_ONLY = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

const ROUTINE_CATEGORY_SUGGESTIONS = [
  "Cardio",
  "Mobility",
  "Stretching",
  "Breathing",
  "Strength",
  "Rehab",
  "Wellness",
  "Walking",
  "Yoga",
  "Balance",
] as const;

const ROUTINE_FREQUENCY_OPTIONS = [
  {
    description: "The routine is expected every day.",
    label: "Every day",
    value: "daily",
  },
  {
    description: "Use the same plan from Monday to Friday.",
    label: "Weekdays",
    value: "weekdays",
  },
  {
    description: "Pick one or more weekdays for the routine.",
    label: "Selected days",
    value: "weekly",
  },
  {
    description: "Keep a flexible recurring routine with your own day pattern.",
    label: "Flexible",
    value: "custom",
  },
] as const;

const ROUTINE_INSTRUCTION_STARTERS = [
  "Keep the pace light and comfortable.",
  "Pause if dizziness or pain appears.",
  "Use support if balance feels unsteady.",
  "Complete the routine after breakfast.",
] as const;

const APPOINTMENT_TITLE_SUGGESTIONS = [
  "Routine checkup",
  "Follow-up visit",
  "Lab work",
  "Therapy session",
  "Specialist consult",
  "Dental visit",
  "Vaccination visit",
] as const;

const APPOINTMENT_STATUS_OPTIONS = [
  {
    description: "The visit is still planned.",
    label: "Scheduled",
    value: "scheduled",
  },
  {
    description: "The visit already happened.",
    label: "Completed",
    value: "completed",
  },
  {
    description: "The visit will not happen.",
    label: "Cancelled",
    value: "cancelled",
  },
] as const;

function createRoutineDraft(item?: ActivityPlanRecord): RoutineDraft {
  const frequencyType = item?.frequencyType ?? "daily";
  const normalizedFrequencyType = ROUTINE_FREQUENCY_OPTIONS.some(
    (option) => option.value === frequencyType,
  )
    ? frequencyType
    : "custom";

  return {
    category: item?.category ?? "",
    daysOfWeek: item?.daysOfWeek.length ? [...item.daysOfWeek] : [...EVERY_DAY],
    frequencyType: normalizedFrequencyType,
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
  const localDateTime = toDateTimeInput(item?.appointmentAt);

  return {
    appointmentDate: localDateTime.slice(0, 10),
    appointmentTime: localDateTime.slice(11, 16),
    location: item?.location ?? "",
    notes: item?.notes ?? "",
    providerName: item?.providerName ?? "",
    status: item?.status ?? "scheduled",
    title: item?.title ?? "",
  };
}

function getRoutineDaysForFrequency(draft: RoutineDraft) {
  if (draft.frequencyType === "daily") {
    return [...EVERY_DAY];
  }

  if (draft.frequencyType === "weekdays") {
    return [...WEEKDAY_ONLY];
  }

  return WEEKDAY_OPTIONS.filter((day) => draft.daysOfWeek.includes(day));
}

function formatRoutineDaySummary(daysOfWeek: string[]) {
  const normalizedDays = WEEKDAY_OPTIONS.filter((day) => daysOfWeek.includes(day));

  if (normalizedDays.length === EVERY_DAY.length) {
    return "Every day";
  }

  if (
    normalizedDays.length === WEEKDAY_ONLY.length &&
    WEEKDAY_ONLY.every((day) => normalizedDays.includes(day))
  ) {
    return "Weekdays";
  }

  return formatDayList(normalizedDays);
}

function buildRoutinePayload(draft: RoutineDraft) {
  const title = draft.title.trim();
  const category = draft.category.trim();
  const daysOfWeek = getRoutineDaysForFrequency(draft);
  const targetMinutes = draft.targetMinutes.trim();

  if (!title) {
    throw new Error("Routine title is required.");
  }

  if (!category) {
    throw new Error("Routine category is required.");
  }

  if (daysOfWeek.length === 0) {
    throw new Error("Select at least one day for this routine.");
  }

  if (targetMinutes && (!Number.isFinite(Number(targetMinutes)) || Number(targetMinutes) <= 0)) {
    throw new Error("Target minutes must be greater than zero.");
  }

  return {
    category,
    daysOfWeek,
    frequencyType: draft.frequencyType || "daily",
    instructions: draft.instructions.trim() || null,
    targetMinutes: targetMinutes || null,
    title,
  };
}

function createRoutineDraftFromSuggestion(
  routine: WellnessRoutineSuggestion,
): RoutineDraft {
  return {
    category: routine.category,
    daysOfWeek: [...routine.daysOfWeek],
    frequencyType: routine.frequencyType,
    instructions: routine.instructions,
    targetMinutes: routine.targetMinutes ? String(routine.targetMinutes) : "",
    title: routine.title,
  };
}

function buildAppointmentPayload(draft: AppointmentDraft, includeStatus: boolean) {
  const title = draft.title.trim();
  const appointmentDate = draft.appointmentDate.trim();
  const appointmentTime = draft.appointmentTime.trim();

  if (!title) {
    throw new Error("Appointment title is required.");
  }

  if (!appointmentDate) {
    throw new Error("Appointment date is required.");
  }

  if (!appointmentTime) {
    throw new Error("Appointment time is required.");
  }

  const appointmentAt = `${appointmentDate}T${appointmentTime}`;
  const parsedDate = new Date(appointmentAt);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Appointment date and time must be valid.");
  }

  const payload = {
    appointmentAt,
    location: draft.location.trim() || null,
    notes: draft.notes.trim() || null,
    providerName: draft.providerName.trim() || null,
    title,
  };

  if (!includeStatus) {
    return payload;
  }

  return {
    ...payload,
    status: draft.status.trim() || "scheduled",
  };
}

function appendSuggestion(currentValue: string, suggestion: string) {
  const normalizedCurrent = currentValue.trim();

  if (!normalizedCurrent) {
    return suggestion;
  }

  if (normalizedCurrent.includes(suggestion)) {
    return normalizedCurrent;
  }

  return `${normalizedCurrent} ${suggestion}`;
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

function TextField(props: {
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  listId?: string;
  min?: number | string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  step?: number | string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{props.label}</span>
      <input
        disabled={props.disabled}
        inputMode={props.inputMode}
        list={props.listId}
        min={props.min}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        required={props.required}
        step={props.step}
        type={props.type ?? "text"}
        value={props.value}
        className="medic-field"
      />
    </label>
  );
}

function SelectField(props: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{props.label}</span>
      <select
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
        value={props.value}
        className="medic-field"
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField(props: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{props.label}</span>
      <textarea
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        value={props.value}
        className="medic-field min-h-28"
      />
    </label>
  );
}

function SuggestionChips(props: {
  disabled?: boolean;
  label: string;
  onSelect: (value: string) => void;
  suggestions: readonly string[];
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{props.label}</span>
      <div className="flex flex-wrap gap-2">
        {props.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={props.disabled}
            onClick={() => props.onSelect(suggestion)}
            className="medic-button px-3 py-1 text-xs"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function WeekdaySelector(props: {
  disabled?: boolean;
  onToggle: (day: string) => void;
  value: string[];
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">Select days</span>
      <div className="flex flex-wrap gap-2">
        {WEEKDAY_OPTIONS.map((day) => {
          const isSelected = props.value.includes(day);

          return (
            <button
              key={day}
              type="button"
              disabled={props.disabled}
              onClick={() => props.onToggle(day)}
              className={`min-w-12 rounded-full border px-3 py-2 text-xs font-semibold tracking-[0.12em] transition ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--foreground)]"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusRadioGroup(props: {
  disabled?: boolean;
  name: string;
  onChange: (value: string) => void;
  options: typeof APPOINTMENT_STATUS_OPTIONS;
  value: string;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium text-[var(--foreground)]">Status</legend>
      <div className="grid gap-3 md:grid-cols-3">
        {props.options.map((option) => {
          const isSelected = props.value === option.value;

          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-3xl border p-4 transition ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[rgba(92,139,107,0.08)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-muted)]"
              } ${props.disabled ? "cursor-not-allowed opacity-70" : ""}`}
            >
              <div className="flex items-start gap-3">
                <input
                  checked={isSelected}
                  disabled={props.disabled}
                  name={props.name}
                  onChange={() => props.onChange(option.value)}
                  type="radio"
                  value={option.value}
                  className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {option.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-muted-foreground)]">
                    {option.description}
                  </p>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function RoutineFormFields(props: {
  draft: RoutineDraft;
  formIdPrefix: string;
  pending: boolean;
  setDraft: Dispatch<SetStateAction<RoutineDraft>>;
}) {
  const frequencyOption =
    ROUTINE_FREQUENCY_OPTIONS.find((option) => option.value === props.draft.frequencyType) ??
    ROUTINE_FREQUENCY_OPTIONS[0];
  const selectedDays = getRoutineDaysForFrequency(props.draft);
  const needsManualDaySelection =
    props.draft.frequencyType === "weekly" || props.draft.frequencyType === "custom";

  return (
    <div className="grid gap-4">
      <TextField
        disabled={props.pending}
        label="Routine title"
        onChange={(value) =>
          props.setDraft((current) => ({
            ...current,
            title: value,
          }))
        }
        placeholder="Morning walk"
        required
        value={props.draft.title}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <TextField
            disabled={props.pending}
            label="Category"
            listId={`${props.formIdPrefix}-routine-categories`}
            onChange={(value) =>
              props.setDraft((current) => ({
                ...current,
                category: value,
              }))
            }
            placeholder="Walking"
            required
            value={props.draft.category}
          />
          <datalist id={`${props.formIdPrefix}-routine-categories`}>
            {ROUTINE_CATEGORY_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </div>

        <div className="grid gap-2">
          <SelectField
            disabled={props.pending}
            label="Frequency"
            onChange={(value) =>
              props.setDraft((current) => ({
                ...current,
                daysOfWeek:
                  value === "daily"
                    ? [...EVERY_DAY]
                    : value === "weekdays"
                      ? [...WEEKDAY_ONLY]
                      : current.daysOfWeek.length > 0
                        ? current.daysOfWeek
                        : ["Mon"],
                frequencyType: value,
              }))
            }
            options={ROUTINE_FREQUENCY_OPTIONS.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            value={props.draft.frequencyType}
          />
          <p className="text-xs leading-5 text-[var(--color-muted-foreground)]">
            {frequencyOption.description}
          </p>
        </div>

        <TextField
          disabled={props.pending}
          inputMode="numeric"
          label="Target minutes"
          min={1}
          onChange={(value) =>
            props.setDraft((current) => ({
              ...current,
              targetMinutes: value,
            }))
          }
          placeholder="20"
          step={1}
          type="number"
          value={props.draft.targetMinutes}
        />
      </div>

      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Routine days</p>
            <p className="text-xs leading-5 text-[var(--color-muted-foreground)]">
              {needsManualDaySelection
                ? "Choose the weekdays that should show this routine."
                : "The day pattern follows the selected frequency."}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            {formatRoutineDaySummary(selectedDays)}
          </span>
        </div>

        {needsManualDaySelection ? (
          <div className="mt-4">
            <WeekdaySelector
              disabled={props.pending}
              onToggle={(day) =>
                props.setDraft((current) => ({
                  ...current,
                  daysOfWeek: current.daysOfWeek.includes(day)
                    ? current.daysOfWeek.filter((item) => item !== day)
                    : [...current.daysOfWeek, day],
                }))
              }
              value={props.draft.daysOfWeek}
            />
          </div>
        ) : null}
      </div>

      <SuggestionChips
        disabled={props.pending}
        label="Quick instruction starters"
        onSelect={(value) =>
          props.setDraft((current) => ({
            ...current,
            instructions: appendSuggestion(current.instructions, value),
          }))
        }
        suggestions={ROUTINE_INSTRUCTION_STARTERS}
      />

      <TextAreaField
        disabled={props.pending}
        label="Instructions"
        onChange={(value) =>
          props.setDraft((current) => ({
            ...current,
            instructions: value,
          }))
        }
        placeholder="Add reminders, safety notes, or pacing guidance."
        value={props.draft.instructions}
      />
    </div>
  );
}

function AppointmentFormFields(props: {
  draft: AppointmentDraft;
  formIdPrefix: string;
  includeStatus: boolean;
  pending: boolean;
  setDraft: Dispatch<SetStateAction<AppointmentDraft>>;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <TextField
          disabled={props.pending}
          label="Appointment title"
          listId={`${props.formIdPrefix}-appointment-titles`}
          onChange={(value) =>
            props.setDraft((current) => ({
              ...current,
              title: value,
            }))
          }
          placeholder="Follow-up visit"
          required
          value={props.draft.title}
        />
        <datalist id={`${props.formIdPrefix}-appointment-titles`}>
          {APPOINTMENT_TITLE_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>

      <SuggestionChips
        disabled={props.pending}
        label="Quick visit types"
        onSelect={(value) =>
          props.setDraft((current) => ({
            ...current,
            title: value,
          }))
        }
        suggestions={APPOINTMENT_TITLE_SUGGESTIONS}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          disabled={props.pending}
          label="Provider"
          onChange={(value) =>
            props.setDraft((current) => ({
              ...current,
              providerName: value,
            }))
          }
          placeholder="Dr. Caldera"
          value={props.draft.providerName}
        />
        <TextField
          disabled={props.pending}
          label="Location"
          onChange={(value) =>
            props.setDraft((current) => ({
              ...current,
              location: value,
            }))
          }
          placeholder="Albuquerque Medical Center"
          value={props.draft.location}
        />
        <TextField
          disabled={props.pending}
          label="Appointment date"
          onChange={(value) =>
            props.setDraft((current) => ({
              ...current,
              appointmentDate: value,
            }))
          }
          required
          type="date"
          value={props.draft.appointmentDate}
        />
        <TextField
          disabled={props.pending}
          label="Appointment time"
          onChange={(value) =>
            props.setDraft((current) => ({
              ...current,
              appointmentTime: value,
            }))
          }
          required
          type="time"
          value={props.draft.appointmentTime}
        />
      </div>

      {props.includeStatus ? (
        <StatusRadioGroup
          disabled={props.pending}
          name={`${props.formIdPrefix}-appointment-status`}
          onChange={(value) =>
            props.setDraft((current) => ({
              ...current,
              status: value,
            }))
          }
          options={APPOINTMENT_STATUS_OPTIONS}
          value={props.draft.status}
        />
      ) : (
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-6 text-[var(--color-muted-foreground)]">
          New appointments are saved as <strong className="text-[var(--foreground)]">Scheduled</strong>.
        </div>
      )}

      <TextAreaField
        disabled={props.pending}
        label="Notes"
        onChange={(value) =>
          props.setDraft((current) => ({
            ...current,
            notes: value,
          }))
        }
        placeholder="Add preparation notes, what to bring, or transport reminders."
        value={props.draft.notes}
      />
    </div>
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
  const [createRoutineDraftState, setCreateRoutineDraftState] = useState<RoutineDraft>(() =>
    createRoutineDraft(),
  );
  const createRoutineSectionRef = useRef<HTMLElement | null>(null);
  const [createAppointmentDraftState, setCreateAppointmentDraftState] =
    useState<AppointmentDraft>(() => createAppointmentDraft());
  const [routineDraft, setRoutineDraft] = useState<RoutineDraft>(() => createRoutineDraft());
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentDraft>(() =>
    createAppointmentDraft(),
  );

  const activePlans = activityPlans.filter((item) => item.isActive);
  const archivedPlans = activityPlans.filter((item) => !item.isActive);

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

  async function handleCreateRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        "/api/activities",
        "POST",
        {
          ...buildRoutinePayload(createRoutineDraftState),
          patientUserId,
        },
        "Unable to create activity plan.",
      );

      setCreateRoutineDraftState(createRoutineDraft());
      setMessage("Routine added.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create activity plan.",
      );
    } finally {
      setPending(false);
    }
  }

  async function applyAiRoutine(routine: WellnessRoutineSuggestion) {
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        "/api/activities",
        "POST",
        {
          ...buildRoutinePayload(createRoutineDraftFromSuggestion(routine)),
          patientUserId,
        },
        "Unable to create activity plan.",
      );

      setCreateRoutineDraftState(createRoutineDraft());
      setMessage("AI routine added.");
      router.refresh();
    } catch (error) {
      const resolvedMessage =
        error instanceof Error ? error.message : "Unable to create activity plan.";
      setMessage(resolvedMessage);
      throw error;
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
          ...buildRoutinePayload(routineDraft),
          patientUserId,
        },
        "Unable to update routine.",
      );

      setEditingRoutineId(null);
      setRoutineDraft(createRoutineDraft());
      setMessage("Routine updated.");
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
      setMessage("Routine archived.");
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
      setMessage(
        status === "done" ? "Routine marked done." : "Routine marked missed.",
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

  async function handleCreateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    try {
      await runRequest(
        "/api/appointments",
        "POST",
        {
          ...buildAppointmentPayload(createAppointmentDraftState, false),
          patientUserId,
        },
        "Unable to create appointment.",
      );

      setCreateAppointmentDraftState(createAppointmentDraft());
      setMessage("Appointment added.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create appointment.");
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
          ...buildAppointmentPayload(appointmentDraft, true),
          patientUserId,
        },
        "Unable to update appointment.",
      );

      setEditingAppointmentId(null);
      setAppointmentDraft(createAppointmentDraft());
      setMessage("Appointment updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update appointment.");
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
      setMessage("Appointment cancelled.");
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
          <MetricCard label="Completed today" value={String(activitySummary.completedToday)} />
          <MetricCard label="Missed today" value={String(activitySummary.missedToday)} />
        </section>
      ) : null}

      <WellnessAiPanel
        canManage={canManage}
        onApplyRoutine={applyAiRoutine}
        onLoadRoutineDraft={(routine) => {
          setCreateRoutineDraftState(createRoutineDraftFromSuggestion(routine));
          requestAnimationFrame(() => {
            const section = createRoutineSectionRef.current;

            if (section && typeof section.scrollIntoView === "function") {
              section.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          });
        }}
        onNotice={(nextMessage) => setMessage(nextMessage)}
        patientUserId={patientUserId}
      />

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
                      <RoutineFormFields
                        draft={routineDraft}
                        formIdPrefix={`edit-routine-${item.id}`}
                        pending={pending}
                        setDraft={setRoutineDraft}
                      />
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
                          onClick={() => {
                            setEditingRoutineId(null);
                            setRoutineDraft(createRoutineDraft());
                          }}
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
                          {formatStatusLabel(item.category)} /{" "}
                          {formatStatusLabel(item.frequencyType)} /{" "}
                          {formatRoutineDaySummary(item.daysOfWeek)}
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
                      <AppointmentFormFields
                        draft={appointmentDraft}
                        formIdPrefix={`edit-appointment-${item.id}`}
                        includeStatus
                        pending={pending}
                        setDraft={setAppointmentDraft}
                      />
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
                          onClick={() => {
                            setEditingAppointmentId(null);
                            setAppointmentDraft(createAppointmentDraft());
                          }}
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
          <section
            ref={createRoutineSectionRef}
            className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Add routine
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
              Set the routine type, choose the day pattern, and add clear instructions in a
              guided layout.
            </p>
            <form onSubmit={handleCreateRoutine} className="mt-5 grid gap-4">
              <RoutineFormFields
                draft={createRoutineDraftState}
                formIdPrefix="create-routine"
                pending={pending}
                setDraft={setCreateRoutineDraftState}
              />
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
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
              Enter the visit with separate date and time fields, plus quick visit presets for
              faster scheduling.
            </p>
            <form onSubmit={handleCreateAppointment} className="mt-5 grid gap-4">
              <AppointmentFormFields
                draft={createAppointmentDraftState}
                formIdPrefix="create-appointment"
                includeStatus={false}
                pending={pending}
                setDraft={setCreateAppointmentDraftState}
              />
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
                  {formatStatusLabel(item.category)} / {formatStatusLabel(item.frequencyType)}
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
