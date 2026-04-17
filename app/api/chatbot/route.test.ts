// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  generatePatientChatReplyMock,
  getActivitySummaryMock,
  getMedicationAdherenceSummaryMock,
  getPatientDashboardDataMock,
  listActivityLogsForPatientMock,
  listMedicationLogsForPatientMock,
  requireRoleMock,
} = vi.hoisted(() => ({
  generatePatientChatReplyMock: vi.fn(),
  getActivitySummaryMock: vi.fn(),
  getMedicationAdherenceSummaryMock: vi.fn(),
  getPatientDashboardDataMock: vi.fn(),
  listActivityLogsForPatientMock: vi.fn(),
  listMedicationLogsForPatientMock: vi.fn(),
  requireRoleMock: vi.fn(),
}));

vi.mock("@/lib/auth/dal", () => ({
  requireRole: requireRoleMock,
}));

vi.mock("@/lib/db/medic-data", () => ({
  getActivitySummary: getActivitySummaryMock,
  getMedicationAdherenceSummary: getMedicationAdherenceSummaryMock,
  getPatientDashboardData: getPatientDashboardDataMock,
  listActivityLogsForPatient: listActivityLogsForPatientMock,
  listMedicationLogsForPatient: listMedicationLogsForPatientMock,
}));

vi.mock("@/lib/chatbot-ai", () => ({
  generatePatientChatReply: generatePatientChatReplyMock,
}));

function createUser(chatbotEnabled = true) {
  return {
    preferences: {
      chatbotEnabled,
      dailySummaryEnabled: true,
      highContrastEnabled: false,
      largeTextEnabled: false,
      preferredContactMethod: "app",
      timeFormat: "12h",
    },
    role: "patient",
    userId: "patient-1",
  };
}

function createDashboard() {
  return {
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
    user: {
      accountStatus: "active",
      email: "patient@example.com",
      firstName: "Walter",
      lastName: "White",
      onboardingStatus: "ready",
      phone: null,
      preferences: createUser().preferences,
      profileImageDataUrl: null,
      role: "patient",
      userId: "patient-1",
    },
  };
}

describe("/api/chatbot", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    requireRoleMock.mockResolvedValue(createUser(true));
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
      activePlans: 0,
      completedToday: 0,
      missedToday: 0,
    });
    listActivityLogsForPatientMock.mockResolvedValue([]);
    listMedicationLogsForPatientMock.mockResolvedValue([]);
  });

  it("returns starter prompts and welcome text for enabled patients", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.enabled).toBe(true);
    expect(payload.suggestions.length).toBeGreaterThan(0);
    expect(payload.welcomeMessage).toContain("MEDIC");
  });

  it("blocks chat replies when the chatbot setting is disabled", async () => {
    requireRoleMock.mockResolvedValue(createUser(false));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/chatbot", {
        body: JSON.stringify({
          messages: [
            {
              content: "Hello",
              role: "user",
            },
          ],
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
    expect(generatePatientChatReplyMock).not.toHaveBeenCalled();
  });

  it("passes the trimmed conversation to the AI chat service", async () => {
    generatePatientChatReplyMock.mockResolvedValue({
      generatedAt: "2026-04-18T00:00:00.000Z",
      reply: "You have one medication due later today.",
      source: "gemini",
      suggestions: ["Give me a quick summary of my day."],
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/chatbot", {
        body: JSON.stringify({
          messages: [
            {
              content: "  What should I remember today?  ",
              role: "user",
            },
          ],
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
    expect(payload.reply).toContain("medication due");
    expect(generatePatientChatReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          userId: "patient-1",
        }),
      }),
      [
        {
          content: "What should I remember today?",
          role: "user",
        },
      ],
    );
  });
});
