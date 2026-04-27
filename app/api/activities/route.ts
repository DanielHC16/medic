import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  createActivityPlan,
  listActivityPlansForPatient,
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = await requirePatientScope(
    getEntityId(searchParams.get("patientId"), "Patient", { required: false }),
  );

  if (!scope.patientUserId) {
    return Response.json({
      items: [],
      ok: true,
    });
  }

  const items = await listActivityPlansForPatient(scope.patientUserId);

  return Response.json({
    items,
    ok: true,
  });
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
          message: "You do not have permission to add routines for this patient.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await createActivityPlan({
      category: getSafeText(body.category, "Category", { maxLength: 60 }),
      createdByUserId: scope.user.userId,
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
        message: error instanceof Error ? error.message : "Failed to create activity plan.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
