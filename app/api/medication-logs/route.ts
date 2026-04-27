import {
  canManagePatientData,
  requirePatientScope,
} from "@/lib/auth/dal";
import {
  listMedicationLogsForPatient,
  recordMedicationLog,
} from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import {
  getDateOnly,
  getEntityId,
  getMedicationLogStatus,
  getOptionalDateTime,
  getOptionalString,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = await requirePatientScope(
      getEntityId(searchParams.get("patientId"), "Patient", { required: false }),
    );

    if (!scope.patientUserId) {
      return Response.json({ logs: [], ok: true });
    }

    const logs = await listMedicationLogsForPatient(scope.patientUserId, 50);
    return Response.json({ logs, ok: true });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Failed to fetch logs.", ok: false },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clientRef?: string | null;
      localDate?: string | null;
      medicationId?: string;
      notes?: string | null;
      patientUserId?: string | null;
      scheduleId?: string | null;
      scheduledFor?: string | null;
      status?: unknown;
      takenAt?: string | null;
    };
    const scope = await requirePatientScope(
      getEntityId(body.patientUserId, "Patient", { required: false }),
    );
    const status = getMedicationLogStatus(body.status);

    if (!scope.patientUserId || !canManagePatientData(scope.user.role)) {
      return Response.json(
        {
          message: "You do not have permission to record medication logs here.",
          ok: false,
        },
        { status: 403 },
      );
    }

    const logId = await recordMedicationLog({
      clientRef: getEntityId(body.clientRef, "Client reference", { required: false }),
      localDate: getDateOnly(body.localDate, "Local date", { required: false }),
      medicationId: getEntityId(body.medicationId, "Medication"),
      notes: getOptionalString(body.notes, "Notes", 1000),
      patientUserId: scope.patientUserId,
      recordedByUserId: scope.user.userId,
      scheduleId: getEntityId(body.scheduleId, "Schedule", { required: false }),
      scheduledFor: getOptionalDateTime(body.scheduledFor, "Scheduled time"),
      status,
      takenAt:
        status === "taken"
          ? getOptionalDateTime(body.takenAt, "Taken time") ?? new Date().toISOString()
          : getOptionalDateTime(body.takenAt, "Taken time"),
    });

    revalidateMedicAppPaths();

    return Response.json({
      logId,
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to record medication log.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
