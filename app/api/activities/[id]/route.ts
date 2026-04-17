import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  archiveActivityPlan,
  updateActivityPlan,
} from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import {
  getOptionalNumber,
  getOptionalString,
  getRequiredString,
  getStringArray,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { id } = await context.params;
    const scope = await requirePatientScope(
      typeof body.patientUserId === "string" ? body.patientUserId : null,
    );

    if (!scope.patientUserId || !canManagePatientData(scope.user.role)) {
      return Response.json(
        {
          message: "You do not have permission to update this routine.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await updateActivityPlan({
      activityPlanId: id,
      category: getRequiredString(body.category, "Category"),
      daysOfWeek: getStringArray(body.daysOfWeek),
      frequencyType: getRequiredString(body.frequencyType, "Frequency"),
      instructions: getOptionalString(body.instructions),
      patientUserId: scope.patientUserId,
      targetMinutes: getOptionalNumber(body.targetMinutes),
      title: getRequiredString(body.title, "Title"),
    });

    revalidateMedicAppPaths();

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to update routine.",
        ok: false,
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const scope = await requirePatientScope(searchParams.get("patientId"));

    if (!scope.patientUserId || !canManagePatientData(scope.user.role)) {
      return Response.json(
        {
          message: "You do not have permission to archive this routine.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await archiveActivityPlan({
      activityPlanId: id,
      patientUserId: scope.patientUserId,
    });

    revalidateMedicAppPaths();

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to archive routine.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
