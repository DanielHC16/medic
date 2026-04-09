import { getErrorMessage } from "@/lib/api/errors";
import { resetMedicTestingData } from "@/lib/db/medic-data";
import { isTestingWorkbenchEnabled } from "@/lib/testing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  if (!isTestingWorkbenchEnabled()) {
    return Response.json(
      {
        message: "Database reset is only available in local testing environments.",
        ok: false,
      },
      { status: 403 },
    );
  }

  try {
    const snapshot = await resetMedicTestingData();

    return Response.json({
      message: "Testing data was purged and reseeded successfully.",
      ok: true,
      snapshot,
      status: "reset",
    });
  } catch (error) {
    return Response.json(
      {
        message: getErrorMessage(error),
        ok: false,
        status: "error",
      },
      { status: 500 },
    );
  }
}
