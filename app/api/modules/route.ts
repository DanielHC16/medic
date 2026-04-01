import {
  featureModules,
  foundationApiScaffolds,
  implementationPhases,
  placeholderApiScaffolds,
} from "@/lib/medic-blueprint";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    foundationApiScaffolds,
    featureModules,
    implementationPhases,
    placeholderApiScaffolds,
  });
}
