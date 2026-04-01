import { getErrorMessage } from "@/lib/api/errors";
import { runDatabaseStatusCheck } from "@/lib/db/neon";
import { getEnvironmentSummary } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const database = await runDatabaseStatusCheck();

    return Response.json({
      ok: true,
      status: "connected",
      database,
      environment: getEnvironmentSummary(),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "error",
        environment: getEnvironmentSummary(),
        message: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
