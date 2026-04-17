import {
  buildFallbackPatientChatReply,
  buildPatientChatbotSuggestions,
  buildPatientChatbotWelcome,
  type PatientChatContext,
} from "@/lib/chatbot-ai-shared";

function createContext(overrides?: Partial<PatientChatContext>): PatientChatContext {
  return {
    activityLogs: [],
    activityPlans: [
      {
        category: "Mobility",
        createdByDisplayName: "Caregiver One",
        daysOfWeek: ["Mon", "Wed", "Fri"],
        frequencyType: "weekly",
        id: "activity-1",
        imageDataUrl: null,
        instructions: "Keep the pace light.",
        isActive: true,
        latestCompletedAt: null,
        latestCompletionStatus: "planned",
        targetMinutes: 15,
        title: "Mobility Reset",
      },
    ],
    activitySummary: {
      activePlans: 1,
      completedToday: 0,
      missedToday: 0,
    },
    appointments: [
      {
        appointmentAt: "2099-04-20T10:00:00.000Z",
        id: "appointment-1",
        imageDataUrl: null,
        location: "Clinic A",
        notes: "Bring medication list",
        providerName: "Dr. Cruz",
        status: "scheduled",
        title: "Follow-up visit",
      },
    ],
    careCircle: {
      activeCaregivers: 1,
      activeFamilyMembers: 1,
      pendingRequests: 0,
    },
    medicationLogs: [],
    medicationSummary: {
      activeMedications: 2,
      dueToday: 2,
      loggedToday: 1,
      missedToday: 0,
      skippedToday: 0,
      takenToday: 1,
    },
    medications: [
      {
        createdByDisplayName: "Caregiver One",
        dosageUnit: "mg",
        dosageValue: "5",
        form: "Tablet",
        id: "med-1",
        imageDataUrl: null,
        instructions: "Take after breakfast.",
        isActive: true,
        latestLogStatus: "taken",
        latestTakenAt: "2099-04-19T08:00:00.000Z",
        name: "Amlodipine",
        patientUserId: "patient-1",
        scheduleDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        scheduleFrequencyType: "daily",
        scheduleId: "sched-1",
        scheduleTimes: ["08:00"],
      },
    ],
    patientProfile: {
      assistanceLevel: "caregiver_assistance",
      dateOfBirth: "1958-09-07",
      emergencyNotes: "Use chair support when balance feels off.",
      patientUserId: "patient-1",
    },
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
    ...overrides,
  };
}

describe("chatbot-ai-shared", () => {
  it("builds starter prompts grounded in live patient data", () => {
    const suggestions = buildPatientChatbotSuggestions(createContext());

    expect(suggestions).toContain("When should I take Amlodipine?");
    expect(suggestions).toContain("How should I prepare for my next appointment?");
  });

  it("builds a welcome message from the patient's current data", () => {
    const welcome = buildPatientChatbotWelcome(createContext());

    expect(welcome).toContain("Walter");
    expect(welcome).toContain("Amlodipine");
  });

  it("answers medication questions from the fallback data summary", () => {
    const response = buildFallbackPatientChatReply(createContext(), [
      {
        content: "When is my next medication?",
        role: "user",
      },
    ]);

    expect(response.source).toBe("fallback");
    expect(response.reply).toContain("Amlodipine");
    expect(response.reply).toContain("8:00 AM");
  });
});
