import { requirePatientScope } from "@/lib/auth/dal";
import {
  listActivityPlansForPatient,
  listAppointmentsForPatient,
  listMedicationsForPatient,
} from "@/lib/db/medic-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = await requirePatientScope(searchParams.get("patientId"));

  if (!scope.patientUserId) {
    return Response.json({
      appointments: [],
      medications: [],
      ok: true,
      routines: [],
    });
  }

  const [medications, routines, appointments] = await Promise.all([
    listMedicationsForPatient(scope.patientUserId),
    listActivityPlansForPatient(scope.patientUserId),
    listAppointmentsForPatient(scope.patientUserId),
  ]);

  return Response.json({
    appointments,
    medications,
    ok: true,
    routines,
  });
}
