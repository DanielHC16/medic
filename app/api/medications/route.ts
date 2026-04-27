import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  createMedicationWithSchedule,
  listMedicationsForPatient,
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

  const items = await listMedicationsForPatient(scope.patientUserId);

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
          message: "You do not have permission to add medications for this patient.",
          ok: false,
        },
        { status: 403 },
      );
    }

    const medicationId = await createMedicationWithSchedule({
      createdByUserId: scope.user.userId,
      daysOfWeek: getWeekdayArray(body.daysOfWeek),
      dosageUnit: getDosageUnit(body.dosageUnit),
      dosageValue: getDosageValue(body.dosageValue),
      form: getSafeText(body.form, "Medication form", { maxLength: 60 }),
      frequencyType: getMedicationFrequency(body.frequencyType),
      imageDataUrl: getOptionalImageDataUrl(body.imageDataUrl, "Medication image"),
      instructions: getOptionalString(body.instructions, "Instructions", 1000),
      name: getSafeText(body.name, "Medication name", { maxLength: 100, minLength: 2 }),
      patientUserId: scope.patientUserId,
      timesOfDay: getTimeArray(body.timesOfDay),
    });

    revalidateMedicAppPaths();

    return Response.json({
      medicationId,
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to add medication.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
