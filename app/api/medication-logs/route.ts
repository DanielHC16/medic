import {
  canManagePatientData,
  requirePatientScope,
} from "@/lib/auth/dal";
import {
  listMedicationLogsForPatient,
  recordMedicationLog,
} from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import type { MedicationLogStatus } from "@/lib/medic-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = await requirePatientScope(searchParams.get("patientId"));

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

function getMedicationLogStatus(value: unknown): MedicationLogStatus {
  return value === "missed" || value === "skipped" || value === "queued_offline"
    ? value
    : "taken";
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
      status?: MedicationLogStatus;
      takenAt?: string | null;
    };
    const scope = await requirePatientScope(body.patientUserId);
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
      clientRef: body.clientRef,
      localDate: body.localDate,
      medicationId: body.medicationId ?? "",
      notes: body.notes,
      patientUserId: scope.patientUserId,
      recordedByUserId: scope.user.userId,
      scheduleId: body.scheduleId,
      scheduledFor: body.scheduledFor,
      status,
      takenAt:
        status === "taken" ? body.takenAt ?? new Date().toISOString() : body.takenAt ?? null,
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
