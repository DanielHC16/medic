import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  archiveMedication,
  updateMedicationWithSchedule,
} from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import {
  getDosageUnit,
  getDosageValue,
  getEntityId,
  getMedicationFrequency,
  getOptionalImageDataUrl,
  getOptionalString,
  getSafeText,
  getTimeArray,
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
          message: "You do not have permission to update this medication.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await updateMedicationWithSchedule({
      daysOfWeek: getWeekdayArray(body.daysOfWeek),
      dosageUnit: getDosageUnit(body.dosageUnit),
      dosageValue: getDosageValue(body.dosageValue),
      form: getSafeText(body.form, "Medication form", { maxLength: 60 }),
      frequencyType: getMedicationFrequency(body.frequencyType),
      imageDataUrl: getOptionalImageDataUrl(body.imageDataUrl, "Medication image"),
      instructions: getOptionalString(body.instructions, "Instructions", 1000),
      medicationId: getEntityId(id, "Medication"),
      name: getSafeText(body.name, "Medication name", { maxLength: 100, minLength: 2 }),
      patientUserId: scope.patientUserId,
      timesOfDay: getTimeArray(body.timesOfDay),
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
    const scope = await requirePatientScope(
      getEntityId(searchParams.get("patientId"), "Patient", { required: false }),
    );

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
      medicationId: getEntityId(id, "Medication"),
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
