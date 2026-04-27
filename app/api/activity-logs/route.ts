import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import { recordActivityLog } from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import {
  getActivityCompletionStatus,
  getEntityId,
  getOptionalString,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      activityPlanId?: string;
      notes?: string | null;
      patientUserId?: string | null;
      status?: unknown;
    };
    const scope = await requirePatientScope(
      getEntityId(body.patientUserId, "Patient", { required: false }),
    );

    if (!scope.patientUserId || !canManagePatientData(scope.user.role)) {
      return Response.json(
        {
          message: "You do not have permission to record routine activity here.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await recordActivityLog({
      activityPlanId: getEntityId(body.activityPlanId, "Routine"),
      completionStatus: getActivityCompletionStatus(body.status),
      notes: getOptionalString(body.notes, "Notes", 1000),
      patientUserId: scope.patientUserId,
      recordedByUserId: scope.user.userId,
    });

    revalidateMedicAppPaths();

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to record activity log.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
