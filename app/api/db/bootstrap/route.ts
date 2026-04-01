import { getErrorMessage } from "@/lib/api/errors";
import { bootstrapPhaseOneSchema } from "@/lib/db/phase-one";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const snapshot = await bootstrapPhaseOneSchema();

    return Response.json({
      ok: true,
      status: "bootstrapped",
      message:
        "Phase-one tables and demo rows are ready for the initial testing workflow.",
      snapshot,
    });
  } catch (error) {
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
