import { requireRole } from "@/lib/auth/dal";
import { getCareMemberDashboardData } from "@/lib/db/medic-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireRole("family_member");
  const { searchParams } = new URL(request.url);
  const data = await getCareMemberDashboardData({
    patientUserId: searchParams.get("patientId"),
    userId: user.userId,
  });

  return Response.json({
    data,
    ok: true,
  });
}
