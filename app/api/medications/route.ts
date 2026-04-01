import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  createMedicationWithSchedule,
  listMedicationsForPatient,
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
      typeof body.patientUserId === "string" ? body.patientUserId : null,
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
      daysOfWeek: getStringArray(body.daysOfWeek),
      dosageUnit: getOptionalString(body.dosageUnit),
      dosageValue: getRequiredString(body.dosageValue, "Dosage value"),
      form: getRequiredString(body.form, "Medication form"),
      frequencyType: getRequiredString(body.frequencyType, "Frequency"),
      instructions: getOptionalString(body.instructions),
      name: getRequiredString(body.name, "Medication name"),
      patientUserId: scope.patientUserId,
      timesOfDay: getStringArray(body.timesOfDay),
    });

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
