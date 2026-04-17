import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsManager } from "@/components/settings-manager";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe("SettingsManager", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("saves the chatbot preference alongside the other settings", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        ok: true,
      }),
      ok: true,
      status: 200,
    } satisfies Partial<Response>);

    vi.stubGlobal("fetch", fetchMock);

    render(
      <SettingsManager
        preferences={{
          chatbotEnabled: true,
          dailySummaryEnabled: true,
          highContrastEnabled: false,
          largeTextEnabled: false,
          preferredContactMethod: "app",
          timeFormat: "12h",
        }}
      />,
    );

    await userEvent.click(screen.getByLabelText(/Enable chatbot/i));
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/settings");
    expect(JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string)).toMatchObject({
      chatbotEnabled: false,
      dailySummaryEnabled: true,
      preferredContactMethod: "app",
      timeFormat: "12h",
    });

    await screen.findByText("Settings updated.");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
