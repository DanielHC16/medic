import { requirePatientScope } from "@/lib/auth/dal";
import { pullPatientSyncPayload } from "@/lib/db/medic-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    patientUserId?: string | null;
  };
  const scope = await requirePatientScope(body.patientUserId);

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
