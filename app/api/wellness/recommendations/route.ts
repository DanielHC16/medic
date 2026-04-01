import { placeholderResponse } from "@/lib/api/placeholders";

export const runtime = "nodejs";

export async function GET() {
  return placeholderResponse({
    feature: "wellness-recommendations",
    method: "GET",
    path: "/api/wellness/recommendations",
    summary: "Gemini recommendation generation is intentionally deferred for now.",
  });
}
