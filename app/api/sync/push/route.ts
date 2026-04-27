import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import { pushMedicationSyncOperations } from "@/lib/db/medic-data";
import type { SyncPushOperation } from "@/lib/medic-types";
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      deviceId?: string | null;
      operations?: SyncPushOperation[];
      patientUserId?: string | null;
    };
    const scope = await requirePatientScope(
      getEntityId(body.patientUserId, "Patient", { required: false }),
    );

    if (!scope.patientUserId || !canManagePatientData(scope.user.role)) {
      return Response.json(
        {
          message: "You do not have permission to sync logs for this patient.",
          ok: false,
        },
        { status: 403 },
      );
    }

    const result = await pushMedicationSyncOperations({
      actorUserId: scope.user.userId,
      deviceId: getEntityId(body.deviceId, "Device", { required: false }),
      operations: getSyncOperations(body.operations),
      patientUserId: scope.patientUserId,
    });

    revalidateMedicAppPaths();

    return Response.json({
      ok: true,
      result,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to sync offline operations.",
        ok: false,
      },
      { status: 400 },
    );
  }
}

function getSyncOperations(value: unknown): SyncPushOperation[] {
  if (!Array.isArray(value)) {
    throw new Error("Sync operations must be a valid list.");
  }

  if (value.length > 50) {
    throw new Error("Sync operations must include 50 items or fewer.");
  }

  return value.map((operation, index) => {
    if (!operation || typeof operation !== "object") {
      throw new Error(`Sync operation ${index + 1} must be valid.`);
    }

    const item = operation as Record<string, unknown>;

    return {
      clientRef: getEntityId(item.clientRef, `Sync operation ${index + 1} reference`),
      localDate: getDateOnly(item.localDate, `Sync operation ${index + 1} local date`, {
        required: false,
      }),
      medicationId: getEntityId(item.medicationId, `Sync operation ${index + 1} medication`),
      notes: getOptionalString(item.notes, `Sync operation ${index + 1} notes`, 1000) ?? undefined,
      scheduleId: getEntityId(item.scheduleId, `Sync operation ${index + 1} schedule`, {
        required: false,
      }),
      scheduledFor: getOptionalDateTime(
        item.scheduledFor,
        `Sync operation ${index + 1} scheduled time`,
      ),
      status: getMedicationLogStatus(item.status),
      takenAt: getOptionalDateTime(item.takenAt, `Sync operation ${index + 1} taken time`),
    };
  });
}
