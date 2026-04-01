import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  createAppointment,
  listAppointmentsForPatient,
} from "@/lib/db/medic-data";
import { getOptionalString, getRequiredString } from "@/lib/validation";

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

  const items = await listAppointmentsForPatient(scope.patientUserId);

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
          message: "You do not have permission to add appointments for this patient.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await createAppointment({
      appointmentAt: getRequiredString(body.appointmentAt, "Appointment time"),
      createdByUserId: scope.user.userId,
      location: getOptionalString(body.location),
      notes: getOptionalString(body.notes),
      patientUserId: scope.patientUserId,
      providerName: getOptionalString(body.providerName),
      title: getRequiredString(body.title, "Title"),
    });

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to create appointment.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
