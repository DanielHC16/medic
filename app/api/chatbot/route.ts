import { requireRole } from "@/lib/auth/dal";
import { getErrorMessage } from "@/lib/api/errors";
import {
  buildPatientChatbotSuggestions,
  buildPatientChatbotWelcome,
  type PatientChatMessage,
} from "@/lib/chatbot-ai-shared";
import { generatePatientChatReply } from "@/lib/chatbot-ai";
import {
  getActivitySummary,
  getMedicationAdherenceSummary,
  getPatientDashboardData,
  listActivityLogsForPatient,
  listMedicationLogsForPatient,
} from "@/lib/db/medic-data";
import { getOptionalString } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const user = await requireRole("patient");
    const context = await getChatContext(user.userId);

    return Response.json(
      {
        enabled: user.preferences.chatbotEnabled,
        ok: true,
        suggestions: user.preferences.chatbotEnabled
          ? buildPatientChatbotSuggestions(context)
          : [],
        welcomeMessage: user.preferences.chatbotEnabled
          ? buildPatientChatbotWelcome(context)
          : "The chatbot is currently disabled in settings.",
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  } catch (error) {
    return Response.json(
      {
        message: getErrorMessage(error),
        ok: false,
      },
      {
        headers: NO_STORE_HEADERS,
        status: 400,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("patient");

    if (!user.preferences.chatbotEnabled) {
      return Response.json(
        {
          message: "Enable the chatbot in settings before starting a conversation.",
          ok: false,
        },
        {
          headers: NO_STORE_HEADERS,
          status: 403,
        },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const messages = sanitizeMessages(body.messages);

    if (!messages.some((message) => message.role === "user")) {
      return Response.json(
        {
          message: "A user message is required to continue the chat.",
          ok: false,
        },
        {
          headers: NO_STORE_HEADERS,
          status: 400,
        },
      );
    }

    const context = await getChatContext(user.userId);
    const response = await generatePatientChatReply(context, messages);

    return Response.json(
      {
        ...response,
        ok: true,
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  } catch (error) {
    return Response.json(
      {
        message: getErrorMessage(error),
        ok: false,
      },
      {
        headers: NO_STORE_HEADERS,
        status: 400,
      },
    );
  }
}

async function getChatContext(patientUserId: string) {
  const [dashboard, medicationSummary, activitySummary, activityLogs, medicationLogs] =
    await Promise.all([
      getPatientDashboardData(patientUserId),
      getMedicationAdherenceSummary(patientUserId),
      getActivitySummary(patientUserId),
      listActivityLogsForPatient(patientUserId, 8),
      listMedicationLogsForPatient(patientUserId, 8),
    ]);

  if (!dashboard) {
    throw new Error("Unable to load the patient data needed for the chatbot.");
  }

  return {
    activityLogs,
    activityPlans: dashboard.activityPlans,
    activitySummary,
    appointments: dashboard.appointments,
    careCircle: dashboard.careCircle,
    medicationLogs,
    medicationSummary,
    medications: dashboard.medications,
    patientProfile: dashboard.patientProfile,
    user: dashboard.user,
  };
}

function sanitizeMessages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const sanitized = value
    .map((message) => {
      if (!message || typeof message !== "object") {
        return null;
      }

      const role =
        (message as { role?: unknown }).role === "assistant" ? "assistant" : "user";
      const content = getOptionalString((message as { content?: unknown }).content);

      if (!content) {
        return null;
      }

      return {
        content: content.slice(0, 1200),
        role,
      } satisfies PatientChatMessage;
    })
    .filter((message): message is PatientChatMessage => message !== null);

  return sanitized.slice(-8);
}
