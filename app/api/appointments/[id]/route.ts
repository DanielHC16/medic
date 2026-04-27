import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  cancelAppointment,
  updateAppointment,
} from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import {
  getAppointmentStatus,
  getDateTime,
  getEntityId,
  getOptionalImageDataUrl,
  getOptionalString,
  getSafeText,
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
          message: "You do not have permission to update this appointment.",
          ok: false,
        },
        { status: 403 },
      );
    }

    await updateAppointment({
      appointmentAt: getDateTime(body.appointmentAt, "Appointment time"),
      appointmentId: getEntityId(id, "Appointment"),
      imageDataUrl: getOptionalImageDataUrl(body.imageDataUrl, "Appointment image"),
      location: getOptionalString(body.location, "Location", 200),
      notes: getOptionalString(body.notes, "Notes", 1000),
      patientUserId: scope.patientUserId,
      providerName: getOptionalString(body.providerName, "Provider name", 120),
      status: getAppointmentStatus(body.status),
      title: getSafeText(body.title, "Title", { maxLength: 120, minLength: 2 }),
    });

    revalidateMedicAppPaths();

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
    const scope = await requirePatientScope(
      getEntityId(searchParams.get("patientId"), "Patient", { required: false }),
    );

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
      appointmentId: getEntityId(id, "Appointment"),
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
          error instanceof Error ? error.message : "Failed to cancel appointment.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
