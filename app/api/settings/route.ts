import { requireCurrentUser } from "@/lib/auth/dal";
import { updateUserPreferences } from "@/lib/db/medic-data";
import type {
  PreferredContactMethod,
  TimeFormatPreference,
} from "@/lib/medic-types";
import { getBooleanValue } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getPreferredContactMethod(value: unknown): PreferredContactMethod {
  return value === "email" || value === "sms" ? value : "app";
}

function getTimeFormat(value: unknown): TimeFormatPreference {
  return value === "24h" ? "24h" : "12h";
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = (await request.json()) as Record<string, unknown>;

    const updatedUser = await updateUserPreferences({
      dailySummaryEnabled: getBooleanValue(body.dailySummaryEnabled, true),
      highContrastEnabled: getBooleanValue(body.highContrastEnabled),
      largeTextEnabled: getBooleanValue(body.largeTextEnabled),
      preferredContactMethod: getPreferredContactMethod(body.preferredContactMethod),
      timeFormat: getTimeFormat(body.timeFormat),
      userId: user.userId,
    });

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
