import { requireRole } from "@/lib/auth/dal";
import { getPatientDashboardData } from "@/lib/db/medic-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireRole("patient");
  const data = await getPatientDashboardData(user.userId);

  return Response.json({
    data,
    ok: true,
  });
}
