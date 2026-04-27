import { requireCurrentUser } from "@/lib/auth/dal";
import { updateUserPreferences } from "@/lib/db/medic-data";
import { revalidateMedicAppPaths } from "@/lib/revalidation";
import {
  getPreferredContactMethod,
  getRequiredBoolean,
  getTimeFormatPreference,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = (await request.json()) as Record<string, unknown>;

    const updatedUser = await updateUserPreferences({
      chatbotEnabled: getRequiredBoolean(body.chatbotEnabled, "Chatbot setting"),
      dailySummaryEnabled: getRequiredBoolean(
        body.dailySummaryEnabled,
        "Daily summary setting",
      ),
      highContrastEnabled: getRequiredBoolean(
        body.highContrastEnabled,
        "High contrast setting",
      ),
      largeTextEnabled: getRequiredBoolean(body.largeTextEnabled, "Large text setting"),
      preferredContactMethod: getPreferredContactMethod(body.preferredContactMethod),
      timeFormat: getTimeFormatPreference(body.timeFormat),
      userId: user.userId,
    });

    revalidateMedicAppPaths();

    return Response.json({
      ok: true,
      user: updatedUser,
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to update settings.",
        ok: false,
      },
      { status: 400 },
    );
  }
}
