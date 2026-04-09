import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  cancelAppointment,
  updateAppointment,
} from "@/lib/db/medic-data";
import { getOptionalString, getRequiredString } from "@/lib/validation";

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
          message: "You do not have permission to update this appointment.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await updateAppointment({
      appointmentAt: getRequiredString(body.appointmentAt, "Appointment time"),
      appointmentId: id,
      location: getOptionalString(body.location),
      notes: getOptionalString(body.notes),
      patientUserId: scope.patientUserId,
      providerName: getOptionalString(body.providerName),
      status: getRequiredString(body.status, "Appointment status"),
      title: getRequiredString(body.title, "Title"),
    });

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update appointment.",
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
          message: "You do not have permission to cancel this appointment.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await cancelAppointment({
      appointmentId: id,
      patientUserId: scope.patientUserId,
    });

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to cancel appointment.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
