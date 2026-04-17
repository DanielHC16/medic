export type RoleSlug = "patient" | "caregiver" | "family_member";

export type InviteApprovalMode = "auto" | "manual";

export type InviteStatus = "active" | "accepted" | "expired" | "revoked";

export type RelationshipStatus = "pending" | "active" | "revoked";

export type MedicationLogStatus =
  | "taken"
  | "missed"
  | "skipped"
  | "queued_offline";

export type ActivityCompletionStatus = "planned" | "done" | "missed";

export type PreferredContactMethod = "app" | "email" | "sms";

export type TimeFormatPreference = "12h" | "24h";

export type UserPreferences = {
  dailySummaryEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
  preferredContactMethod: PreferredContactMethod;
  timeFormat: TimeFormatPreference;
};

export type SessionUser = {
  email: string;
  firstName: string;
  lastName: string;
  role: RoleSlug;
  userId: string;
};

export type AuthenticatedUser = SessionUser & {
  accountStatus: string;
  onboardingStatus: string;
  phone: string | null;
  preferences: UserPreferences;
};

export type PatientProfile = {
  assistanceLevel: string | null;
  dateOfBirth: string | null;
  emergencyNotes: string | null;
  patientUserId: string;
};

export type CareRelationship = {
  id: string;
  invitationId: string | null;
  joinedAt: string | null;
  memberRole: RoleSlug;
  patientDisplayName: string;
  patientUserId: string;
  relatedDisplayName: string;
  relatedUserId: string;
  relationshipStatus: RelationshipStatus;
};

export type CareInvitationPreview = {
  approvalMode: InviteApprovalMode;
  code: string;
  createdAt: string;
  expiresAt: string;
  inviteId: string;
  memberRole: RoleSlug;
  patientDisplayName: string;
  patientUserId: string;
  status: InviteStatus;
};

export type ShareableInvitation = CareInvitationPreview & {
  invitePath: string;
};

export type MedicationRecord = {
  createdByDisplayName: string;
  dosageUnit: string | null;
  dosageValue: string;
  form: string;
  id: string;
  instructions: string | null;
  isActive: boolean;
  latestLogStatus: MedicationLogStatus | null;
  latestTakenAt: string | null;
  name: string;
  patientUserId: string;
  scheduleDays: string[];
  scheduleFrequencyType: string | null;
  scheduleId: string | null;
  scheduleTimes: string[];
};

export type MedicationLogRecord = {
  createdAt: string;
  id: string;
  medicationId: string;
  medicationName: string;
  notes: string | null;
  recordedByDisplayName: string | null;
  scheduledFor: string | null;
  source: string;
  status: MedicationLogStatus;
  takenAt: string | null;
};

export type MedicationAdherenceSummary = {
  activeMedications: number;
  dueToday: number;
  loggedToday: number;
  missedToday: number;
  skippedToday: number;
  takenToday: number;
};

export type ActivityPlanRecord = {
  category: string;
  createdByDisplayName: string;
  daysOfWeek: string[];
  frequencyType: string;
  id: string;
  instructions: string | null;
  isActive: boolean;
  latestCompletedAt: string | null;
  latestCompletionStatus: ActivityCompletionStatus | null;
  targetMinutes: number | null;
  title: string;
};

export type ActivityLogRecord = {
  activityPlanId: string;
  activityTitle: string;
  completionStatus: ActivityCompletionStatus;
  completedAt: string | null;
  createdAt: string;
  id: string;
  notes: string | null;
  recordedByDisplayName: string | null;
  scheduledFor: string | null;
};

export type ActivitySummary = {
  activePlans: number;
  completedToday: number;
  missedToday: number;
};

export type AppointmentRecord = {
  appointmentAt: string;
  id: string;
  location: string | null;
  notes: string | null;
  providerName: string | null;
  status: string;
  title: string;
};

export type PatientDashboardData = {
  activityPlans: ActivityPlanRecord[];
  appointments: AppointmentRecord[];
  careCircle: {
    activeCaregivers: number;
    activeFamilyMembers: number;
    pendingRequests: number;
  };
  medicationSummary: {
    activeMedications: number;
    dueToday: number;
    takenToday: number;
  };
  medications: MedicationRecord[];
  patientProfile: PatientProfile | null;
  user: AuthenticatedUser;
};

export type LinkedPatientSummary = {
  patientDisplayName: string;
  patientUserId: string;
  relationshipId: string;
  relationshipStatus: RelationshipStatus;
};

export type CareMemberDashboardData = {
  activeLinkedPatients: LinkedPatientSummary[];
  linkedPatients: LinkedPatientSummary[];
  selectedPatient: PatientDashboardData | null;
  user: AuthenticatedUser;
};

export type SyncPushOperation = {
  clientRef: string;
  medicationId: string;
  notes?: string;
  scheduleId?: string | null;
  scheduledFor?: string | null;
  status: MedicationLogStatus;
  takenAt?: string | null;
};

export type TestingWorkbenchUser = {
  displayName: string;
  email: string;
  hasPatientProfile: boolean;
  phone: string | null;
  role: RoleSlug;
  userId: string;
};

export type TestingWorkbenchPatient = {
  displayName: string;
  userId: string;
};

export type TestingWorkbenchInvitation = {
  approvalMode: InviteApprovalMode;
  code: string;
  createdAt: string;
  memberRole: RoleSlug;
  patientDisplayName: string;
  status: InviteStatus;
};

export type TestingWorkbenchMedication = {
  createdByDisplayName: string;
  id: string;
  name: string;
  patientDisplayName: string;
  scheduleSummary: string;
};

export type TestingWorkbenchActivity = {
  category: string;
  id: string;
  patientDisplayName: string;
  title: string;
};

export type TestingWorkbenchAppointment = {
  appointmentAt: string;
  id: string;
  patientDisplayName: string;
  title: string;
};

export type TestingWorkbenchSnapshot = {
  patients: TestingWorkbenchPatient[];
  recentActivities: TestingWorkbenchActivity[];
  recentAppointments: TestingWorkbenchAppointment[];
  recentInvitations: TestingWorkbenchInvitation[];
  recentMedications: TestingWorkbenchMedication[];
  users: TestingWorkbenchUser[];
};
