import type {
  ActivityLogRecord,
  ActivityPlanRecord,
  ActivitySummary,
  AppointmentRecord,
  AuthenticatedUser,
  MedicationAdherenceSummary,
  MedicationRecord,
  PatientDashboardData,
  PatientProfile,
} from "@/lib/medic-types";

export const WELLNESS_WEEKDAY_OPTIONS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const WELLNESS_EVERY_DAY = [...WELLNESS_WEEKDAY_OPTIONS];
export const WELLNESS_WEEKDAY_ONLY = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

export type WellnessRoutineFrequency = "custom" | "daily" | "weekdays" | "weekly";

export type WellnessAiSource = "fallback" | "gemini";

export type WellnessRoutineSuggestion = {
  category: string;
  daysOfWeek: string[];
  frequencyType: WellnessRoutineFrequency;
  instructions: string;
  targetMinutes: number | null;
  title: string;
  whyItFits: string;
};

export type WellnessRoutineSuggestionCandidate = Partial<
  Omit<WellnessRoutineSuggestion, "frequencyType" | "targetMinutes">
> & {
  frequencyType?: string | null;
  targetMinutes?: number | string | null;
};

export type WellnessAiResponse = {
  generatedAt: string;
  message?: string;
  recommendation: string;
  routine: WellnessRoutineSuggestion | null;
  source: WellnessAiSource;
};

export type WellnessGenerationInput = {
  requestType: "recommendation" | "routine";
  userPrompt?: string | null;
};

export type WellnessContext = {
  activityLogs: ActivityLogRecord[];
  activityPlans: ActivityPlanRecord[];
  activitySummary: ActivitySummary;
  appointments: AppointmentRecord[];
  careCircle: PatientDashboardData["careCircle"];
  medicationSummary: MedicationAdherenceSummary;
  medications: MedicationRecord[];
  patientProfile: PatientProfile | null;
  patientUserId: string;
  user: AuthenticatedUser;
};

const DAY_ALIASES: Record<string, (typeof WELLNESS_WEEKDAY_OPTIONS)[number]> = {
  fri: "Fri",
  friday: "Fri",
  mon: "Mon",
  monday: "Mon",
  sat: "Sat",
  saturday: "Sat",
  sun: "Sun",
  sunday: "Sun",
  thu: "Thu",
  thur: "Thu",
  thursday: "Thu",
  tue: "Tue",
  tues: "Tue",
  tuesday: "Tue",
  wed: "Wed",
  wednesday: "Wed",
};

const CATEGORY_TITLE_MAP: Record<string, string> = {
  balance: "Balance Reset",
  breathing: "Calm Breathing Reset",
  cardio: "Light Cardio Session",
  mobility: "Mobility Reset",
  rehab: "Guided Rehab Session",
  strength: "Gentle Strength Session",
  stretching: "Daily Stretch Flow",
  walking: "Steady Walk",
  wellness: "Wellness Reset",
  yoga: "Chair Yoga Reset",
};

