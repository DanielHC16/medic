import { getErrorMessage, isMissingTableError } from "@/lib/api/errors";
import { getPhaseOneSnapshot } from "@/lib/db/phase-one";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await getPhaseOneSnapshot();

    return Response.json({
      ok: true,
      status: "ready",
      snapshot,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return Response.json(
        {
          ok: false,
          status: "missing_schema",
          message:
            "Phase-one tables do not exist yet. Run POST /api/db/bootstrap first.",
        },
        { status: 409 },
      );
    }

    return Response.json(
      {
        ok: false,
        status: "error",
        message: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
