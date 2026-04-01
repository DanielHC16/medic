import { requireCurrentUser } from "@/lib/auth/dal";
import {
  getPatientDashboardData,
  listLinkedPatientsForMember,
  listPatientConnections,
} from "@/lib/db/medic-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireCurrentUser();

  if (user.role === "patient") {
    const [dashboard, connections] = await Promise.all([
      getPatientDashboardData(user.userId),
      listPatientConnections(user.userId),
    ]);

    return Response.json({
      connections,
      ok: true,
      patient: dashboard,
    });
  }

  const linkedPatients = await listLinkedPatientsForMember(user.userId);

  return Response.json({
    linkedPatients,
    ok: true,
  });
}