export function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function getPatientAge(dateOfBirth: string | null | undefined) {
  if (!dateOfBirth) {
    return null;
  }

  const parsed = new Date(`${dateOfBirth}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const monthDelta = now.getMonth() - parsed.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && now.getDate() < parsed.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function normalizeWellnessDay(value: string) {
  return DAY_ALIASES[value.trim().toLowerCase()] ?? null;
}

export function normalizeWellnessDays(values: string[]) {
  const normalized = new Set<(typeof WELLNESS_WEEKDAY_OPTIONS)[number]>();

  for (const value of values) {
    const day = normalizeWellnessDay(value);

    if (day) {
      normalized.add(day);
    }
  }

  return WELLNESS_WEEKDAY_OPTIONS.filter((day) => normalized.has(day));
}

export function normalizeRoutineFrequency(
  value: string | null | undefined,
  daysOfWeek: string[],
): WellnessRoutineFrequency {
  const normalizedValue = value?.trim().toLowerCase();
  const normalizedDays = normalizeWellnessDays(daysOfWeek);

  if (normalizedValue === "daily" || normalizedValue === "every day") {
    return "daily";
  }

  if (normalizedValue === "weekdays" || normalizedValue === "weekday") {
    return "weekdays";
  }

  if (normalizedValue === "weekly" || normalizedValue === "selected days") {
    return "weekly";
  }

  if (
    normalizedValue === "custom" ||
    normalizedValue === "flexible" ||
    normalizedValue === "alternate"
  ) {
    return "custom";
  }

  if (normalizedDays.length === WELLNESS_EVERY_DAY.length) {
    return "daily";
  }

  if (
    normalizedDays.length === WELLNESS_WEEKDAY_ONLY.length &&
    WELLNESS_WEEKDAY_ONLY.every((day) => normalizedDays.includes(day))
  ) {
    return "weekdays";
  }

  if (normalizedDays.length > 0) {
    return "weekly";
  }

  return "custom";
}

export function sanitizeRoutineSuggestion(
  routine: WellnessRoutineSuggestionCandidate | null | undefined,
) {
  if (!routine) {
    return null;
  }

  const title = typeof routine.title === "string" ? collapseWhitespace(routine.title) : "";
  const category =
    typeof routine.category === "string" ? collapseWhitespace(routine.category) : "";
  const instructions =
    typeof routine.instructions === "string"
      ? collapseWhitespace(routine.instructions)
      : "";
  const whyItFits =
    typeof routine.whyItFits === "string" ? collapseWhitespace(routine.whyItFits) : "";

  if (!title || !category) {
    return null;
  }

  const daysOfWeek = normalizeWellnessDays(
    Array.isArray(routine.daysOfWeek)
      ? routine.daysOfWeek.filter((value): value is string => typeof value === "string")
      : [],
  );
  const frequencyType = normalizeRoutineFrequency(routine.frequencyType, daysOfWeek);
  const resolvedDays =
    frequencyType === "daily"
      ? [...WELLNESS_EVERY_DAY]
      : frequencyType === "weekdays"
        ? [...WELLNESS_WEEKDAY_ONLY]
        : daysOfWeek.length > 0
          ? daysOfWeek
          : ["Mon", "Wed", "Fri"];
  const parsedTargetMinutes =
    typeof routine.targetMinutes === "number"
      ? routine.targetMinutes
      : typeof routine.targetMinutes === "string"
        ? Number(routine.targetMinutes)
        : null;
  const targetMinutes =
    parsedTargetMinutes && Number.isFinite(parsedTargetMinutes)
      ? Math.min(Math.max(Math.round(parsedTargetMinutes), 5), 120)
      : null;

  return {
    category,
    daysOfWeek: resolvedDays,
    frequencyType: normalizeRoutineFrequency(frequencyType, resolvedDays),
    instructions:
      instructions || "Keep the pace gentle, pause if dizziness appears, and use support if needed.",
    targetMinutes,
    title,
    whyItFits:
      whyItFits ||
      "This suggestion was matched to the patient's current schedule, activity load, and health notes.",
  } satisfies WellnessRoutineSuggestion;
}

export function buildFallbackWellnessInsight(
  context: WellnessContext,
  input: WellnessGenerationInput,
) {
  const attentionCount =
    context.medicationSummary.missedToday + context.medicationSummary.skippedToday;
  const nextAppointment = selectNextAppointment(context.appointments);
  const nextMedication = selectNextMedicationReminder(context.medications);
  const pendingRoutines = Math.max(
    context.activitySummary.activePlans - context.activitySummary.completedToday,
    0,
  );
  const allMedicationsDone =
    context.medicationSummary.dueToday > 0 &&
    context.medicationSummary.takenToday >= context.medicationSummary.dueToday;
  const allRoutinesDone =
    context.activitySummary.activePlans > 0 &&
    context.activitySummary.completedToday >= context.activitySummary.activePlans;
  const routine =
    input.requestType === "routine"
      ? createFallbackRoutineSuggestion(context, input.userPrompt || "")
      : null;

  let recommendation =
    "Review today's medications, routines, and appointments so the day stays predictable.";

  if (attentionCount > 0) {
    recommendation = `There ${
      attentionCount === 1 ? "is 1 medication entry" : `are ${attentionCount} medication entries`
    } that need attention today. Confirm those logs before adding more activity.`;
  } else if (nextAppointment) {
    recommendation = `Your next appointment is ${formatFallbackDate(nextAppointment.appointmentAt)}. Keep routines light and leave enough time to prepare any notes or medications you need to bring.`;
  } else if (pendingRoutines > 0) {
    recommendation = `There ${
      pendingRoutines === 1 ? "is 1 routine" : `are ${pendingRoutines} routines`
    } still pending today. A short, steady session is better than skipping the whole plan.`;
  } else if (allMedicationsDone && allRoutinesDone) {
    recommendation = nextMedication
      ? `You completed ${context.medicationSummary.takenToday} medication logs and ${context.activitySummary.completedToday} routines today. Tomorrow starts with ${nextMedication.name} at ${formatReminderTime(nextMedication.time)}, so set out water tonight and confirm that reminder before bed.`
      : `You completed ${context.medicationSummary.takenToday} medication logs and ${context.activitySummary.completedToday} routines today. Spend a minute tonight reviewing tomorrow's reminder times and keep water nearby this evening.`;
  } else if (routine) {
    recommendation = `${routine.title} keeps the patient active without overloading the current schedule. Review the draft, then adjust the timing if it needs to fit around medication or transport.`;
  } else if (context.medications.length > 0) {
    recommendation = nextMedication
      ? `Keep hydration nearby and review ${nextMedication.name} at ${formatReminderTime(nextMedication.time)} so tomorrow starts smoothly.`
      : "Keep hydration nearby and review the next medication reminder so tomorrow starts smoothly.";
  }

  return {
    generatedAt: new Date().toISOString(),
    recommendation,
    routine,
    source: "fallback",
  } satisfies WellnessAiResponse;
}

