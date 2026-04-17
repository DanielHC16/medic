import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  archiveMedication,
  updateMedicationWithSchedule,
} from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import {
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
          message: "You do not have permission to update this medication.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await updateMedicationWithSchedule({
      daysOfWeek: getStringArray(body.daysOfWeek),
      dosageUnit: getOptionalString(body.dosageUnit),
      dosageValue: getRequiredString(body.dosageValue, "Dosage value"),
      form: getRequiredString(body.form, "Medication form"),
      frequencyType: getRequiredString(body.frequencyType, "Frequency"),
      instructions: getOptionalString(body.instructions),
      medicationId: id,
      name: getRequiredString(body.name, "Medication name"),
      patientUserId: scope.patientUserId,
      timesOfDay: getStringArray(body.timesOfDay),
    });

    revalidateMedicAppPaths();

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to update medication.",
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
          message: "You do not have permission to archive this medication.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await archiveMedication({
      medicationId: id,
      patientUserId: scope.patientUserId,
    });

    revalidateMedicAppPaths();

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to archive medication.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
