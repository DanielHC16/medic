import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import { getErrorMessage } from "@/lib/api/errors";
import {
  getActivitySummary,
  getMedicationAdherenceSummary,
  getPatientDashboardData,
  listActivityLogsForPatient,
} from "@/lib/db/medic-data";
import { getEntityId, getOptionalString } from "@/lib/validation";
import { generateWellnessInsight } from "@/lib/wellness-ai";
import type { WellnessGenerationInput } from "@/lib/wellness-ai-shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSIGHT_CACHE_TTL_MS = 2 * 60 * 1000;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};
const insightCache = new Map<
  string,
  {
    expiresAt: number;
    value: Awaited<ReturnType<typeof generateWellnessInsight>>;
  }
>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = await requirePatientScope(
      getEntityId(searchParams.get("patientId"), "Patient", { required: false }),
    );

    if (!scope.patientUserId) {
      return Response.json(
        {
          message: "No patient is available for wellness recommendations.",
          ok: false,
        },
        { status: 404 },
      );
    }

    const insight = await generateInsight(scope.patientUserId, {
      requestType: "recommendation",
    });

    return Response.json({
      ...insight,
      ok: true,
    }, {
      headers: NO_STORE_HEADERS,
    });
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
    const body = (await request.json()) as Record<string, unknown>;
    const scope = await requirePatientScope(
      getEntityId(body.patientUserId, "Patient", { required: false }),
    );

    if (!scope.patientUserId || !canManagePatientData(scope.user.role)) {
      return Response.json(
        {
          message: "You do not have permission to generate routines for this patient.",
          ok: false,
        },
        { status: 403 },
      );
    }

    const userPrompt = getOptionalString(body.userPrompt, "Routine prompt", 600);
    const insight = await generateInsight(scope.patientUserId, {
      requestType: "routine",
      userPrompt,
    });

    return Response.json({
      ...insight,
      ok: true,
    }, {
      headers: NO_STORE_HEADERS,
    });
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

async function generateInsight(
  patientUserId: string,
  input: WellnessGenerationInput,
) {
  const [dashboard, medicationSummary, activitySummary, activityLogs] = await Promise.all([
    getPatientDashboardData(patientUserId),
    getMedicationAdherenceSummary(patientUserId),
    getActivitySummary(patientUserId),
    listActivityLogsForPatient(patientUserId, 8),
  ]);

  if (!dashboard) {
    throw new Error("Unable to load the patient data needed for wellness AI.");
  }

  const context = {
    activityLogs,
    activityPlans: dashboard.activityPlans,
    activitySummary,
    appointments: dashboard.appointments,
    careCircle: dashboard.careCircle,
    medicationSummary,
    medications: dashboard.medications,
    patientProfile: dashboard.patientProfile,
    patientUserId,
    user: dashboard.user,
  } as const;
  const cacheKey = JSON.stringify({
    activityLogs: activityLogs.map((log) => ({
      id: log.id,
      notes: log.notes,
      scheduledFor: log.scheduledFor,
      status: log.completionStatus,
      title: log.activityTitle,
    })),
    activitySummary,
    appointments: dashboard.appointments.map((appointment) => ({
      appointmentAt: appointment.appointmentAt,
      id: appointment.id,
      notes: appointment.notes,
      status: appointment.status,
      title: appointment.title,
    })),
    careCircle: dashboard.careCircle,
    input,
    medicationSummary,
    medications: dashboard.medications.map((medication) => ({
      id: medication.id,
      instructions: medication.instructions,
      latestLogStatus: medication.latestLogStatus,
      latestTakenAt: medication.latestTakenAt,
      name: medication.name,
      scheduleTimes: medication.scheduleTimes,
    })),
    patientProfile: dashboard.patientProfile,
    patientUserId,
    userId: dashboard.user.userId,
  });
  const cachedInsight = insightCache.get(cacheKey);

  if (cachedInsight && cachedInsight.expiresAt > Date.now()) {
    return cachedInsight.value;
  }

  const insight = await generateWellnessInsight(context, input);
  insightCache.set(cacheKey, {
    expiresAt: Date.now() + INSIGHT_CACHE_TTL_MS,
    value: insight,
  });

  return insight;
}
