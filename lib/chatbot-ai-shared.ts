import type {
  ActivityLogRecord,
  ActivityPlanRecord,
  ActivitySummary,
  AppointmentRecord,
  AuthenticatedUser,
  MedicationAdherenceSummary,
  MedicationLogRecord,
  MedicationRecord,
  PatientDashboardData,
  PatientProfile,
} from "@/lib/medic-types";
import { collapseWhitespace, getPatientAge } from "@/lib/wellness-ai-shared";

export type PatientChatMessage = {
  content: string;
  role: "assistant" | "user";
};

export type PatientChatResponse = {
  generatedAt: string;
  message?: string;
  reply: string;
  source: "fallback" | "gemini";
  suggestions: string[];
};

export type PatientChatContext = {
  activityLogs: ActivityLogRecord[];
  activityPlans: ActivityPlanRecord[];
  activitySummary: ActivitySummary;
  appointments: AppointmentRecord[];
  careCircle: PatientDashboardData["careCircle"];
  medicationLogs: MedicationLogRecord[];
  medicationSummary: MedicationAdherenceSummary;
  medications: MedicationRecord[];
  patientProfile: PatientProfile | null;
  user: AuthenticatedUser;
};

export function buildPatientChatbotWelcome(context: PatientChatContext) {
  const patientName = context.user.firstName || "there";
  const nextMedication = selectNextMedication(context.medications);
  const nextAppointment = selectNextAppointment(context.appointments);
  const pieces = [
    `Hi ${patientName}, I can help with your medications, routines, appointments, and health notes using the data already in MEDIC.`,
  ];

  if (nextMedication) {
    pieces.push(
      `Your next medication on file is ${nextMedication.name} at ${formatClockTime(nextMedication.time)}.`,
    );
  }

  if (nextAppointment) {
    pieces.push(
      `You also have ${nextAppointment.title} on ${formatAppointmentDate(nextAppointment.appointmentAt)}.`,
    );
  }

  pieces.push("Try one of the suggested questions or ask me your own.");
  return collapseWhitespace(pieces.join(" "));
}

export function buildPatientChatbotSuggestions(context: PatientChatContext) {
  const suggestions: string[] = [];
  const nextMedication = selectNextMedication(context.medications);
  const nextAppointment = selectNextAppointment(context.appointments);
  const medicationAttentionCount =
    context.medicationSummary.missedToday + context.medicationSummary.skippedToday;

  if (medicationAttentionCount > 0) {
    suggestions.push("Which medication needs attention today?");
  } else if (nextMedication) {
    suggestions.push(`When should I take ${nextMedication.name}?`);
  }

  if (nextAppointment) {
    suggestions.push("How should I prepare for my next appointment?");
  }

  if (context.activityPlans.length > 0) {
    suggestions.push("Which routine should I focus on today?");
  }

  if (context.patientProfile?.emergencyNotes) {
    suggestions.push("What health notes should I keep in mind today?");
  }

  suggestions.push("Give me a quick summary of my day.");

  return Array.from(new Set(suggestions)).slice(0, 4);
}

