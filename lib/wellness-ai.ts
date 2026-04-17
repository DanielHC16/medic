import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";

import { getErrorMessage } from "@/lib/api/errors";
import { getGeminiApiKey, getGeminiModel } from "@/lib/env";
import {
  buildFallbackWellnessInsight,
  collapseWhitespace,
  getPatientAge,
  sanitizeRoutineSuggestion,
  type WellnessAiResponse,
  type WellnessContext,
  type WellnessGenerationInput,
  type WellnessRoutineSuggestionCandidate,
} from "@/lib/wellness-ai-shared";

const GENERIC_PRAISE_PATTERNS = [
  /\bgreat job\b/i,
  /\bgood job\b/i,
  /\bwell done\b/i,
  /\bnice work\b/i,
  /\bexcellent work\b/i,
  /\bwonderful work\b/i,
  /\bkeep up the\b/i,
];

const ACTION_HINTS = [
  "review",
  "confirm",
  "prepare",
  "plan",
  "bring",
  "pause",
  "schedule",
  "hydrate",
  "keep water",
  "check",
];

const RESPONSE_SCHEMA: ResponseSchema = {
  properties: {
    recommendation: {
      description:
        "A short personalized recommendation grounded in the provided patient data.",
      type: SchemaType.STRING,
    },
    routine: {
      nullable: true,
      properties: {
        category: {
          description: "Simple activity category label such as Walking or Mobility.",
          type: SchemaType.STRING,
        },
        daysOfWeek: {
          items: {
            enum: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            format: "enum",
            type: SchemaType.STRING,
          },
          maxItems: 7,
          minItems: 1,
          type: SchemaType.ARRAY,
        },
        frequencyType: {
          description: "One of daily, weekdays, weekly, or custom.",
          type: SchemaType.STRING,
        },
        instructions: {
          description: "Clear plain-language routine instructions with light safety notes.",
          type: SchemaType.STRING,
        },
        targetMinutes: {
          nullable: true,
          type: SchemaType.INTEGER,
        },
        title: {
          description: "Short routine title fit for a button or card title.",
          type: SchemaType.STRING,
        },
        whyItFits: {
          description: "One sentence explaining why this routine matches the patient context.",
          type: SchemaType.STRING,
        },
      },
      required: [
        "title",
        "category",
        "frequencyType",
        "daysOfWeek",
        "instructions",
        "whyItFits",
      ],
      type: SchemaType.OBJECT,
    },
  },
  required: ["recommendation"],
  type: SchemaType.OBJECT,
};

export async function generateWellnessInsight(
  context: WellnessContext,
  input: WellnessGenerationInput,
) {
  const fallback = buildFallbackWellnessInsight(context, input);

  try {
    const model = createWellnessModel();
    const result = await generateContentWithRetry(model, buildPrompt(context, input));
    const parsed = parseGeneratedJson(result.response.text());
    const recommendation = resolveRecommendation(
      parsed.recommendation,
      fallback.recommendation,
      context,
    );
    const routine =
      input.requestType === "routine"
        ? sanitizeRoutineSuggestion(asRoutineCandidate(parsed.routine)) ?? fallback.routine
        : null;

    return {
      generatedAt: new Date().toISOString(),
      recommendation,
      routine,
      source: "gemini",
    } satisfies WellnessAiResponse;
  } catch (error) {
    return {
      ...fallback,
      message: describeWellnessFallback(error),
    } satisfies WellnessAiResponse;
  }
}

function createWellnessModel() {
  const client = new GoogleGenerativeAI(getGeminiApiKey());

  return client.getGenerativeModel({
    generationConfig: {
      maxOutputTokens: 700,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.4,
      topK: 24,
      topP: 0.9,
    },
    model: getGeminiModel(),
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
    systemInstruction: [
      "You are Medic AI, a supportive wellness planning assistant inside a medication and care coordination app.",
      "Use only the supplied patient data. Do not invent diagnoses, symptoms, measurements, or clinician instructions.",
      "Never replace a clinician. Keep the response supportive, practical, and non-alarmist.",
      "Recommendations must stay short and easy to read on a small mobile card.",
      "Do not return praise-only responses.",
      "Every recommendation must include one concrete next step grounded in the patient's live data.",
      "If routine generation is requested, propose only gentle wellness or mobility routines that a patient or caregiver can review and adjust before saving.",
      "When medication attention items or appointments are present, keep routines lighter and mention scheduling around them.",
      "Return JSON only that matches the requested schema.",
    ].join(" "),
  });
}

