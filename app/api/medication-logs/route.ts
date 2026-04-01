import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import { recordMedicationLog } from "@/lib/db/medic-data";
import type { MedicationLogStatus } from "@/lib/medic-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clientRef?: string | null;
      medicationId?: string;
      notes?: string | null;
      patientUserId?: string | null;
      scheduleId?: string | null;
      scheduledFor?: string | null;
      status?: MedicationLogStatus;
      takenAt?: string | null;
    };
    const scope = await requirePatientScope(body.patientUserId);

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
      medicationId: body.medicationId ?? "",
      notes: body.notes,
      patientUserId: scope.patientUserId,
      recordedByUserId: scope.user.userId,
      scheduleId: body.scheduleId,
      scheduledFor: body.scheduledFor,
      status: body.status ?? "taken",
      takenAt: body.takenAt ?? new Date().toISOString(),
    });

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
