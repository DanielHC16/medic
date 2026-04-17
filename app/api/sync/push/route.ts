import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import { pushMedicationSyncOperations } from "@/lib/db/medic-data";
import type { SyncPushOperation } from "@/lib/medic-types";
import { revalidateMedicAppPaths } from "@/lib/revalidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      deviceId?: string | null;
      operations?: SyncPushOperation[];
      patientUserId?: string | null;
    };
    const scope = await requirePatientScope(body.patientUserId);

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
      deviceId: body.deviceId,
      operations: Array.isArray(body.operations) ? body.operations : [],
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