function createFallbackRoutineSuggestion(
  context: WellnessContext,
  userPrompt: string,
) {
  const prompt = userPrompt.toLowerCase();
  const assistance = context.patientProfile?.assistanceLevel ?? "";
  const emergencyNotes = context.patientProfile?.emergencyNotes?.toLowerCase() ?? "";
  const mobilitySensitive =
    assistance === "limited_mobility" ||
    assistance === "caregiver_assistance" ||
    emergencyNotes.includes("wheelchair") ||
    emergencyNotes.includes("balance");
  const category = chooseFallbackCategory(prompt, mobilitySensitive);
  const title = CATEGORY_TITLE_MAP[category] ?? "Personalized Wellness Routine";
  const frequencyType: WellnessRoutineFrequency =
    category === "breathing" || category === "wellness" ? "daily" : "weekdays";
  const daysOfWeek =
    frequencyType === "daily" ? [...WELLNESS_EVERY_DAY] : [...WELLNESS_WEEKDAY_ONLY];
  const targetMinutes =
    category === "breathing" || category === "mobility"
      ? 10
      : category === "walking"
        ? 20
        : 15;
  const timingHint = findBestRoutineTiming(context);
  const instructions = buildFallbackRoutineInstructions({
    context,
    mobilitySensitive,
    targetMinutes,
    timingHint,
  });
  const age = getPatientAge(context.patientProfile?.dateOfBirth);

  return {
    category,
    daysOfWeek,
    frequencyType,
    instructions,
    targetMinutes,
    title,
    whyItFits: collapseWhitespace(
      `${title} matches the patient's ${
        age ? `age (${age})` : "current profile"
      }, assistance level, medication schedule, and current routine load.`,
    ),
  } satisfies WellnessRoutineSuggestion;
}

function chooseFallbackCategory(prompt: string, mobilitySensitive: boolean) {
  if (
    prompt.includes("breath") ||
    prompt.includes("sleep") ||
    prompt.includes("calm") ||
    prompt.includes("stress")
  ) {
    return "breathing";
  }

  if (
    prompt.includes("stretch") ||
    prompt.includes("mobility") ||
    prompt.includes("flex")
  ) {
    return mobilitySensitive ? "mobility" : "stretching";
  }

  if (prompt.includes("balance")) {
    return "balance";
  }

  if (prompt.includes("walk") || prompt.includes("cardio") || prompt.includes("steps")) {
    return mobilitySensitive ? "mobility" : "walking";
  }

  return mobilitySensitive ? "mobility" : "wellness";
}

function buildFallbackRoutineInstructions(input: {
  context: WellnessContext;
  mobilitySensitive: boolean;
  targetMinutes: number;
  timingHint: string;
}) {
  const instructionParts = [
    `Start with ${input.targetMinutes} minutes at an easy pace.`,
    `Plan it ${input.timingHint}.`,
  ];

  if (input.mobilitySensitive) {
    instructionParts.push("Use a stable chair, wall, or caregiver support if balance feels limited.");
  }

  if (input.context.medicationSummary.missedToday + input.context.medicationSummary.skippedToday > 0) {
    instructionParts.push("Confirm any missed or skipped medication logs before starting.");
  }

  if (selectNextAppointment(input.context.appointments)) {
    instructionParts.push("Keep the effort gentle on days with appointments or travel.");
  }

  instructionParts.push("Pause if dizziness, chest discomfort, or unusual pain appears.");

  return collapseWhitespace(instructionParts.join(" "));
}

function findBestRoutineTiming(context: WellnessContext) {
  if (context.medications.some((medication) => medication.scheduleTimes.some((time) => time <= "10:00"))) {
    return "after the morning medications";
  }

  if (context.appointments.some((appointment) => new Date(appointment.appointmentAt).getHours() < 12)) {
    return "later in the afternoon after appointments";
  }

  return "after breakfast or another calm part of the day";
}

function formatFallbackDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "soon";
  }

  return parsed.toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Manila",
  });
}

function selectNextAppointment(appointments: AppointmentRecord[]) {
  const now = new Date();

  return appointments
    .filter((appointment) => {
      if (appointment.status === "cancelled") {
        return false;
      }

      const appointmentDate = new Date(appointment.appointmentAt);

      return (
        !Number.isNaN(appointmentDate.getTime()) &&
        appointmentDate.getTime() >= now.getTime()
      );
    })
    .sort(
      (left, right) =>
        new Date(left.appointmentAt).getTime() - new Date(right.appointmentAt).getTime(),
    )[0] ?? null;
}

function selectNextMedicationReminder(medications: MedicationRecord[]) {
  return medications
    .flatMap((medication) =>
      medication.scheduleTimes.map((time) => ({
        name: medication.name,
        time,
      })),
    )
    .sort((left, right) => left.time.localeCompare(right.time))[0] ?? null;
}

function formatReminderTime(value: string) {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