export function buildFallbackPatientChatReply(
  context: PatientChatContext,
  conversation: PatientChatMessage[],
) {
  const latestUserMessage =
    [...conversation].reverse().find((message) => message.role === "user")?.content ?? "";
  const normalizedQuestion = latestUserMessage.toLowerCase();
  const nextMedication = selectNextMedication(context.medications);
  const nextAppointment = selectNextAppointment(context.appointments);
  const medicationAttentionCount =
    context.medicationSummary.missedToday + context.medicationSummary.skippedToday;
  const age = getPatientAge(context.patientProfile?.dateOfBirth);
  let reply = "I can help you review medications, routines, appointments, and health notes from your current MEDIC data.";

  if (
    includesAny(normalizedQuestion, [
      "med",
      "medicine",
      "medication",
      "pill",
      "dose",
      "take",
    ])
  ) {
    if (medicationAttentionCount > 0) {
      reply = `You have ${medicationAttentionCount} medication entr${
        medicationAttentionCount === 1 ? "y" : "ies"
      } needing attention today. Review those first before assuming the rest of the schedule is complete.`;
    } else if (nextMedication) {
      reply = `${nextMedication.name} is the next scheduled medication in MEDIC at ${formatClockTime(nextMedication.time)}. Keep water nearby and check the reminder before that time.`;
    } else if (context.medications.length > 0) {
      reply = `You have ${context.medications.length} active medication${
        context.medications.length === 1 ? "" : "s"
      } on file, and ${context.medicationSummary.takenToday} taken log${
        context.medicationSummary.takenToday === 1 ? "" : "s"
      } recorded today.`;
    }
  } else if (
    includesAny(normalizedQuestion, [
      "appointment",
      "doctor",
      "visit",
      "clinic",
      "checkup",
      "schedule",
    ])
  ) {
    if (nextAppointment) {
      reply = `${nextAppointment.title} is scheduled for ${formatAppointmentDate(nextAppointment.appointmentAt)}.${nextAppointment.location ? ` The location on file is ${nextAppointment.location}.` : ""}${nextAppointment.notes ? ` Notes say: ${nextAppointment.notes}` : ""}`;
    } else {
      reply = "There are no upcoming appointments on file right now.";
    }
  } else if (
    includesAny(normalizedQuestion, [
      "routine",
      "activity",
      "exercise",
      "walk",
      "stretch",
      "workout",
    ])
  ) {
    const activePlans = context.activityPlans.filter((plan) => plan.isActive);

    if (activePlans.length === 0) {
      reply = "There are no active routines on file right now. You can generate one from the wellness AI panel if needed.";
    } else {
      const firstPlan = activePlans[0];
      reply = `You have ${activePlans.length} active routine${
        activePlans.length === 1 ? "" : "s"
      } and ${context.activitySummary.completedToday} completed today. ${firstPlan.title} is one of the current plans${firstPlan.targetMinutes ? ` with a ${firstPlan.targetMinutes}-minute target` : ""}.`;
    }
  } else if (
    includesAny(normalizedQuestion, [
      "health",
      "note",
      "profile",
      "safety",
      "emergency",
    ])
  ) {
    const assistance = context.patientProfile?.assistanceLevel
      ? context.patientProfile.assistanceLevel.replace(/_/g, " ")
      : "not specified";

    reply = `Your MEDIC profile shows assistance level: ${assistance}.${age ? ` Age on file: ${age}.` : ""}${context.patientProfile?.emergencyNotes ? ` Health notes: ${context.patientProfile.emergencyNotes}` : ""}`;
  } else if (
    includesAny(normalizedQuestion, [
      "help",
      "caregiver",
      "family",
      "care circle",
    ])
  ) {
    reply = `Your care circle currently shows ${context.careCircle.activeCaregivers} active caregiver${
      context.careCircle.activeCaregivers === 1 ? "" : "s"
    }, ${context.careCircle.activeFamilyMembers} active family member${
      context.careCircle.activeFamilyMembers === 1 ? "" : "s"
    }, and ${context.careCircle.pendingRequests} pending request${
      context.careCircle.pendingRequests === 1 ? "" : "s"
    }.`;
  } else {
    const summaryParts: string[] = [];

    if (medicationAttentionCount > 0) {
      summaryParts.push(
        `${medicationAttentionCount} medication entr${
          medicationAttentionCount === 1 ? "y needs" : "ies need"
        } attention today`,
      );
    } else {
      summaryParts.push(
        `${context.medicationSummary.takenToday} medication log${
          context.medicationSummary.takenToday === 1 ? "" : "s"
        } recorded today`,
      );
    }

    if (context.activityPlans.length > 0) {
      summaryParts.push(
        `${context.activitySummary.completedToday} of ${context.activitySummary.activePlans} routines completed`,
      );
    }

    if (nextAppointment) {
      summaryParts.push(`next appointment: ${nextAppointment.title}`);
    }

    reply = `Here is the quick picture from your current data: ${summaryParts.join(", ")}.`;
  }

  return {
    generatedAt: new Date().toISOString(),
    reply: collapseWhitespace(reply),
    source: "fallback",
    suggestions: buildPatientChatbotSuggestions(context),
  } satisfies PatientChatResponse;
}

function includesAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

function selectNextMedication(medications: MedicationRecord[]) {
  return medications
    .flatMap((medication) =>
      medication.scheduleTimes.map((time) => ({
        name: medication.name,
        time,
      })),
    )
    .sort((left, right) => left.time.localeCompare(right.time))[0] ?? null;
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

function formatClockTime(value: string) {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

function formatAppointmentDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Manila",
  }).format(parsed);
}
