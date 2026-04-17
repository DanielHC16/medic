import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import { recordActivityLog } from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import type { ActivityCompletionStatus } from "@/lib/medic-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCompletionStatus(value: unknown): ActivityCompletionStatus {
  return value === "done" || value === "missed" ? value : "planned";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      activityPlanId?: string;
      notes?: string | null;
      patientUserId?: string | null;
      status?: ActivityCompletionStatus;
    };
    const scope = await requirePatientScope(body.patientUserId);

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
      activityPlanId: body.activityPlanId ?? "",
      completionStatus: getCompletionStatus(body.status),
      notes: body.notes ?? null,
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
