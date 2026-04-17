// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  canManagePatientDataMock,
  generateWellnessInsightMock,
  getActivitySummaryMock,
  getMedicationAdherenceSummaryMock,
  getPatientDashboardDataMock,
  listActivityLogsForPatientMock,
  requirePatientScopeMock,
} = vi.hoisted(() => ({
  canManagePatientDataMock: vi.fn(),
  generateWellnessInsightMock: vi.fn(),
  getActivitySummaryMock: vi.fn(),
  getMedicationAdherenceSummaryMock: vi.fn(),
  getPatientDashboardDataMock: vi.fn(),
  listActivityLogsForPatientMock: vi.fn(),
  requirePatientScopeMock: vi.fn(),
}));

vi.mock("@/lib/auth/dal", () => ({
  canManagePatientData: canManagePatientDataMock,
  requirePatientScope: requirePatientScopeMock,
}));

vi.mock("@/lib/db/medic-data", () => ({
  getActivitySummary: getActivitySummaryMock,
  getMedicationAdherenceSummary: getMedicationAdherenceSummaryMock,
  getPatientDashboardData: getPatientDashboardDataMock,
  listActivityLogsForPatient: listActivityLogsForPatientMock,
}));

vi.mock("@/lib/wellness-ai", () => ({
  generateWellnessInsight: generateWellnessInsightMock,
}));

function createDashboard() {
  return {
    activitySummary: {
      activePlans: 1,
      completedToday: 1,
      missedToday: 0,
    },
    activityPlans: [],
    appointments: [],
    careCircle: {
      activeCaregivers: 1,
      activeFamilyMembers: 1,
      pendingRequests: 0,
    },
    medicationSummary: {
      activeMedications: 1,
      dueToday: 1,
      takenToday: 1,
    },
    medications: [],
    patientProfile: {
      assistanceLevel: "independent",
      dateOfBirth: "1958-09-07",
      emergencyNotes: null,
      patientUserId: "patient-1",
    },
    recentMedicationLogs: [],
    user: {
      accountStatus: "active",
      email: "patient@example.com",
      firstName: "Walter",
      lastName: "White",
      onboardingStatus: "ready",
      phone: null,
      preferences: {
        chatbotEnabled: true,
        dailySummaryEnabled: true,
        highContrastEnabled: false,
        largeTextEnabled: false,
        preferredContactMethod: "app",
        timeFormat: "12h",
      },
      profileImageDataUrl: null,
      role: "patient",
      userId: "patient-1",
    },
  };
}

describe("/api/wellness/recommendations", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getPatientDashboardDataMock.mockResolvedValue(createDashboard());
    getMedicationAdherenceSummaryMock.mockResolvedValue({
      activeMedications: 1,
      dueToday: 1,
      loggedToday: 1,
      missedToday: 0,
      skippedToday: 0,
      takenToday: 1,
    });
    getActivitySummaryMock.mockResolvedValue({
      activePlans: 1,
      completedToday: 1,
      missedToday: 0,
    });
    listActivityLogsForPatientMock.mockResolvedValue([]);
  });

  it("returns a live recommendation payload for GET requests", async () => {
    requirePatientScopeMock.mockResolvedValue({
      patientUserId: "patient-1",
      user: { role: "patient", userId: "patient-1" },
    });
    generateWellnessInsightMock.mockResolvedValue({
      generatedAt: "2026-04-17T00:00:00.000Z",
      recommendation: "Keep the morning routine light and review the next medication time.",
      routine: null,
      source: "gemini",
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/wellness/recommendations?patientId=patient-1"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.recommendation).toContain("morning routine");
    expect(generateWellnessInsightMock).toHaveBeenCalledWith(
      expect.objectContaining({
        patientUserId: "patient-1",
      }),
      {
        requestType: "recommendation",
      },
    );
  });

  it("blocks POST requests from roles that cannot manage routines", async () => {
    requirePatientScopeMock.mockResolvedValue({
      patientUserId: "patient-1",
      user: { role: "family_member", userId: "family-1" },
    });
    canManagePatientDataMock.mockReturnValue(false);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/wellness/recommendations", {
        body: JSON.stringify({
          patientUserId: "patient-1",
          userPrompt: "Need a light routine",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
    expect(generateWellnessInsightMock).not.toHaveBeenCalled();
  });

  it("passes the trimmed routine prompt to the AI service for POST requests", async () => {
    requirePatientScopeMock.mockResolvedValue({
      patientUserId: "patient-1",
      user: { role: "caregiver", userId: "caregiver-1" },
    });
    canManagePatientDataMock.mockReturnValue(true);
    generateWellnessInsightMock.mockResolvedValue({
      generatedAt: "2026-04-17T00:00:00.000Z",
      recommendation: "A short mobility reset fits well before lunch.",
      routine: {
        category: "Mobility",
        daysOfWeek: ["Mon", "Wed", "Fri"],
        frequencyType: "weekly",
        instructions: "Use support and keep the pace easy.",
        targetMinutes: 12,
        title: "Mobility Reset",
        whyItFits: "Matches the current support needs and schedule.",
      },
      source: "gemini",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/wellness/recommendations", {
        body: JSON.stringify({
          patientUserId: "patient-1",
          userPrompt: "  Need a gentle routine before lunch.  ",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.routine?.title).toBe("Mobility Reset");
    expect(generateWellnessInsightMock).toHaveBeenCalledWith(
      expect.objectContaining({
        patientUserId: "patient-1",
      }),
      {
        requestType: "routine",
        userPrompt: "Need a gentle routine before lunch.",
      },
    );
  });
});
