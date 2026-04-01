import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  createActivityPlan,
  listActivityPlansForPatient,
} from "@/lib/db/medic-data";
import { getOptionalString, getRequiredString, getStringArray } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = await requirePatientScope(searchParams.get("patientId"));

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
      typeof body.patientUserId === "string" ? body.patientUserId : null,
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
      category: getRequiredString(body.category, "Category"),
      createdByUserId: scope.user.userId,
      daysOfWeek: getStringArray(body.daysOfWeek),
      frequencyType: getRequiredString(body.frequencyType, "Frequency"),
      instructions: getOptionalString(body.instructions),
      patientUserId: scope.patientUserId,
      targetMinutes:
        typeof body.targetMinutes === "number" ? body.targetMinutes : null,
      title: getRequiredString(body.title, "Title"),
    });

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