function buildPrompt(context: WellnessContext, input: WellnessGenerationInput) {
  const promptContext = {
    activityLogs: context.activityLogs.slice(0, 6).map((log) => ({
      completedAt: log.completedAt,
      notes: log.notes,
      scheduledFor: log.scheduledFor,
      status: log.completionStatus,
      title: log.activityTitle,
    })),
    activityPlans: context.activityPlans.slice(0, 8).map((plan) => ({
      category: plan.category,
      daysOfWeek: plan.daysOfWeek,
      frequencyType: plan.frequencyType,
      latestCompletionStatus: plan.latestCompletionStatus,
      targetMinutes: plan.targetMinutes,
      title: plan.title,
    })),
    activitySummary: context.activitySummary,
    appointments: context.appointments.slice(0, 6).map((appointment) => ({
      appointmentAt: appointment.appointmentAt,
      location: appointment.location,
      notes: appointment.notes,
      providerName: appointment.providerName,
      status: appointment.status,
      title: appointment.title,
    })),
    careCircle: context.careCircle,
    medicationSummary: context.medicationSummary,
    medications: context.medications.slice(0, 10).map((medication) => ({
      dosage: `${medication.dosageValue}${medication.dosageUnit ? ` ${medication.dosageUnit}` : ""}`,
      instructions: medication.instructions,
      isActive: medication.isActive,
      latestLogStatus: medication.latestLogStatus,
      latestTakenAt: medication.latestTakenAt,
      name: medication.name,
      scheduleDays: medication.scheduleDays,
      scheduleFrequencyType: medication.scheduleFrequencyType,
      scheduleTimes: medication.scheduleTimes,
    })),
    patient: {
      age: getPatientAge(context.patientProfile?.dateOfBirth),
      assistanceLevel: context.patientProfile?.assistanceLevel,
      dateOfBirth: context.patientProfile?.dateOfBirth,
      emergencyNotes: context.patientProfile?.emergencyNotes,
      firstName: context.user.firstName,
      lastName: context.user.lastName,
      role: context.user.role,
    },
    today: new Date().toISOString(),
    timezone: "Asia/Manila",
    userPrompt: input.userPrompt?.trim() || null,
  };

  if (input.requestType === "routine") {
    return [
      "Task: create a personalized wellness routine and a one-paragraph recommendation for today.",
      "The routine must be easy to add directly into an app form.",
      "Prefer safer, gentler routines when the patient has mobility limitations, missed medications, or nearby appointments.",
      "If the user prompt asks for a focus area, honor it when it still fits the patient context.",
      "Do not write generic encouragement like 'great job' or 'keep up the good work'.",
      "The recommendation must tell the user what to do next today or tonight.",
      "Keep recommendation to 1-2 sentences.",
      "",
      JSON.stringify(promptContext, null, 2),
    ].join("\n");
  }

  return [
    "Task: create only a personalized recommendation for today.",
    "Do not include a routine unless it is truly necessary; if not needed, return routine as null.",
    "Do not write generic praise or encouragement by itself.",
    "Mention a concrete next step such as reviewing a reminder, preparing for an appointment, hydrating, or confirming logs.",
    "Keep the recommendation to 1-2 concise sentences for a mobile dashboard card.",
    "",
    JSON.stringify(promptContext, null, 2),
  ].join("\n");
}

function parseGeneratedJson(text: string) {
  const normalizedText = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  const direct = tryParseJson(normalizedText);

  if (direct) {
    return direct;
  }

  const objectMatch = normalizedText.match(/\{[\s\S]*\}/);

  if (objectMatch) {
    const nested = tryParseJson(objectMatch[0]);

    if (nested) {
      return nested;
    }
  }

  throw new Error("Gemini returned a response that could not be parsed as JSON.");
}

function tryParseJson(text: string) {
  try {
    const parsed = JSON.parse(text) as unknown;

    if (typeof parsed === "string") {
      return tryParseJson(parsed);
    }

    if (parsed && typeof parsed === "object") {
      return parsed as {
        recommendation?: unknown;
        routine?: unknown;
      };
    }

    return null;
  } catch {
    return null;
  }
}

function asRoutineCandidate(value: unknown) {
  return value && typeof value === "object"
    ? (value as WellnessRoutineSuggestionCandidate)
    : null;
}

async function generateContentWithRetry(
  model: ReturnType<typeof createWellnessModel>,
  prompt: string,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;

      if (!isRetryableGeminiError(error) || attempt === 2) {
        throw error;
      }

      await wait((attempt + 1) * 750);
    }
  }

  throw lastError;
}

function isRetryableGeminiError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded")
  );
}

function wait(durationMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function resolveRecommendation(
  value: unknown,
  fallback: string,
  context: WellnessContext,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const recommendation = collapseWhitespace(value);

  if (!recommendation) {
    return fallback;
  }

  if (GENERIC_PRAISE_PATTERNS.some((pattern) => pattern.test(recommendation))) {
    return fallback;
  }

  const lowerRecommendation = recommendation.toLowerCase();
  const medicationNames = context.medications.map((medication) => medication.name.toLowerCase());
  const activityTitles = context.activityPlans.map((plan) => plan.title.toLowerCase());
  const appointmentTitles = context.appointments.map((appointment) => appointment.title.toLowerCase());
  const hasRelevantAnchor =
    /\b\d+\b/.test(recommendation) ||
    lowerRecommendation.includes("medication") ||
    lowerRecommendation.includes("routine") ||
    lowerRecommendation.includes("appointment") ||
    lowerRecommendation.includes("tomorrow") ||
    lowerRecommendation.includes("tonight") ||
    medicationNames.some((name) => lowerRecommendation.includes(name)) ||
    activityTitles.some((title) => lowerRecommendation.includes(title)) ||
    appointmentTitles.some((title) => lowerRecommendation.includes(title));
  const hasAction = ACTION_HINTS.some((hint) => lowerRecommendation.includes(hint));

  if (!hasRelevantAnchor || !hasAction) {
    return fallback;
  }

  return recommendation;
}

function describeWellnessFallback(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes("api key not valid")) {
    return "The Gemini API key in the environment is malformed, so Medic is using a backup recommendation from the patient's current data.";
  }

  if (message.includes("prepayment credits are depleted") || message.includes("billing")) {
    return "The Gemini project has no remaining credits right now, so Medic is using a backup recommendation from the patient's current data.";
  }

  if (message.includes("429") || message.includes("quota")) {
    return "Gemini hit a rate limit, so Medic is using a backup recommendation from the patient's current data.";
  }

  if (message.includes("503") || message.includes("service unavailable")) {
    return "Gemini is temporarily unavailable, so Medic is using a backup recommendation from the patient's current data.";
  }

  return "Gemini is unavailable right now, so Medic is using a backup recommendation from the patient's current data.";
}
