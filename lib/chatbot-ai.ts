import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

import { getErrorMessage } from "@/lib/api/errors";
import {
  buildFallbackPatientChatReply,
  buildPatientChatbotSuggestions,
  type PatientChatContext,
  type PatientChatMessage,
} from "@/lib/chatbot-ai-shared";
import { getGeminiApiKey, getGeminiModel } from "@/lib/env";
import { collapseWhitespace } from "@/lib/wellness-ai-shared";

export async function generatePatientChatReply(
  context: PatientChatContext,
  conversation: PatientChatMessage[],
) {
  const fallback = buildFallbackPatientChatReply(context, conversation);

  try {
    const model = createChatModel();
    const result = await generateContentWithRetry(
      model,
      buildChatPrompt(context, conversation),
    );
    const reply = resolveChatReply(result.response.text(), fallback.reply);

    return {
      generatedAt: new Date().toISOString(),
      reply,
      source: "gemini",
      suggestions: buildPatientChatbotSuggestions(context),
    };
  } catch (error) {
    return {
      ...fallback,
      message: describeChatFallback(error),
    };
  }
}

function createChatModel() {
  const client = new GoogleGenerativeAI(getGeminiApiKey());

  return client.getGenerativeModel({
    generationConfig: {
      maxOutputTokens: 500,
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
      "You are Medic AI, a patient-facing assistant inside a medication and wellness app.",
      "Answer only from the supplied patient data and conversation.",
      "Do not invent diagnoses, symptoms, vitals, clinician instructions, or medication changes.",
      "Do not tell the patient to stop or start medications.",
      "Keep the response practical, calm, and easy to read on mobile.",
      "If the patient asks something outside the available data, say what you can confirm from MEDIC and suggest checking with their clinician or caregiver when appropriate.",
      "Return plain text only.",
    ].join(" "),
  });
}

function buildChatPrompt(
  context: PatientChatContext,
  conversation: PatientChatMessage[],
) {
  const promptContext = {
    activityLogs: context.activityLogs.slice(0, 6).map((log) => ({
      completedAt: log.completedAt,
      notes: log.notes,
      status: log.completionStatus,
      title: log.activityTitle,
    })),
    activityPlans: context.activityPlans.slice(0, 8).map((plan) => ({
      category: plan.category,
      daysOfWeek: plan.daysOfWeek,
      frequencyType: plan.frequencyType,
      instructions: plan.instructions,
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
    medicationLogs: context.medicationLogs.slice(0, 8).map((log) => ({
      medicationName: log.medicationName,
      notes: log.notes,
      scheduledFor: log.scheduledFor,
      status: log.status,
      takenAt: log.takenAt,
    })),
    medicationSummary: context.medicationSummary,
    medications: context.medications.slice(0, 10).map((medication) => ({
      instructions: medication.instructions,
      latestLogStatus: medication.latestLogStatus,
      latestTakenAt: medication.latestTakenAt,
      name: medication.name,
      scheduleDays: medication.scheduleDays,
      scheduleTimes: medication.scheduleTimes,
    })),
    patient: {
      assistanceLevel: context.patientProfile?.assistanceLevel,
      dateOfBirth: context.patientProfile?.dateOfBirth,
      emergencyNotes: context.patientProfile?.emergencyNotes,
      firstName: context.user.firstName,
      lastName: context.user.lastName,
    },
    timezone: "Asia/Manila",
    today: new Date().toISOString(),
  };

  return [
    "Task: answer the patient's latest message using only the current MEDIC data.",
    "Keep the reply to one short paragraph or two short paragraphs at most.",
    "If medications need attention, say that clearly.",
    "If there is an appointment coming up, mention it only when relevant to the question.",
    "",
    "Patient data:",
    JSON.stringify(promptContext, null, 2),
    "",
    "Conversation:",
    JSON.stringify(conversation.slice(-8), null, 2),
  ].join("\n");
}

async function generateContentWithRetry(
  model: ReturnType<typeof createChatModel>,
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
    message.includes("429") ||
    message.includes("503") ||
    message.includes("quota") ||
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

function resolveChatReply(value: string, fallback: string) {
  const reply = collapseWhitespace(value);

  return reply || fallback;
}

function describeChatFallback(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes("429") || message.includes("quota")) {
    return "Medic AI is answering from your current app data while Gemini is rate-limited.";
  }

  if (message.includes("503") || message.includes("service unavailable")) {
    return "Medic AI is answering from your current app data while Gemini is temporarily unavailable.";
  }

  return "Medic AI is answering from your current app data while Gemini is unavailable.";
}
