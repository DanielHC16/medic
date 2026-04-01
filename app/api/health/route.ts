import { getEnvironmentSummary } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    service: "medic-api",
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: getEnvironmentSummary(),
    nextSteps: [
      "Run POST /api/db/bootstrap to create the phase-one testing tables.",
      "Run GET /api/db/status to verify Neon connectivity.",
      "Run GET /api/db/sample to inspect demo data.",
    ],
  });
}
