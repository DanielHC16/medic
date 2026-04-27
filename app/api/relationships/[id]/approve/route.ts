import { requireRole } from "@/lib/auth/dal";
import { approveRelationship } from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import { getEntityId } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("patient");
    const { id } = await context.params;

    await approveRelationship({
      approverUserId: user.userId,
      patientUserId: user.userId,
      relationshipId: getEntityId(id, "Relationship"),
    });

    revalidateMedicAppPaths();

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to approve relationship.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
