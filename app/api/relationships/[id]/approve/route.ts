import { requireRole } from "@/lib/auth/dal";
import { approveRelationship } from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireRole("patient");
  const { id } = await context.params;

  await approveRelationship({
    approverUserId: user.userId,
    patientUserId: user.userId,
    relationshipId: id,
  });

  revalidateMedicAppPaths();

  return Response.json({
    ok: true,
  });
}
