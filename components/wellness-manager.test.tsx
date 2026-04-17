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

  it("locks a once-daily routine after it has already been logged today", async () => {
    const todayKey = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createJsonResponse({
          generatedAt: `${todayKey}T00:00:00.000Z`,
          ok: true,
          recommendation: "Keep the pace steady today.",
          routine: null,
          source: "fallback",
        }),
      ),
    );

    render(
      <WellnessManager
        activityLogs={[
          {
            activityPlanId: "routine-1",
            activityTitle: "Mobility Reset",
            completionStatus: "done",
            completedAt: `${todayKey}T08:00:00.000Z`,
            createdAt: `${todayKey}T08:00:00.000Z`,
            id: "log-1",
            notes: null,
            recordedByDisplayName: "Caregiver One",
            scheduledFor: todayKey,
          },
        ]}
        activityPlans={[
          {
            category: "Mobility",
            createdByDisplayName: "Caregiver One",
            daysOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            frequencyType: "daily",
            id: "routine-1",
            imageDataUrl: null,
            instructions: "Keep the pace light.",
            isActive: true,
            latestCompletedAt: `${todayKey}T08:00:00.000Z`,
            latestCompletionStatus: "done",
            targetMinutes: 15,
            title: "Mobility Reset",
          },
        ]}
        activitySummary={{
          activePlans: 1,
          completedToday: 1,
          missedToday: 0,
        }}
        appointments={[]}
        canManage
        patientUserId="patient-1"
      />,
    );

    expect(screen.getByText("1 of 1 logs used today.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark done" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mark missed" })).toBeDisabled();
  });

  it("keeps a twice-daily routine available until the second log is used", async () => {
    const todayKey = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createJsonResponse({
          generatedAt: `${todayKey}T00:00:00.000Z`,
          ok: true,
          recommendation: "A second routine slot is still available today.",
          routine: null,
          source: "fallback",
        }),
      ),
    );

    render(
      <WellnessManager
        activityLogs={[
          {
            activityPlanId: "routine-2",
            activityTitle: "Breathing Reset",
            completionStatus: "done",
            completedAt: `${todayKey}T08:00:00.000Z`,
            createdAt: `${todayKey}T08:00:00.000Z`,
            id: "log-2",
            notes: null,
            recordedByDisplayName: "Caregiver One",
            scheduledFor: todayKey,
          },
        ]}
        activityPlans={[
          {
            category: "Breathing",
            createdByDisplayName: "Caregiver One",
            daysOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            frequencyType: "twice_daily",
            id: "routine-2",
            imageDataUrl: null,
            instructions: "Pause if dizzy.",
            isActive: true,
            latestCompletedAt: `${todayKey}T08:00:00.000Z`,
            latestCompletionStatus: "done",
            targetMinutes: 10,
            title: "Breathing Reset",
          },
        ]}
        activitySummary={{
          activePlans: 1,
          completedToday: 1,
          missedToday: 0,
        }}
        appointments={[]}
        canManage
        patientUserId="patient-1"
      />,
    );

    expect(screen.getByText("1 of 2 logs used today.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark done" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Mark missed" })).toBeEnabled();
  });
});
