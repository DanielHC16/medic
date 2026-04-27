import { requireRole } from "@/lib/auth/dal";
import { getCareMemberDashboardData } from "@/lib/db/medic-data";
import { getEntityId } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireRole("caregiver");
  const { searchParams } = new URL(request.url);
  const data = await getCareMemberDashboardData({
    patientUserId: getEntityId(searchParams.get("patientId"), "Patient", {
      required: false,
    }),
    userId: user.userId,
  });

  return Response.json({
    data,
    ok: true,
  });
}
