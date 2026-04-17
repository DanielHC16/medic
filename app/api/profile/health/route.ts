import { requireRole } from "@/lib/auth/dal";
import { updatePatientHealthProfile } from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import { getOptionalString } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const user = await requireRole("patient");
    const body = (await request.json()) as Record<string, unknown>;

    const profile = await updatePatientHealthProfile({
      assistanceLevel: getOptionalString(body.assistanceLevel),
      dateOfBirth: getOptionalString(body.dateOfBirth),
      emergencyNotes: getOptionalString(body.emergencyNotes),
      patientUserId: user.userId,
    });

    revalidateMedicAppPaths();

    return Response.json({
      ok: true,
      profile,
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update health info.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
