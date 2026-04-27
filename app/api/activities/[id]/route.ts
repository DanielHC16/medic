import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  archiveActivityPlan,
  updateActivityPlan,
} from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import {
  getEntityId,
  getOptionalImageDataUrl,
  getOptionalString,
  getPositiveInteger,
  getRoutineFrequency,
  getSafeText,
  getWeekdayArray,
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
      getEntityId(body.patientUserId, "Patient", { required: false }),
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
      activityPlanId: getEntityId(id, "Routine"),
      category: getSafeText(body.category, "Category", { maxLength: 60 }),
      daysOfWeek: getWeekdayArray(body.daysOfWeek),
      frequencyType: getRoutineFrequency(body.frequencyType),
      imageDataUrl: getOptionalImageDataUrl(body.imageDataUrl, "Routine image"),
      instructions: getOptionalString(body.instructions, "Instructions", 1000),
      patientUserId: scope.patientUserId,
      targetMinutes: getPositiveInteger(body.targetMinutes, "Target minutes", {
        max: 240,
        required: false,
      }),
      title: getSafeText(body.title, "Title", { maxLength: 100, minLength: 2 }),
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
    const scope = await requirePatientScope(
      getEntityId(searchParams.get("patientId"), "Patient", { required: false }),
    );

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
      activityPlanId: getEntityId(id, "Routine"),
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
