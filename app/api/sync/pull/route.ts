import { requirePatientScope } from "@/lib/auth/dal";
import { pullPatientSyncPayload } from "@/lib/db/medic-data";
import { getEntityId } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    patientUserId?: string | null;
  };
  const scope = await requirePatientScope(
    getEntityId(body.patientUserId, "Patient", { required: false }),
  );

  if (!scope.patientUserId) {
    return Response.json({
      ok: true,
      payload: {
        activityPlans: [],
        appointments: [],
        medications: [],
        recentLogs: [],
      },
    });
  }

  const payload = await pullPatientSyncPayload(scope.patientUserId);

  return Response.json({
    ok: true,
    payload,
  });
}
