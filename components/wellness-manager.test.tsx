import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WellnessManager } from "@/components/wellness-manager";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

function createJsonResponse(payload: unknown, ok = true) {
  return {
    json: async () => payload,
    ok,
    status: ok ? 200 : 400,
  } satisfies Partial<Response>;
}

describe("WellnessManager AI flow", () => {
  beforeEach(() => {
    refreshMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lets the user generate a routine and save it directly from the AI draft button", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          generatedAt: "2026-04-17T00:00:00.000Z",
          ok: true,
          recommendation: "Review the next medication reminder before starting activity.",
          routine: null,
          source: "gemini",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          generatedAt: "2026-04-17T00:01:00.000Z",
          ok: true,
          recommendation: "A gentle mobility routine fits well before lunch today.",
          routine: {
            category: "Mobility",
            daysOfWeek: ["Mon", "Wed", "Fri"],
            frequencyType: "weekly",
            instructions: "Use a stable chair if balance feels limited and pause if dizzy.",
            targetMinutes: 12,
            title: "Mobility Reset",
            whyItFits: "It fits the patient's schedule and support needs.",
          },
          source: "gemini",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <WellnessManager
        activityLogs={[]}
        activityPlans={[]}
        activitySummary={{
          activePlans: 0,
          completedToday: 0,
          missedToday: 0,
        }}
        appointments={[]}
        canManage
        patientUserId="patient-1"
      />,
    );

    await screen.findByText(
      "Review the next medication reminder before starting activity.",
    );

    await userEvent.type(
      screen.getByLabelText("Ask for a routine focus"),
      "Need a gentle routine before lunch.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Generate AI routine" }));

    await screen.findByText("Mobility Reset");
    await userEvent.click(screen.getByRole("button", { name: "Use this routine draft" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    const createCall = fetchMock.mock.calls[2];
    expect(createCall?.[0]).toBe("/api/activities");
    expect(createCall?.[1]).toMatchObject({
      method: "POST",
    });
    expect(JSON.parse((createCall?.[1] as RequestInit).body as string)).toEqual({
      category: "Mobility",
      daysOfWeek: ["Mon", "Wed", "Fri"],
      frequencyType: "weekly",
      instructions: "Use a stable chair if balance feels limited and pause if dizzy.",
      patientUserId: "patient-1",
      targetMinutes: "12",
      title: "Mobility Reset",
    });

    await screen.findByText("AI routine added.");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("still lets the user load the AI routine into the manual form before saving", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          generatedAt: "2026-04-18T00:00:00.000Z",
          ok: true,
          recommendation: "Check the next medication reminder before activity.",
          routine: null,
          source: "gemini",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          generatedAt: "2026-04-18T00:01:00.000Z",
          ok: true,
          recommendation: "A gentle mobility routine fits well before lunch today.",
          routine: {
            category: "Mobility",
            daysOfWeek: ["Mon", "Wed", "Fri"],
            frequencyType: "weekly",
            instructions: "Use a stable chair if balance feels limited and pause if dizzy.",
            targetMinutes: 12,
            title: "Mobility Reset",
            whyItFits: "It fits the patient's schedule and support needs.",
          },
          source: "gemini",
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <WellnessManager
        activityLogs={[]}
        activityPlans={[]}
        activitySummary={{
          activePlans: 0,
          completedToday: 0,
          missedToday: 0,
        }}
        appointments={[]}
        canManage
        patientUserId="patient-1"
      />,
    );

    await screen.findByText("Check the next medication reminder before activity.");
    await userEvent.click(screen.getByRole("button", { name: "Generate AI routine" }));
    await screen.findByText("Mobility Reset");
    await userEvent.click(screen.getByRole("button", { name: "Edit before saving" }));

    expect(screen.getByLabelText("Routine title")).toHaveValue("Mobility Reset");
    expect(screen.getByLabelText("Category")).toHaveValue("Mobility");
    expect(screen.getByLabelText("Target minutes")).toHaveValue(12);
    expect(screen.getByLabelText("Instructions")).toHaveValue(
      "Use a stable chair if balance feels limited and pause if dizzy.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
