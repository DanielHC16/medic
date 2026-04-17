import { createId, createInviteCode } from "@/lib/ids";
import { buildInvitePath, normalizeInviteCode } from "@/lib/invite-links";
import type {
  ActivityLogRecord,
  ActivityCompletionStatus,
  ActivityPlanRecord,
  ActivitySummary,
  AppointmentRecord,
  AuthenticatedUser,
  CareInvitationPreview,
  CareMemberDashboardData,
  CareRelationship,
  InviteApprovalMode,
  LinkedPatientSummary,
  MedicationAdherenceSummary,
  MedicationLogRecord,
  MedicationLogStatus,
  MedicationRecord,
  PatientDashboardData,
  PatientProfile,
  PreferredContactMethod,
  RoleSlug,
  ShareableInvitation,
  SyncPushOperation,
  TestingWorkbenchSnapshot,
  TimeFormatPreference,
} from "@/lib/medic-types";
import { createPasswordHash, verifyPassword } from "@/lib/security/passwords";
import { getSql } from "@/lib/db/neon";

const DEMO_PASSWORD = "DemoPass123!";
const PATIENT_ROLE_ID = "role-patient";
const CAREGIVER_ROLE_ID = "role-caregiver";
const FAMILY_ROLE_ID = "role-family-member";

type UserRow = {
  account_status: string;
  avatar_image_data_url: string | null;
  daily_summary_enabled: boolean;
  email: string;
  first_name: string;
  high_contrast_enabled: boolean;
  last_name: string;
  large_text_enabled: boolean;
  onboarding_status: string;
  phone: string | null;
  preferred_contact_method: PreferredContactMethod;
  role: RoleSlug;
  time_format: TimeFormatPreference;
  user_id: string;
};

type AuthUserRow = UserRow & {
  password_hash: string | null;
  password_salt: string | null;
};

type RelationshipRow = {
  id: string;
  invitation_id: string | null;
  joined_at: string | null;
  member_role: RoleSlug;
  patient_display_name: string;
  patient_user_id: string;
  related_display_name: string;
  related_user_id: string;
  relationship_status: "pending" | "active" | "revoked";
};

type InvitationRow = {
  approval_mode: InviteApprovalMode;
  code: string;
  created_at: string;
  expires_at: string;
  invite_id: string;
  member_role: RoleSlug;
  patient_display_name: string;
  patient_user_id: string;
  status: "active" | "accepted" | "expired" | "revoked";
};

type MedicationRow = {
  created_by_display_name: string;
  dosage_unit: string | null;
  dosage_value: string;
  form: string;
  id: string;
  image_data_url: string | null;
  instructions: string | null;
  is_active: boolean;
  latest_log_status: MedicationLogStatus | null;
  latest_taken_at: string | null;
  name: string;
  patient_user_id: string;
  schedule_days: string[] | null;
  schedule_frequency_type: string | null;
  schedule_id: string | null;
  schedule_times: string[] | null;
};

type ActivityRow = {
  category: string;
  created_by_display_name: string;
  days_of_week: string[] | null;
  frequency_type: string;
  id: string;
  instructions: string | null;
  is_active: boolean;
  latest_completed_at: string | null;
  latest_completion_status: ActivityCompletionStatus | null;
  target_minutes: number | null;
  title: string;
};

type MedicationLogRow = {
  created_at: string;
  id: string;
  logged_for_date: string | null;
  medication_id: string;
  medication_name: string;
  notes: string | null;
  recorded_by_display_name: string | null;
  scheduled_for: string | null;
  source: string;
  status: MedicationLogStatus;
  taken_at: string | null;
};

type ActivityLogRow = {
  activity_plan_id: string;
  activity_title: string;
  completion_status: ActivityCompletionStatus;
  completed_at: string | null;
  created_at: string;
  id: string;
  notes: string | null;
  recorded_by_display_name: string | null;
  scheduled_for: string | null;
};

type AppointmentRow = {
  appointment_at: string;
  id: string;
  location: string | null;
  notes: string | null;
  provider_name: string | null;
  status: string;
  title: string;
};

type TestingWorkbenchUserRow = {
  display_name: string;
  email: string;
  has_patient_profile: boolean;
  phone: string | null;
  role: RoleSlug;
  user_id: string;
};

type TestingWorkbenchPatientRow = {
  display_name: string;
  user_id: string;
};

type TestingWorkbenchInvitationRow = {
  approval_mode: InviteApprovalMode;
  code: string;
  created_at: string;
  member_role: RoleSlug;
  patient_display_name: string;
  status: "active" | "accepted" | "expired" | "revoked";
};

type TestingWorkbenchMedicationRow = {
  created_by_display_name: string;
  id: string;
  name: string;
  patient_display_name: string;
  schedule_days: string[] | null;
  schedule_frequency_type: string | null;
  schedule_times: string[] | null;
};

type TestingWorkbenchActivityRow = {
  category: string;
  id: string;
  patient_display_name: string;
  title: string;
};

type TestingWorkbenchAppointmentRow = {
  appointment_at: string;
  id: string;
  patient_display_name: string;
  title: string;
};

type CountRow = {
  total: number;
};

type SeedUser = {
  assistanceLevel?: string;
  dateOfBirth?: string;
  emergencyNotes?: string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  phone: string;
  role: RoleSlug;
};

type SeedInvitation = {
  approvalMode: InviteApprovalMode;
  code: string;
  createdByUserId: string;
  id: string;
  memberRole: "caregiver" | "family_member";
  patientUserId: string;
  status: "accepted" | "active";
};

type SeedRelationship = {
  id: string;
  invitationId: string;
  joinedAt: string;
  memberRole: "caregiver" | "family_member";
  patientUserId: string;
  relatedUserId: string;
  relationshipStatus: "active";
  inviteCode: string;
};

type SeedMedication = {
  createdByUserId: string;
  dosageUnit?: string;
  dosageValue: string;
  form: string;
  frequencyType: string;
  id: string;
  instructions?: string;
  isActive: boolean;
  logId: string;
  logNotes?: string;
  logRecordedByUserId: string;
  logStatus: MedicationLogStatus;
  name: string;
  patientUserId: string;
  scheduleDays: string[];
  scheduleId: string;
  scheduleTimes: string[];
};

type SeedActivity = {
  category: string;
  completionStatus: ActivityCompletionStatus;
  createdByUserId: string;
  daysOfWeek: string[];
  frequencyType: string;
  id: string;
  instructions?: string;
  isActive: boolean;
  logId: string;
  logNotes?: string;
  logRecordedByUserId: string;
  patientUserId: string;
  targetMinutes: number;
  title: string;
};

type SeedAppointment = {
  appointmentOffset: string;
  createdByUserId: string;
  id: string;
  location?: string;
  notes?: string;
  patientUserId: string;
  providerName?: string;
  status: string;
  title: string;
};

const EVERY_DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SEEDED_TEST_USERS: SeedUser[] = [
  {
    assistanceLevel: "minimal_assistance",
    dateOfBirth: "1958-09-07",
    email: "walter.white@medic.local",
    emergencyNotes: "Prefers calm, step-by-step medication reminders.",
    firstName: "Walter",
    id: "user-patient-walter",
    lastName: "White",
    phone: "09170000101",
    role: "patient",
  },
  {
    email: "jesse.pinkman@medic.local",
    firstName: "Jesse",
    id: "user-caregiver-jesse",
    lastName: "Pinkman",
    phone: "09170000111",
    role: "caregiver",
  },
  {
    email: "skyler.white@medic.local",
    firstName: "Skyler",
    id: "user-family-skyler",
    lastName: "White",
    phone: "09170000121",
    role: "family_member",
  },
  {
    assistanceLevel: "caregiver_assistance",
    dateOfBirth: "1939-05-10",
    email: "hector.salamanca@medic.local",
    emergencyNotes: "Wheelchair user. Keep the bell and water within reach.",
    firstName: "Hector",
    id: "user-patient-hector",
    lastName: "Salamanca",
    phone: "09170000102",
    role: "patient",
  },
  {
    email: "gus.fring@medic.local",
    firstName: "Gustavo",
    id: "user-caregiver-gus",
    lastName: "Fring",
    phone: "09170000112",
    role: "caregiver",
  },
  {
    email: "tuco.salamanca@medic.local",
    firstName: "Tuco",
    id: "user-family-tuco",
    lastName: "Salamanca",
    phone: "09170000122",
    role: "family_member",
  },
  {
    assistanceLevel: "independent",
    dateOfBirth: "1960-11-12",
    email: "saul.goodman@medic.local",
    emergencyNotes: "Wants reminders early enough to avoid missing appointments.",
    firstName: "Saul",
    id: "user-patient-saul",
    lastName: "Goodman",
    phone: "09170000103",
    role: "patient",
  },
  {
    email: "kim.wexler@medic.local",
    firstName: "Kim",
    id: "user-caregiver-kim",
    lastName: "Wexler",
    phone: "09170000113",
    role: "caregiver",
  },
  {
    email: "chuck.mcgill@medic.local",
    firstName: "Chuck",
    id: "user-family-chuck",
    lastName: "McGill",
    phone: "09170000123",
    role: "family_member",
  },
];

const SEEDED_TEST_INVITATIONS: SeedInvitation[] = [
  {
    approvalMode: "auto",
    code: "WALTJS",
    createdByUserId: "user-patient-walter",
    id: "invite-walter-caregiver-accepted",
    memberRole: "caregiver",
    patientUserId: "user-patient-walter",
    status: "accepted",
  },
  {
    approvalMode: "manual",
    code: "WALSKY",
    createdByUserId: "user-patient-walter",
    id: "invite-walter-family-accepted",
    memberRole: "family_member",
    patientUserId: "user-patient-walter",
    status: "accepted",
  },
  {
    approvalMode: "auto",
    code: "WALTQR",
    createdByUserId: "user-patient-walter",
    id: "invite-walter-caregiver-active",
    memberRole: "caregiver",
    patientUserId: "user-patient-walter",
    status: "active",
  },
  {
    approvalMode: "manual",
    code: "WALFAM",
    createdByUserId: "user-patient-walter",
    id: "invite-walter-family-active",
    memberRole: "family_member",
    patientUserId: "user-patient-walter",
    status: "active",
  },
  {
    approvalMode: "auto",
    code: "HECGUS",
    createdByUserId: "user-patient-hector",
    id: "invite-hector-caregiver-accepted",
    memberRole: "caregiver",
    patientUserId: "user-patient-hector",
    status: "accepted",
  },
  {
    approvalMode: "manual",
    code: "HECTUC",
    createdByUserId: "user-patient-hector",
    id: "invite-hector-family-accepted",
    memberRole: "family_member",
    patientUserId: "user-patient-hector",
    status: "accepted",
  },
  {
    approvalMode: "auto",
    code: "HECTQR",
    createdByUserId: "user-patient-hector",
    id: "invite-hector-caregiver-active",
    memberRole: "caregiver",
    patientUserId: "user-patient-hector",
    status: "active",
  },
  {
    approvalMode: "manual",
    code: "TUCQRM",
    createdByUserId: "user-patient-hector",
    id: "invite-hector-family-active",
    memberRole: "family_member",
    patientUserId: "user-patient-hector",
    status: "active",
  },
  {
    approvalMode: "auto",
    code: "SAUKYM",
    createdByUserId: "user-patient-saul",
    id: "invite-saul-caregiver-accepted",
    memberRole: "caregiver",
    patientUserId: "user-patient-saul",
    status: "accepted",
  },
  {
    approvalMode: "manual",
    code: "SAUCHK",
    createdByUserId: "user-patient-saul",
    id: "invite-saul-family-accepted",
    memberRole: "family_member",
    patientUserId: "user-patient-saul",
    status: "accepted",
  },
  {
    approvalMode: "auto",
    code: "SAULQR",
    createdByUserId: "user-patient-saul",
    id: "invite-saul-caregiver-active",
    memberRole: "caregiver",
    patientUserId: "user-patient-saul",
    status: "active",
  },
  {
    approvalMode: "manual",
    code: "JMMYQR",
    createdByUserId: "user-patient-saul",
    id: "invite-saul-family-active",
    memberRole: "family_member",
    patientUserId: "user-patient-saul",
    status: "active",
  },
];

const SEEDED_TEST_RELATIONSHIPS: SeedRelationship[] = [
  {
    id: "rel-walter-jesse",
    invitationId: "invite-walter-caregiver-accepted",
    inviteCode: "WALTJS",
    joinedAt: "now()",
    memberRole: "caregiver",
    patientUserId: "user-patient-walter",
    relatedUserId: "user-caregiver-jesse",
    relationshipStatus: "active",
  },
  {
    id: "rel-walter-skyler",
    invitationId: "invite-walter-family-accepted",
    inviteCode: "WALSKY",
    joinedAt: "now()",
    memberRole: "family_member",
    patientUserId: "user-patient-walter",
    relatedUserId: "user-family-skyler",
    relationshipStatus: "active",
  },
  {
    id: "rel-hector-gus",
    invitationId: "invite-hector-caregiver-accepted",
    inviteCode: "HECGUS",
    joinedAt: "now()",
    memberRole: "caregiver",
    patientUserId: "user-patient-hector",
    relatedUserId: "user-caregiver-gus",
    relationshipStatus: "active",
  },
  {
    id: "rel-hector-tuco",
    invitationId: "invite-hector-family-accepted",
    inviteCode: "HECTUC",
    joinedAt: "now()",
    memberRole: "family_member",
    patientUserId: "user-patient-hector",
    relatedUserId: "user-family-tuco",
    relationshipStatus: "active",
  },
  {
    id: "rel-saul-kim",
    invitationId: "invite-saul-caregiver-accepted",
    inviteCode: "SAUKYM",
    joinedAt: "now()",
    memberRole: "caregiver",
    patientUserId: "user-patient-saul",
    relatedUserId: "user-caregiver-kim",
    relationshipStatus: "active",
  },
  {
    id: "rel-saul-chuck",
    invitationId: "invite-saul-family-accepted",
    inviteCode: "SAUCHK",
    joinedAt: "now()",
    memberRole: "family_member",
    patientUserId: "user-patient-saul",
    relatedUserId: "user-family-chuck",
    relationshipStatus: "active",
  },
];

const SEEDED_TEST_MEDICATIONS: SeedMedication[] = [
  {
    createdByUserId: "user-caregiver-jesse",
    dosageUnit: "mg",
    dosageValue: "5",
    form: "Tablet",
    frequencyType: "daily",
    id: "med-walter-amlodipine",
    instructions: "Take after breakfast and before the evening meal.",
    isActive: true,
    logId: "log-walter-amlodipine-1",
    logNotes: "Morning dose completed.",
    logRecordedByUserId: "user-patient-walter",
    logStatus: "taken",
    name: "Amlodipine",
    patientUserId: "user-patient-walter",
    scheduleDays: EVERY_DAY,
    scheduleId: "sched-walter-amlodipine",
    scheduleTimes: ["08:00", "20:00"],
  },
  {
    createdByUserId: "user-caregiver-jesse",
    dosageUnit: "mg",
    dosageValue: "500",
    form: "Tablet",
    frequencyType: "daily",
    id: "med-walter-metformin",
    instructions: "Take with meals.",
    isActive: true,
    logId: "log-walter-metformin-1",
    logNotes: "Evening dose was delayed and missed.",
    logRecordedByUserId: "user-caregiver-jesse",
    logStatus: "missed",
    name: "Metformin",
    patientUserId: "user-patient-walter",
    scheduleDays: EVERY_DAY,
    scheduleId: "sched-walter-metformin",
    scheduleTimes: ["07:00", "19:00"],
  },
  {
    createdByUserId: "user-caregiver-gus",
    dosageUnit: "mg",
    dosageValue: "10",
    form: "Tablet",
    frequencyType: "daily",
    id: "med-hector-donepezil",
    instructions: "Give with water after breakfast.",
    isActive: true,
    logId: "log-hector-donepezil-1",
    logNotes: "Taken with breakfast.",
    logRecordedByUserId: "user-caregiver-gus",
    logStatus: "taken",
    name: "Donepezil",
    patientUserId: "user-patient-hector",
    scheduleDays: EVERY_DAY,
    scheduleId: "sched-hector-donepezil",
    scheduleTimes: ["09:00"],
  },
  {
    createdByUserId: "user-caregiver-kim",
    dosageUnit: "mg",
    dosageValue: "81",
    form: "Tablet",
    frequencyType: "daily",
    id: "med-saul-aspirin",
    instructions: "Take with a glass of water in the morning.",
    isActive: true,
    logId: "log-saul-aspirin-1",
    logNotes: "Recorded as skipped while away from home.",
    logRecordedByUserId: "user-patient-saul",
    logStatus: "skipped",
    name: "Aspirin",
    patientUserId: "user-patient-saul",
    scheduleDays: EVERY_DAY,
    scheduleId: "sched-saul-aspirin",
    scheduleTimes: ["08:30"],
  },
];

const SEEDED_TEST_ACTIVITIES: SeedActivity[] = [
  {
    category: "cardio",
    completionStatus: "done",
    createdByUserId: "user-caregiver-jesse",
    daysOfWeek: EVERY_DAY,
    frequencyType: "daily",
    id: "activity-walter-walk",
    instructions: "Walk around the block at an easy pace.",
    isActive: true,
    logId: "activity-log-walter-walk-1",
    logNotes: "Completed before lunch.",
    logRecordedByUserId: "user-patient-walter",
    patientUserId: "user-patient-walter",
    targetMinutes: 20,
    title: "Morning Walk",
  },
  {
    category: "mobility",
    completionStatus: "done",
    createdByUserId: "user-caregiver-gus",
    daysOfWeek: EVERY_DAY,
    frequencyType: "daily",
    id: "activity-hector-chair-stretch",
    instructions: "Guided seated stretches for shoulders and ankles.",
    isActive: true,
    logId: "activity-log-hector-chair-stretch-1",
    logNotes: "Completed with caregiver assistance.",
    logRecordedByUserId: "user-caregiver-gus",
    patientUserId: "user-patient-hector",
    targetMinutes: 15,
    title: "Chair Stretch Routine",
  },
  {
    category: "wellness",
    completionStatus: "done",
    createdByUserId: "user-caregiver-kim",
    daysOfWeek: ["Mon", "Wed", "Fri", "Sat"],
    frequencyType: "weekly",
    id: "activity-saul-breathing",
    instructions: "Two slow breathing sets before dinner.",
    isActive: true,
    logId: "activity-log-saul-breathing-1",
    logNotes: "Completed after a calendar reminder.",
    logRecordedByUserId: "user-patient-saul",
    patientUserId: "user-patient-saul",
    targetMinutes: 12,
    title: "Evening Breathing Exercise",
  },
];

const SEEDED_TEST_APPOINTMENTS: SeedAppointment[] = [
  {
    appointmentOffset: "3 days",
    createdByUserId: "user-caregiver-jesse",
    id: "appointment-walter-followup",
    location: "Albuquerque Medical Center",
    notes: "Bring blood pressure log and medication list.",
    patientUserId: "user-patient-walter",
    providerName: "Dr. Caldera",
    status: "scheduled",
    title: "Cardiology Follow-up",
  },
  {
    appointmentOffset: "5 days",
    createdByUserId: "user-caregiver-gus",
    id: "appointment-hector-therapy",
    location: "Rehab Wing B",
    notes: "Wheelchair transport required.",
    patientUserId: "user-patient-hector",
    providerName: "Dr. Ortega",
    status: "scheduled",
    title: "Physical Therapy Review",
  },
  {
    appointmentOffset: "7 days",
    createdByUserId: "user-caregiver-kim",
    id: "appointment-saul-checkup",
    location: "Sandpiper Clinic",
    notes: "Confirm fasting instructions the day before.",
    patientUserId: "user-patient-saul",
    providerName: "Dr. Main",
    status: "scheduled",
    title: "Routine Wellness Check",
  },
];

const schemaStatements = [
  `create table if not exists roles (
    id text primary key,
    slug text not null unique,
    label text not null,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists users (
    id text primary key,
    role_id text not null references roles(id) on delete restrict,
    email text not null unique,
    first_name text not null,
    last_name text not null,
    account_status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `alter table users add column if not exists phone text`,
  `alter table users add column if not exists password_hash text`,
  `alter table users add column if not exists password_salt text`,
  `alter table users add column if not exists onboarding_status text not null default 'ready'`,
  `alter table users add column if not exists last_login_at timestamptz`,
  `alter table users add column if not exists preferred_contact_method text not null default 'app'`,
  `alter table users add column if not exists time_format text not null default '12h'`,
  `alter table users add column if not exists large_text_enabled boolean not null default false`,
  `alter table users add column if not exists high_contrast_enabled boolean not null default false`,
  `alter table users add column if not exists daily_summary_enabled boolean not null default true`,
  `alter table users add column if not exists avatar_image_data_url text`,
  `create unique index if not exists users_phone_unique_idx on users(phone) where phone is not null`,
  `create table if not exists patient_profiles (
    user_id text primary key references users(id) on delete cascade,
    date_of_birth date,
    assistance_level text,
    emergency_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists care_relationships (
    id text primary key,
    patient_user_id text not null references users(id) on delete cascade,
    related_user_id text not null references users(id) on delete cascade,
    member_role text not null,
    relationship_status text not null default 'pending',
    invite_code text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint care_relationships_member_role_check
      check (member_role in ('caregiver', 'family_member')),
    constraint care_relationships_status_check
      check (relationship_status in ('pending', 'active', 'revoked'))
  )`,
  `create table if not exists care_invitations (
    id text primary key,
    patient_user_id text not null references users(id) on delete cascade,
    created_by_user_id text not null references users(id) on delete cascade,
    member_role text not null,
    invite_code text not null unique,
    approval_mode text not null default 'manual',
    status text not null default 'active',
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    accepted_at timestamptz,
    constraint care_invitations_member_role_check
      check (member_role in ('caregiver', 'family_member')),
    constraint care_invitations_approval_mode_check
      check (approval_mode in ('auto', 'manual')),
    constraint care_invitations_status_check
      check (status in ('active', 'accepted', 'expired', 'revoked'))
  )`,
  `alter table care_relationships add column if not exists invitation_id text references care_invitations(id) on delete set null`,
  `alter table care_relationships add column if not exists approved_by_user_id text references users(id) on delete set null`,
  `alter table care_relationships add column if not exists joined_at timestamptz`,
  `alter table care_relationships drop constraint if exists care_relationships_member_role_check`,
  `alter table care_relationships add constraint care_relationships_member_role_check
    check (member_role in ('caregiver', 'family_member'))`,
  `alter table care_relationships drop constraint if exists care_relationships_status_check`,
  `alter table care_relationships add constraint care_relationships_status_check
    check (relationship_status in ('pending', 'active', 'revoked'))`,
  `create table if not exists medications (
    id text primary key,
    patient_user_id text not null references users(id) on delete cascade,
    created_by_user_id text not null references users(id) on delete cascade,
    name text not null,
    form text not null,
    dosage_value text not null,
    dosage_unit text,
    image_data_url text,
    instructions text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists medication_schedules (
    id text primary key,
    medication_id text not null references medications(id) on delete cascade,
    patient_user_id text not null references users(id) on delete cascade,
    frequency_type text not null,
    days_of_week text[] not null default '{}',
    times_of_day text[] not null default '{}',
    interval_hours integer,
    start_date date,
    end_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists medication_logs (
    id text primary key,
    medication_id text not null references medications(id) on delete cascade,
    schedule_id text references medication_schedules(id) on delete set null,
    patient_user_id text not null references users(id) on delete cascade,
    recorded_by_user_id text not null references users(id) on delete cascade,
    client_ref text unique,
    logged_for_date date,
    scheduled_for timestamptz,
    taken_at timestamptz,
    status text not null,
    notes text,
    source text not null default 'online',
    created_at timestamptz not null default now(),
    constraint medication_logs_status_check
      check (status in ('taken', 'missed', 'skipped', 'queued_offline'))
  )`,
  `alter table medications add column if not exists image_data_url text`,
  `alter table medication_logs add column if not exists logged_for_date date`,
  `update medication_logs
   set logged_for_date = coalesce(logged_for_date, coalesce(taken_at, scheduled_for, created_at)::date)
   where logged_for_date is null`,
  `create table if not exists activity_plans (
    id text primary key,
    patient_user_id text not null references users(id) on delete cascade,
    created_by_user_id text not null references users(id) on delete cascade,
    title text not null,
    category text not null,
    instructions text,
    frequency_type text not null,
    days_of_week text[] not null default '{}',
    target_minutes integer,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists activity_logs (
    id text primary key,
    activity_plan_id text not null references activity_plans(id) on delete cascade,
    patient_user_id text not null references users(id) on delete cascade,
    recorded_by_user_id text references users(id) on delete set null,
    scheduled_for date,
    completion_status text not null,
    completed_at timestamptz,
    notes text,
    created_at timestamptz not null default now(),
    constraint activity_logs_completion_status_check
      check (completion_status in ('planned', 'done', 'missed'))
  )`,
  `create table if not exists appointments (
    id text primary key,
    patient_user_id text not null references users(id) on delete cascade,
    created_by_user_id text not null references users(id) on delete cascade,
    title text not null,
    provider_name text,
    location text,
    appointment_at timestamptz not null,
    status text not null default 'scheduled',
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists sync_events (
    id text primary key,
    patient_user_id text not null references users(id) on delete cascade,
    actor_user_id text references users(id) on delete set null,
    device_id text,
    sync_direction text not null,
    sync_status text not null,
    item_type text not null,
    item_count integer not null default 0,
    details jsonb,
    synced_at timestamptz not null default now()
  )`,
];

const indexStatements = [
  `create index if not exists users_role_idx on users(role_id)`,
  `create index if not exists patient_profiles_user_idx on patient_profiles(user_id)`,
  `create index if not exists care_relationships_patient_idx on care_relationships(patient_user_id)`,
  `create index if not exists care_relationships_related_idx on care_relationships(related_user_id)`,
  `create unique index if not exists care_relationships_pair_unique_idx on care_relationships(patient_user_id, related_user_id)`,
  `create index if not exists care_invitations_patient_idx on care_invitations(patient_user_id)`,
  `create index if not exists care_invitations_code_idx on care_invitations(invite_code)`,
  `create index if not exists medications_patient_idx on medications(patient_user_id)`,
  `create index if not exists medication_schedules_patient_idx on medication_schedules(patient_user_id)`,
  `create index if not exists medication_logs_patient_idx on medication_logs(patient_user_id)`,
  `create index if not exists medication_logs_logged_for_date_idx on medication_logs(logged_for_date)`,
  `create index if not exists medication_logs_taken_at_idx on medication_logs(taken_at)`,
  `create index if not exists activity_plans_patient_idx on activity_plans(patient_user_id)`,
  `create index if not exists activity_logs_patient_idx on activity_logs(patient_user_id)`,
  `create index if not exists appointments_patient_idx on appointments(patient_user_id)`,
];

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length > 0 ? digits : null;
}

function normalizePreferredContactMethod(
  value: unknown,
): PreferredContactMethod {
  return value === "email" || value === "sms" ? value : "app";
}

function normalizeTimeFormat(value: unknown): TimeFormatPreference {
  return value === "24h" ? "24h" : "12h";
}

function mapUserRow(row: UserRow): AuthenticatedUser {
  return {
    accountStatus: row.account_status,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    onboardingStatus: row.onboarding_status,
    phone: row.phone,
    profileImageDataUrl: row.avatar_image_data_url,
    preferences: {
      dailySummaryEnabled: row.daily_summary_enabled,
      highContrastEnabled: row.high_contrast_enabled,
      largeTextEnabled: row.large_text_enabled,
      preferredContactMethod: normalizePreferredContactMethod(
        row.preferred_contact_method,
      ),
      timeFormat: normalizeTimeFormat(row.time_format),
    },
    role: row.role,
    userId: row.user_id,
  };
}

function mapMedicationRow(row: MedicationRow): MedicationRecord {
  return {
    createdByDisplayName: row.created_by_display_name,
    dosageUnit: row.dosage_unit,
    dosageValue: row.dosage_value,
    form: row.form,
    id: row.id,
    imageDataUrl: row.image_data_url,
    instructions: row.instructions,
    isActive: row.is_active,
    latestLogStatus: row.latest_log_status,
    latestTakenAt: row.latest_taken_at,
    name: row.name,
    patientUserId: row.patient_user_id,
    scheduleDays: row.schedule_days ?? [],
    scheduleFrequencyType: row.schedule_frequency_type,
    scheduleId: row.schedule_id,
    scheduleTimes: row.schedule_times ?? [],
  };
}

function mapActivityRow(row: ActivityRow): ActivityPlanRecord {
  return {
    category: row.category,
    createdByDisplayName: row.created_by_display_name,
    daysOfWeek: row.days_of_week ?? [],
    frequencyType: row.frequency_type,
    id: row.id,
    instructions: row.instructions,
    isActive: row.is_active,
    latestCompletedAt: row.latest_completed_at,
    latestCompletionStatus: row.latest_completion_status,
    targetMinutes: row.target_minutes,
    title: row.title,
  };
}

function mapAppointmentRow(row: AppointmentRow): AppointmentRecord {
  return {
    appointmentAt: row.appointment_at,
    id: row.id,
    location: row.location,
    notes: row.notes,
    providerName: row.provider_name,
    status: row.status,
    title: row.title,
  };
}

function mapMedicationLogRow(row: MedicationLogRow): MedicationLogRecord {
  return {
    createdAt: row.created_at,
    id: row.id,
    loggedForDate: row.logged_for_date,
    medicationId: row.medication_id,
    medicationName: row.medication_name,
    notes: row.notes,
    recordedByDisplayName: row.recorded_by_display_name,
    scheduledFor: row.scheduled_for,
    source: row.source,
    status: row.status,
    takenAt: row.taken_at,
  };
}

function mapActivityLogRow(row: ActivityLogRow): ActivityLogRecord {
  return {
    activityPlanId: row.activity_plan_id,
    activityTitle: row.activity_title,
    completionStatus: row.completion_status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    id: row.id,
    notes: row.notes,
    recordedByDisplayName: row.recorded_by_display_name,
    scheduledFor: row.scheduled_for,
  };
}

let schemaReady = false;
let schemaReadyPromise: Promise<void> | null = null;

async function rawQuery<T>(query: string, params: unknown[] = []) {
  const sql = getSql();
  return (await sql.query(query, params)) as T[];
}

async function ensureMedicSchemaReady() {
  if (schemaReady) {
    return;
  }

  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await ensureMedicSchema();
      schemaReady = true;
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  await schemaReadyPromise;
}

async function queryMany<T>(query: string, params: unknown[] = []) {
  await ensureMedicSchemaReady();
  return rawQuery<T>(query, params);
}

async function queryOne<T>(query: string, params: unknown[] = []) {
  const rows = await queryMany<T>(query, params);
  return rows[0] ?? null;
}

async function ensureReferenceRoles() {
  const roleStatements = [
    {
      id: PATIENT_ROLE_ID,
      label: "Patient",
      slug: "patient",
    },
    {
      id: CAREGIVER_ROLE_ID,
      label: "Caregiver",
      slug: "caregiver",
    },
    {
      id: FAMILY_ROLE_ID,
      label: "Family Member",
      slug: "family_member",
    },
  ] as const;

  for (const role of roleStatements) {
    await rawQuery(
      `insert into roles (id, slug, label)
       values ($1, $2, $3)
       on conflict (id) do update
       set slug = excluded.slug,
           label = excluded.label`,
      [role.id, role.slug, role.label],
    );
  }
}

function roleToRoleId(role: RoleSlug) {
  switch (role) {
    case "patient":
      return PATIENT_ROLE_ID;
    case "caregiver":
      return CAREGIVER_ROLE_ID;
    case "family_member":
      return FAMILY_ROLE_ID;
    default:
      return PATIENT_ROLE_ID;
  }
}

export async function ensureMedicSchema() {
  for (const statement of schemaStatements) {
    await rawQuery(statement);
  }

  for (const statement of indexStatements) {
    await rawQuery(statement);
  }

  await ensureReferenceRoles();
  schemaReady = true;
  schemaReadyPromise = Promise.resolve();
}

async function seedDemoUsers() {
  for (const user of SEEDED_TEST_USERS) {
    const password = createPasswordHash(DEMO_PASSWORD);

    await queryMany(
      `insert into users (
         id,
         role_id,
         email,
         phone,
         first_name,
         last_name,
         account_status,
         onboarding_status,
         password_hash,
         password_salt
       )
       values ($1, $2, $3, $4, $5, $6, 'active', 'ready', $7, $8)
       on conflict (id) do update
       set role_id = excluded.role_id,
           email = excluded.email,
           phone = excluded.phone,
           first_name = excluded.first_name,
           last_name = excluded.last_name,
           account_status = excluded.account_status,
           onboarding_status = excluded.onboarding_status,
           password_hash = excluded.password_hash,
           password_salt = excluded.password_salt,
           updated_at = now()`,
      [
        user.id,
        roleToRoleId(user.role),
        user.email,
        user.phone,
        user.firstName,
        user.lastName,
        password.hash,
        password.salt,
      ],
    );
  }

  for (const user of SEEDED_TEST_USERS.filter((entry) => entry.role === "patient")) {
    await queryMany(
      `insert into patient_profiles (user_id, date_of_birth, assistance_level, emergency_notes)
       values ($1, $2::date, $3, $4)
       on conflict (user_id) do update
       set date_of_birth = excluded.date_of_birth,
           assistance_level = excluded.assistance_level,
           emergency_notes = excluded.emergency_notes,
           updated_at = now()`,
      [
        user.id,
        user.dateOfBirth || null,
        user.assistanceLevel || null,
        user.emergencyNotes || null,
      ],
    );
  }
}

async function seedDemoRelationshipsAndInvites() {
  for (const invitation of SEEDED_TEST_INVITATIONS) {
    await queryMany(
      `insert into care_invitations (
         id,
         patient_user_id,
         created_by_user_id,
         member_role,
         invite_code,
         approval_mode,
         status,
         expires_at,
         accepted_at
       )
       values ($1, $2, $3, $4, $5, $6, $7, now() + interval '30 days', $8)
       on conflict (id) do update
       set patient_user_id = excluded.patient_user_id,
           created_by_user_id = excluded.created_by_user_id,
           member_role = excluded.member_role,
           invite_code = excluded.invite_code,
           approval_mode = excluded.approval_mode,
           status = excluded.status,
           expires_at = excluded.expires_at,
           accepted_at = excluded.accepted_at`,
      [
        invitation.id,
        invitation.patientUserId,
        invitation.createdByUserId,
        invitation.memberRole,
        invitation.code,
        invitation.approvalMode,
        invitation.status,
        invitation.status === "accepted" ? new Date().toISOString() : null,
      ],
    );
  }

  for (const relationship of SEEDED_TEST_RELATIONSHIPS) {
    await queryMany(
      `insert into care_relationships (
         id,
         patient_user_id,
         related_user_id,
         member_role,
         relationship_status,
         invite_code,
         invitation_id,
         joined_at
       )
       values ($1, $2, $3, $4, $5, $6, $7, now())
       on conflict (id) do update
       set patient_user_id = excluded.patient_user_id,
           related_user_id = excluded.related_user_id,
           member_role = excluded.member_role,
           relationship_status = excluded.relationship_status,
           invite_code = excluded.invite_code,
           invitation_id = excluded.invitation_id,
           joined_at = excluded.joined_at,
           updated_at = now()`,
      [
        relationship.id,
        relationship.patientUserId,
        relationship.relatedUserId,
        relationship.memberRole,
        relationship.relationshipStatus,
        relationship.inviteCode,
        relationship.invitationId,
      ],
    );
  }
}

async function seedDemoMedicationAndWellnessData() {
  for (const medication of SEEDED_TEST_MEDICATIONS) {
    await queryMany(
      `insert into medications (
         id,
         patient_user_id,
         created_by_user_id,
         name,
         form,
         dosage_value,
         dosage_unit,
         instructions,
         is_active
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (id) do update
       set patient_user_id = excluded.patient_user_id,
           created_by_user_id = excluded.created_by_user_id,
           name = excluded.name,
           form = excluded.form,
           dosage_value = excluded.dosage_value,
           dosage_unit = excluded.dosage_unit,
           instructions = excluded.instructions,
           is_active = excluded.is_active,
           updated_at = now()`,
      [
        medication.id,
        medication.patientUserId,
        medication.createdByUserId,
        medication.name,
        medication.form,
        medication.dosageValue,
        medication.dosageUnit || null,
        medication.instructions || null,
        medication.isActive,
      ],
    );

    await queryMany(
      `insert into medication_schedules (
         id,
         medication_id,
         patient_user_id,
         frequency_type,
         days_of_week,
         times_of_day,
         start_date
       )
       values ($1, $2, $3, $4, $5, $6, current_date)
       on conflict (id) do update
       set medication_id = excluded.medication_id,
           patient_user_id = excluded.patient_user_id,
           frequency_type = excluded.frequency_type,
           days_of_week = excluded.days_of_week,
           times_of_day = excluded.times_of_day,
           updated_at = now()`,
      [
        medication.scheduleId,
        medication.id,
        medication.patientUserId,
        medication.frequencyType,
        medication.scheduleDays,
        medication.scheduleTimes,
      ],
    );

    await queryMany(
      `insert into medication_logs (
         id,
         medication_id,
         schedule_id,
         patient_user_id,
         recorded_by_user_id,
         client_ref,
         scheduled_for,
         taken_at,
         status,
         notes,
         source
       )
       values ($1, $2, $3, $4, $5, $6, now(), $7, $8, $9, 'seed')
       on conflict (id) do update
       set medication_id = excluded.medication_id,
           schedule_id = excluded.schedule_id,
           patient_user_id = excluded.patient_user_id,
           recorded_by_user_id = excluded.recorded_by_user_id,
           client_ref = excluded.client_ref,
           scheduled_for = excluded.scheduled_for,
           taken_at = excluded.taken_at,
           status = excluded.status,
           notes = excluded.notes,
           source = excluded.source`,
      [
        medication.logId,
        medication.id,
        medication.scheduleId,
        medication.patientUserId,
        medication.logRecordedByUserId,
        `${medication.logId}-client`,
        medication.logStatus === "taken" ? new Date().toISOString() : null,
        medication.logStatus,
        medication.logNotes || null,
      ],
    );
  }

  for (const activity of SEEDED_TEST_ACTIVITIES) {
    await queryMany(
      `insert into activity_plans (
         id,
         patient_user_id,
         created_by_user_id,
         title,
         category,
         instructions,
         frequency_type,
         days_of_week,
         target_minutes,
         is_active
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (id) do update
       set patient_user_id = excluded.patient_user_id,
           created_by_user_id = excluded.created_by_user_id,
           title = excluded.title,
           category = excluded.category,
           instructions = excluded.instructions,
           frequency_type = excluded.frequency_type,
           days_of_week = excluded.days_of_week,
           target_minutes = excluded.target_minutes,
           is_active = excluded.is_active,
           updated_at = now()`,
      [
        activity.id,
        activity.patientUserId,
        activity.createdByUserId,
        activity.title,
        activity.category,
        activity.instructions || null,
        activity.frequencyType,
        activity.daysOfWeek,
        activity.targetMinutes,
        activity.isActive,
      ],
    );

    await queryMany(
      `insert into activity_logs (
         id,
         activity_plan_id,
         patient_user_id,
         recorded_by_user_id,
         scheduled_for,
         completion_status,
         completed_at,
         notes
       )
       values ($1, $2, $3, $4, current_date, $5, $6, $7)
       on conflict (id) do update
       set activity_plan_id = excluded.activity_plan_id,
           patient_user_id = excluded.patient_user_id,
           recorded_by_user_id = excluded.recorded_by_user_id,
           scheduled_for = excluded.scheduled_for,
           completion_status = excluded.completion_status,
           completed_at = excluded.completed_at,
           notes = excluded.notes`,
      [
        activity.logId,
        activity.id,
        activity.patientUserId,
        activity.logRecordedByUserId,
        activity.completionStatus,
        activity.completionStatus === "done" ? new Date().toISOString() : null,
        activity.logNotes || null,
      ],
    );
  }

  for (const appointment of SEEDED_TEST_APPOINTMENTS) {
    await queryMany(
      `insert into appointments (
         id,
         patient_user_id,
         created_by_user_id,
         title,
         provider_name,
         location,
         appointment_at,
         status,
         notes
       )
       values ($1, $2, $3, $4, $5, $6, now() + ($7)::interval, $8, $9)
       on conflict (id) do update
       set patient_user_id = excluded.patient_user_id,
           created_by_user_id = excluded.created_by_user_id,
           title = excluded.title,
           provider_name = excluded.provider_name,
           location = excluded.location,
           appointment_at = excluded.appointment_at,
           status = excluded.status,
           notes = excluded.notes,
           updated_at = now()`,
      [
        appointment.id,
        appointment.patientUserId,
        appointment.createdByUserId,
        appointment.title,
        appointment.providerName || null,
        appointment.location || null,
        appointment.appointmentOffset,
        appointment.status,
        appointment.notes || null,
      ],
    );
  }
}

export async function bootstrapMedicSchema() {
  await ensureMedicSchema();
  await seedDemoUsers();
  await seedDemoRelationshipsAndInvites();
  await seedDemoMedicationAndWellnessData();
  return getMedicSnapshot();
}

export async function purgeMedicTestingData() {
  await ensureMedicSchema();
  await queryMany(
    `truncate table
       sync_events,
       activity_logs,
       activity_plans,
       appointments,
       medication_logs,
       medication_schedules,
       medications,
       care_relationships,
       care_invitations,
       patient_profiles,
       users
     restart identity cascade`,
  );
}

export async function resetMedicTestingData() {
  await purgeMedicTestingData();
  await ensureMedicSchema();
  await seedDemoUsers();
  await seedDemoRelationshipsAndInvites();
  await seedDemoMedicationAndWellnessData();
  return getMedicSnapshot();
}

export async function getMedicSnapshot() {
  await ensureMedicSchema();
  const [
    roles,
    users,
    patientProfiles,
    relationships,
    invitations,
    medications,
    schedules,
    logs,
    activities,
    appointments,
    syncEvents,
  ] =
    await Promise.all([
      queryMany<{ slug: string }>(`select slug from roles order by slug asc`),
      queryMany<{ id: string }>(`select id from users order by id asc`),
      queryMany<{ user_id: string }>(
        `select user_id from patient_profiles order by user_id asc`,
      ),
      queryMany<{ id: string }>(
        `select id from care_relationships order by id asc`,
      ),
      queryMany<{ id: string }>(`select id from care_invitations order by id asc`),
      queryMany<{ id: string }>(`select id from medications order by id asc`),
      queryMany<{ id: string }>(`select id from medication_schedules order by id asc`),
      queryMany<{ id: string }>(`select id from medication_logs order by id asc`),
      queryMany<{ id: string }>(`select id from activity_plans order by id asc`),
      queryMany<{ id: string }>(`select id from appointments order by id asc`),
      queryMany<{ id: string }>(`select id from sync_events order by id asc`),
    ]);

  return {
    counts: {
      activityPlans: activities.length,
      appointments: appointments.length,
      invitations: invitations.length,
      careRelationships: relationships.length,
      medicationLogs: logs.length,
      medicationSchedules: schedules.length,
      medications: medications.length,
      patientProfiles: patientProfiles.length,
      roles: roles.length,
      syncEvents: syncEvents.length,
      users: users.length,
    },
    demoCredentials: {
      password: DEMO_PASSWORD,
      users: SEEDED_TEST_USERS.map((user) => user.email),
    },
  };
}

export async function getTestingWorkbenchSnapshot() {
  await ensureMedicSchema();

  const [
    users,
    patients,
    recentInvitations,
    recentMedications,
    recentActivities,
    recentAppointments,
  ] = await Promise.all([
    queryMany<TestingWorkbenchUserRow>(
      `select
         users.id as user_id,
         roles.slug as role,
         trim(users.first_name || ' ' || users.last_name) as display_name,
         users.email,
         users.phone,
         (patient_profiles.user_id is not null) as has_patient_profile
       from users
       join roles on roles.id = users.role_id
       left join patient_profiles on patient_profiles.user_id = users.id
       order by users.created_at desc, users.first_name asc`,
    ),
    queryMany<TestingWorkbenchPatientRow>(
      `select
         users.id as user_id,
         trim(users.first_name || ' ' || users.last_name) as display_name
       from users
       join roles on roles.id = users.role_id
       where roles.slug = 'patient'
       order by users.first_name asc, users.last_name asc`,
    ),
    queryMany<TestingWorkbenchInvitationRow>(
      `select
         care_invitations.invite_code as code,
         care_invitations.member_role,
         care_invitations.approval_mode,
         care_invitations.status,
         care_invitations.created_at::text,
         trim(patient_user.first_name || ' ' || patient_user.last_name) as patient_display_name
       from care_invitations
       join users as patient_user on patient_user.id = care_invitations.patient_user_id
       order by care_invitations.created_at desc
       limit 6`,
    ),
    queryMany<TestingWorkbenchMedicationRow>(
      `select
         medications.id,
         medications.name,
         trim(patient_user.first_name || ' ' || patient_user.last_name) as patient_display_name,
         trim(created_by_user.first_name || ' ' || created_by_user.last_name) as created_by_display_name,
         medication_schedules.frequency_type as schedule_frequency_type,
         medication_schedules.days_of_week as schedule_days,
         medication_schedules.times_of_day as schedule_times
       from medications
       join users as patient_user on patient_user.id = medications.patient_user_id
       join users as created_by_user on created_by_user.id = medications.created_by_user_id
       left join medication_schedules on medication_schedules.medication_id = medications.id
       order by medications.created_at desc
       limit 6`,
    ),
    queryMany<TestingWorkbenchActivityRow>(
      `select
         activity_plans.id,
         activity_plans.title,
         activity_plans.category,
         trim(patient_user.first_name || ' ' || patient_user.last_name) as patient_display_name
       from activity_plans
       join users as patient_user on patient_user.id = activity_plans.patient_user_id
       order by activity_plans.created_at desc
       limit 6`,
    ),
    queryMany<TestingWorkbenchAppointmentRow>(
      `select
         appointments.id,
         appointments.title,
         appointments.appointment_at::text,
         trim(patient_user.first_name || ' ' || patient_user.last_name) as patient_display_name
       from appointments
       join users as patient_user on patient_user.id = appointments.patient_user_id
       order by appointments.created_at desc
       limit 6`,
    ),
  ]);

  return {
    patients: patients.map((row) => ({
      displayName: row.display_name,
      userId: row.user_id,
    })),
    recentActivities: recentActivities.map((row) => ({
      category: row.category,
      id: row.id,
      patientDisplayName: row.patient_display_name,
      title: row.title,
    })),
    recentAppointments: recentAppointments.map((row) => ({
      appointmentAt: row.appointment_at,
      id: row.id,
      patientDisplayName: row.patient_display_name,
      title: row.title,
    })),
    recentInvitations: recentInvitations.map((row) => ({
      approvalMode: row.approval_mode,
      code: row.code,
      createdAt: row.created_at,
      memberRole: row.member_role,
      patientDisplayName: row.patient_display_name,
      status: row.status,
    })),
    recentMedications: recentMedications.map((row) => ({
      createdByDisplayName: row.created_by_display_name,
      id: row.id,
      name: row.name,
      patientDisplayName: row.patient_display_name,
      scheduleSummary: [
        row.schedule_frequency_type || "manual",
        row.schedule_times?.join(", ") || "no times",
        row.schedule_days?.join(", ") || "no day pattern",
      ].join(" · "),
    })),
    users: users.map((row) => ({
      displayName: row.display_name,
      email: row.email,
      hasPatientProfile: row.has_patient_profile,
      phone: row.phone,
      role: row.role,
      userId: row.user_id,
    })),
  } satisfies TestingWorkbenchSnapshot;
}

export async function getUserById(userId: string) {
  const row = await queryOne<UserRow>(
    `select
       users.id as user_id,
       roles.slug as role,
       users.email,
       users.phone,
       users.first_name,
       users.last_name,
       users.account_status,
       users.onboarding_status,
       users.avatar_image_data_url,
       users.preferred_contact_method,
       users.time_format,
       users.large_text_enabled,
       users.high_contrast_enabled,
       users.daily_summary_enabled
     from users
     join roles on roles.id = users.role_id
     where users.id = $1`,
    [userId],
  );

  return row ? mapUserRow(row) : null;
}

export async function getUserForAuth(identifier: string) {
  const normalizedEmail = identifier.includes("@") ? normalizeEmail(identifier) : null;
  const normalizedPhone = normalizePhone(identifier);

  const row = await queryOne<AuthUserRow>(
    `select
       users.id as user_id,
       roles.slug as role,
       users.email,
       users.phone,
       users.first_name,
       users.last_name,
       users.account_status,
       users.onboarding_status,
       users.avatar_image_data_url,
       users.preferred_contact_method,
       users.time_format,
       users.large_text_enabled,
       users.high_contrast_enabled,
       users.daily_summary_enabled,
       users.password_hash,
       users.password_salt
     from users
     join roles on roles.id = users.role_id
     where lower(users.email) = lower(coalesce($1, ''))
        or users.phone = $2`,
    [normalizedEmail, normalizedPhone],
  );

  return row;
}

export async function registerUser(input: {
  approvalMode?: InviteApprovalMode;
  assistanceLevel?: string;
  dateOfBirth?: string;
  email: string;
  emergencyNotes?: string;
  firstName: string;
  inviteCode?: string;
  lastName: string;
  password: string;
  phone?: string;
  role: RoleSlug;
}) {
  await ensureMedicSchema();
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const password = input.password.trim();

  if (!firstName || !lastName || !normalizedEmail || !password) {
    throw new Error("First name, last name, email, and password are required.");
  }

  if (input.inviteCode && input.role === "patient") {
    throw new Error("Patient accounts cannot be created from a join invite.");
  }

  const existingUser = await queryOne<{ id: string }>(
    `select id from users where lower(email) = lower($1) or phone = $2`,
    [normalizedEmail, normalizedPhone],
  );

  if (existingUser) {
    throw new Error("An account with that email or phone already exists.");
  }

  const { hash, salt } = createPasswordHash(password);
  const userId = createId("user");

  await queryMany(
    `insert into users (
       id,
       role_id,
       email,
       phone,
       first_name,
       last_name,
       account_status,
       onboarding_status,
       password_hash,
       password_salt
     )
     values ($1, $2, $3, $4, $5, $6, 'active', 'ready', $7, $8)`,
    [
      userId,
      roleToRoleId(input.role),
      normalizedEmail,
      normalizedPhone,
      firstName,
      lastName,
      hash,
      salt,
    ],
  );

  if (input.role === "patient") {
    await queryMany(
      `insert into patient_profiles (
         user_id,
         date_of_birth,
         assistance_level,
         emergency_notes
       )
       values ($1, $2, $3, $4)`,
      [
        userId,
        input.dateOfBirth ? input.dateOfBirth : null,
        input.assistanceLevel || "independent",
        input.emergencyNotes?.trim() || null,
      ],
    );
  }

  if (input.inviteCode && input.role !== "patient") {
    await acceptInvitation({
      approvalModeOverride: input.approvalMode,
      code: input.inviteCode,
      userId,
    });
  }

  const user = await getUserById(userId);

  if (!user) {
    throw new Error("Failed to load the account after registration.");
  }

  return user;
}

export async function authenticateUser(input: {
  identifier: string;
  password: string;
}) {
  await ensureMedicSchema();
  const user = await getUserForAuth(input.identifier);

  if (!user) {
    throw new Error("No account matched that email or phone.");
  }

  if (
    !verifyPassword({
      password: input.password,
      storedHash: user.password_hash,
      storedSalt: user.password_salt,
    })
  ) {
    throw new Error("Incorrect password.");
  }

  await queryMany(`update users set last_login_at = now() where id = $1`, [user.user_id]);

  return mapUserRow(user);
}

export async function getPatientProfile(patientUserId: string) {
  const row = await queryOne<{
    assistance_level: string | null;
    date_of_birth: string | null;
    emergency_notes: string | null;
    patient_user_id: string;
  }>(
    `select
       patient_profiles.user_id as patient_user_id,
       patient_profiles.date_of_birth::text as date_of_birth,
       patient_profiles.assistance_level,
       patient_profiles.emergency_notes
     from patient_profiles
     where patient_profiles.user_id = $1`,
    [patientUserId],
  );

  if (!row) {
    return null;
  }

  return {
    assistanceLevel: row.assistance_level,
    dateOfBirth: row.date_of_birth,
    emergencyNotes: row.emergency_notes,
    patientUserId: row.patient_user_id,
  } satisfies PatientProfile;
}

export async function updateUserAccount(input: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  profileImageDataUrl?: string | null;
  userId: string;
}) {
  await ensureMedicSchema();

  const nextEmail = normalizeEmail(input.email);
  const nextPhone = normalizePhone(input.phone);
  const existingUser = await queryOne<{ id: string }>(
    `select id
     from users
     where (lower(email) = lower($1) or phone = $2)
       and id <> $3`,
    [nextEmail, nextPhone, input.userId],
  );

  if (existingUser) {
    throw new Error("Another account already uses that email or phone.");
  }

  await queryMany(
    `update users
     set email = $1,
         phone = $2,
         first_name = $3,
         last_name = $4,
         avatar_image_data_url = $5,
         updated_at = now()
     where id = $6`,
    [
      nextEmail,
      nextPhone,
      input.firstName.trim(),
      input.lastName.trim(),
      input.profileImageDataUrl || null,
      input.userId,
    ],
  );

  const updatedUser = await getUserById(input.userId);

  if (!updatedUser) {
    throw new Error("Failed to reload the updated account.");
  }

  return updatedUser;
}

export async function updatePatientHealthProfile(input: {
  assistanceLevel?: string | null;
  dateOfBirth?: string | null;
  emergencyNotes?: string | null;
  patientUserId: string;
}) {
  await ensureMedicSchema();

  await queryMany(
    `insert into patient_profiles (
       user_id,
       date_of_birth,
       assistance_level,
       emergency_notes
     )
     values ($1, $2, $3, $4)
     on conflict (user_id) do update
     set date_of_birth = excluded.date_of_birth,
         assistance_level = excluded.assistance_level,
         emergency_notes = excluded.emergency_notes,
         updated_at = now()`,
    [
      input.patientUserId,
      input.dateOfBirth || null,
      input.assistanceLevel || null,
      input.emergencyNotes?.trim() || null,
    ],
  );

  return getPatientProfile(input.patientUserId);
}

export async function updateUserPreferences(input: {
  dailySummaryEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
  preferredContactMethod: PreferredContactMethod;
  timeFormat: TimeFormatPreference;
  userId: string;
}) {
  await ensureMedicSchema();

  await queryMany(
    `update users
     set preferred_contact_method = $1,
         time_format = $2,
         large_text_enabled = $3,
         high_contrast_enabled = $4,
         daily_summary_enabled = $5,
         updated_at = now()
     where id = $6`,
    [
      normalizePreferredContactMethod(input.preferredContactMethod),
      normalizeTimeFormat(input.timeFormat),
      input.largeTextEnabled,
      input.highContrastEnabled,
      input.dailySummaryEnabled,
      input.userId,
    ],
  );

  const updatedUser = await getUserById(input.userId);

  if (!updatedUser) {
    throw new Error("Failed to reload the updated settings.");
  }

  return updatedUser;
}

export async function listPatientConnections(patientUserId: string) {
  const rows = await queryMany<RelationshipRow>(
    `select
       care_relationships.id,
       care_relationships.relationship_status,
       care_relationships.member_role,
       care_relationships.invitation_id,
       care_relationships.joined_at::text as joined_at,
       care_relationships.patient_user_id,
       care_relationships.related_user_id,
       trim(patient_user.first_name || ' ' || patient_user.last_name) as patient_display_name,
       trim(related_user.first_name || ' ' || related_user.last_name) as related_display_name
     from care_relationships
     join users as patient_user on patient_user.id = care_relationships.patient_user_id
     join users as related_user on related_user.id = care_relationships.related_user_id
     where care_relationships.patient_user_id = $1
     order by care_relationships.created_at desc`,
    [patientUserId],
  );

  return rows.map((row) => ({
    id: row.id,
    invitationId: row.invitation_id,
    joinedAt: row.joined_at,
    memberRole: row.member_role,
    patientDisplayName: row.patient_display_name,
    patientUserId: row.patient_user_id,
    relatedDisplayName: row.related_display_name,
    relatedUserId: row.related_user_id,
    relationshipStatus: row.relationship_status,
  })) satisfies CareRelationship[];
}

export async function listLinkedPatientsForMember(userId: string) {
  const rows = await queryMany<{
    patient_display_name: string;
    patient_user_id: string;
    relationship_id: string;
    relationship_status: "pending" | "active" | "revoked";
  }>(
    `select
       care_relationships.id as relationship_id,
       care_relationships.relationship_status,
       care_relationships.patient_user_id,
       trim(patient_user.first_name || ' ' || patient_user.last_name) as patient_display_name
     from care_relationships
     join users as patient_user on patient_user.id = care_relationships.patient_user_id
     where care_relationships.related_user_id = $1
     order by care_relationships.created_at desc`,
    [userId],
  );

  return rows.map((row) => ({
    patientDisplayName: row.patient_display_name,
    patientUserId: row.patient_user_id,
    relationshipId: row.relationship_id,
    relationshipStatus: row.relationship_status,
  })) satisfies LinkedPatientSummary[];
}

export async function createInvitation(input: {
  approvalMode: InviteApprovalMode;
  createdByUserId: string;
  memberRole: RoleSlug;
  patientUserId: string;
}) {
  await ensureMedicSchema();
  const inviteId = createId("invite");
  const inviteCode = createInviteCode();

  await queryMany(
    `insert into care_invitations (
       id,
       patient_user_id,
       created_by_user_id,
       member_role,
       invite_code,
       approval_mode,
       status,
       expires_at
     )
     values ($1, $2, $3, $4, $5, $6, 'active', now() + interval '30 days')`,
    [
      inviteId,
      input.patientUserId,
      input.createdByUserId,
      input.memberRole,
      inviteCode,
      input.approvalMode,
    ],
  );

  const preview = await getInvitationPreviewByCode(inviteCode);

  if (!preview) {
    throw new Error("Failed to create the invitation preview.");
  }

  return {
    ...preview,
    invitePath: buildInvitePath(preview.code),
  } satisfies ShareableInvitation;
}

export async function listInvitationsForPatient(patientUserId: string) {
  const rows = await queryMany<InvitationRow>(
    `select
       care_invitations.id as invite_id,
       care_invitations.invite_code as code,
       care_invitations.member_role,
       care_invitations.approval_mode,
       care_invitations.status,
       care_invitations.created_at::text as created_at,
       care_invitations.expires_at::text as expires_at,
       trim(patient_user.first_name || ' ' || patient_user.last_name) as patient_display_name,
       care_invitations.patient_user_id
     from care_invitations
     join users as patient_user on patient_user.id = care_invitations.patient_user_id
     where care_invitations.patient_user_id = $1
     order by care_invitations.created_at desc`,
    [patientUserId],
  );

  return rows.map((row) => ({
    approvalMode: row.approval_mode,
    code: row.code,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    inviteId: row.invite_id,
    memberRole: row.member_role,
    patientDisplayName: row.patient_display_name,
    patientUserId: row.patient_user_id,
    status: row.status,
  })) satisfies CareInvitationPreview[];
}

export async function getInvitationPreviewByCode(code: string) {
  const normalizedCode = normalizeInviteCode(code);
  const row = await queryOne<InvitationRow>(
    `select
       care_invitations.id as invite_id,
       care_invitations.invite_code as code,
       care_invitations.member_role,
       care_invitations.approval_mode,
       care_invitations.status,
       care_invitations.created_at::text as created_at,
       care_invitations.expires_at::text as expires_at,
       trim(patient_user.first_name || ' ' || patient_user.last_name) as patient_display_name,
       care_invitations.patient_user_id
     from care_invitations
     join users as patient_user on patient_user.id = care_invitations.patient_user_id
     where care_invitations.invite_code = $1`,
    [normalizedCode],
  );

  if (!row) {
    return null;
  }

  return {
    approvalMode: row.approval_mode,
    code: row.code,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    inviteId: row.invite_id,
    memberRole: row.member_role,
    patientDisplayName: row.patient_display_name,
    patientUserId: row.patient_user_id,
    status: row.status,
  } satisfies CareInvitationPreview;
}

export async function acceptInvitation(input: {
  approvalModeOverride?: InviteApprovalMode;
  code: string;
  userId: string;
}) {
  await ensureMedicSchema();
  const preview = await getInvitationPreviewByCode(input.code);

  if (!preview) {
    throw new Error("That invite code is invalid.");
  }

  if (preview.status !== "active") {
    throw new Error("That invite is no longer active.");
  }

  const user = await getUserById(input.userId);

  if (!user) {
    throw new Error("The account accepting this invite could not be found.");
  }

  if (user.role !== preview.memberRole) {
    throw new Error(
      `This invite is for a ${preview.memberRole.replace("_", " ")} account.`,
    );
  }

  if (user.userId === preview.patientUserId) {
    throw new Error("Patients cannot use their own join invite.");
  }

  const existingRelationship = await queryOne<{
    id: string;
    relationship_status: "active" | "pending" | "revoked";
  }>(
    `select
       id,
       relationship_status
     from care_relationships
     where patient_user_id = $1 and related_user_id = $2`,
    [preview.patientUserId, input.userId],
  );

  const relationshipStatus =
    (input.approvalModeOverride || preview.approvalMode) === "auto"
      ? "active"
      : "pending";

  if (existingRelationship) {
    if (existingRelationship.relationship_status === "active") {
      return {
        relationshipStatus: "active",
      };
    }

    await queryMany(
      `update care_relationships
       set member_role = $1,
           relationship_status = $2,
           invite_code = $3,
           invitation_id = $4,
           joined_at = $5,
           updated_at = now()
       where id = $6`,
      [
        preview.memberRole,
        relationshipStatus,
        preview.code,
        preview.inviteId,
        relationshipStatus === "active" ? new Date().toISOString() : null,
        existingRelationship.id,
      ],
    );

    if (relationshipStatus === "active") {
      await queryMany(
        `update care_invitations
         set status = 'accepted',
             accepted_at = now()
         where id = $1`,
        [preview.inviteId],
      );
    }

    return {
      relationshipStatus,
    };
  }

  await queryMany(
    `insert into care_relationships (
       id,
       patient_user_id,
       related_user_id,
       member_role,
       relationship_status,
       invite_code,
       invitation_id,
       joined_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      createId("rel"),
      preview.patientUserId,
      input.userId,
      preview.memberRole,
      relationshipStatus,
      preview.code,
      preview.inviteId,
      relationshipStatus === "active" ? new Date().toISOString() : null,
    ],
  );

  if (relationshipStatus === "active") {
    await queryMany(
      `update care_invitations
       set status = 'accepted',
           accepted_at = now()
       where id = $1`,
      [preview.inviteId],
    );
  }

  return {
    relationshipStatus,
  };
}

export async function approveRelationship(input: {
  patientUserId: string;
  relationshipId: string;
  approverUserId: string;
}) {
  await queryMany(
    `update care_relationships
     set relationship_status = 'active',
         approved_by_user_id = $1,
         joined_at = coalesce(joined_at, now()),
         updated_at = now()
     where id = $2 and patient_user_id = $3`,
    [input.approverUserId, input.relationshipId, input.patientUserId],
  );
}

export async function revokeRelationship(input: {
  patientUserId: string;
  relationshipId: string;
}) {
  await queryMany(
    `update care_relationships
     set relationship_status = 'revoked',
         updated_at = now()
     where id = $1 and patient_user_id = $2`,
    [input.relationshipId, input.patientUserId],
  );
}

export async function createMedicationWithSchedule(input: {
  createdByUserId: string;
  daysOfWeek: string[];
  dosageUnit?: string | null;
  dosageValue: string;
  form: string;
  frequencyType: string;
  imageDataUrl?: string | null;
  instructions?: string | null;
  name: string;
  patientUserId: string;
  timesOfDay: string[];
}) {
  const medicationId = createId("med");
  const scheduleId = createId("sched");

  await queryMany(
    `insert into medications (
       id,
       patient_user_id,
       created_by_user_id,
       name,
       form,
       dosage_value,
       dosage_unit,
       image_data_url,
       instructions,
       is_active
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
    [
      medicationId,
      input.patientUserId,
      input.createdByUserId,
      input.name.trim(),
      input.form.trim(),
      input.dosageValue.trim(),
      input.dosageUnit?.trim() || null,
      input.imageDataUrl || null,
      input.instructions?.trim() || null,
    ],
  );

  await queryMany(
    `insert into medication_schedules (
       id,
       medication_id,
       patient_user_id,
       frequency_type,
       days_of_week,
       times_of_day,
       interval_hours,
       start_date
     )
     values ($1, $2, $3, $4, $5::text[], $6::text[], null, current_date)`,
    [
      scheduleId,
      medicationId,
      input.patientUserId,
      input.frequencyType,
      input.daysOfWeek,
      input.timesOfDay,
    ],
  );

  return medicationId;
}

export async function listMedicationsForPatient(
  patientUserId: string,
  options?: { includeInactive?: boolean },
) {
  const rows = await queryMany<MedicationRow>(
    `select
       medications.id,
       medications.patient_user_id,
       medications.name,
       medications.form,
       medications.dosage_value,
       medications.dosage_unit,
       medications.image_data_url,
       medications.instructions,
       medications.is_active,
       trim(created_by_user.first_name || ' ' || created_by_user.last_name) as created_by_display_name,
       medication_schedules.id as schedule_id,
       medication_schedules.frequency_type as schedule_frequency_type,
       medication_schedules.days_of_week as schedule_days,
       medication_schedules.times_of_day as schedule_times,
       latest_log.status as latest_log_status,
       latest_log.taken_at::text as latest_taken_at
     from medications
     join users as created_by_user on created_by_user.id = medications.created_by_user_id
     left join medication_schedules on medication_schedules.medication_id = medications.id
     left join lateral (
       select medication_logs.status, medication_logs.taken_at
       from medication_logs
       where medication_logs.medication_id = medications.id
       order by medication_logs.created_at desc
       limit 1
     ) as latest_log on true
     where medications.patient_user_id = $1
       and ($2::boolean = true or medications.is_active = true)
     order by medications.is_active desc, medications.created_at asc`,
    [patientUserId, options?.includeInactive === true],
  );

  return rows.map(mapMedicationRow);
}

async function getMedicationOwnership(input: {
  medicationId: string;
  patientUserId: string;
}) {
  return queryOne<{
    medication_id: string;
    schedule_id: string | null;
    schedule_times: string[] | null;
  }>(
    `select
       medications.id as medication_id,
       medication_schedules.id as schedule_id,
       medication_schedules.times_of_day as schedule_times
     from medications
     left join medication_schedules on medication_schedules.medication_id = medications.id
     where medications.id = $1 and medications.patient_user_id = $2`,
    [input.medicationId, input.patientUserId],
  );
}

export async function updateMedicationWithSchedule(input: {
  daysOfWeek: string[];
  dosageUnit?: string | null;
  dosageValue: string;
  form: string;
  frequencyType: string;
  imageDataUrl?: string | null;
  instructions?: string | null;
  medicationId: string;
  name: string;
  patientUserId: string;
  timesOfDay: string[];
}) {
  const ownership = await getMedicationOwnership({
    medicationId: input.medicationId,
    patientUserId: input.patientUserId,
  });

  if (!ownership) {
    throw new Error("That medication could not be found for this patient.");
  }

  await queryMany(
    `update medications
     set name = $1,
         form = $2,
         dosage_value = $3,
         dosage_unit = $4,
         image_data_url = $5,
         instructions = $6,
         updated_at = now()
     where id = $7 and patient_user_id = $8`,
    [
      input.name.trim(),
      input.form.trim(),
      input.dosageValue.trim(),
      input.dosageUnit?.trim() || null,
      input.imageDataUrl || null,
      input.instructions?.trim() || null,
      input.medicationId,
      input.patientUserId,
    ],
  );

  if (ownership.schedule_id) {
    await queryMany(
      `update medication_schedules
       set frequency_type = $1,
           days_of_week = $2::text[],
           times_of_day = $3::text[],
           updated_at = now()
       where id = $4 and patient_user_id = $5`,
      [
        input.frequencyType.trim(),
        input.daysOfWeek,
        input.timesOfDay,
        ownership.schedule_id,
        input.patientUserId,
      ],
    );
  } else {
    await queryMany(
      `insert into medication_schedules (
         id,
         medication_id,
         patient_user_id,
         frequency_type,
         days_of_week,
         times_of_day,
         interval_hours,
         start_date
       )
       values ($1, $2, $3, $4, $5::text[], $6::text[], null, current_date)`,
      [
        createId("sched"),
        input.medicationId,
        input.patientUserId,
        input.frequencyType.trim(),
        input.daysOfWeek,
        input.timesOfDay,
      ],
    );
  }
}

export async function archiveMedication(input: {
  medicationId: string;
  patientUserId: string;
}) {
  const ownership = await getMedicationOwnership(input);

  if (!ownership) {
    throw new Error("That medication could not be found for this patient.");
  }

  await queryMany(
    `update medications
     set is_active = false,
         updated_at = now()
     where id = $1 and patient_user_id = $2`,
    [input.medicationId, input.patientUserId],
  );

  await queryMany(
    `update medication_schedules
     set end_date = coalesce(end_date, current_date),
         updated_at = now()
     where medication_id = $1 and patient_user_id = $2`,
    [input.medicationId, input.patientUserId],
  );
}

export async function listMedicationLogsForPatient(
  patientUserId: string,
  limit = 15,
) {
  const rows = await queryMany<MedicationLogRow>(
    `select
       medication_logs.id,
       medication_logs.medication_id,
       medications.name as medication_name,
       medication_logs.logged_for_date::text,
       medication_logs.scheduled_for::text,
       medication_logs.taken_at::text,
       medication_logs.status,
       medication_logs.notes,
       medication_logs.source,
       medication_logs.created_at::text,
       trim(
         coalesce(recorded_by_user.first_name, '') || ' ' ||
         coalesce(recorded_by_user.last_name, '')
       ) as recorded_by_display_name
     from medication_logs
     join medications on medications.id = medication_logs.medication_id
     left join users as recorded_by_user on recorded_by_user.id = medication_logs.recorded_by_user_id
     where medication_logs.patient_user_id = $1
     order by coalesce(medication_logs.taken_at, medication_logs.scheduled_for, medication_logs.created_at) desc
     limit $2`,
    [patientUserId, limit],
  );

  return rows.map(mapMedicationLogRow);
}

export async function getMedicationAdherenceSummary(
  patientUserId: string,
) {
  const summary = await queryOne<{
    active_medications: number;
    due_today: number;
    logged_today: number;
    missed_today: number;
    skipped_today: number;
    taken_today: number;
  }>(
    `select
       (select count(*)::int
        from medications
        where patient_user_id = $1 and is_active = true) as active_medications,
       (select coalesce(
          sum(coalesce(array_length(medication_schedules.times_of_day, 1), 1)),
          0
        )::int
        from medication_schedules
        join medications on medications.id = medication_schedules.medication_id
        where medication_schedules.patient_user_id = $1
          and medications.is_active = true
          and (medication_schedules.start_date is null or medication_schedules.start_date <= current_date)
          and (medication_schedules.end_date is null or medication_schedules.end_date >= current_date)
          and (
            coalesce(cardinality(medication_schedules.days_of_week), 0) = 0
            or trim(to_char(current_date, 'Dy')) = any(medication_schedules.days_of_week)
          )) as due_today,
       (select count(*)::int
        from medication_logs
        where patient_user_id = $1
          and coalesce(
            medication_logs.logged_for_date,
            coalesce(taken_at, scheduled_for, created_at)::date
          ) = current_date) as logged_today,
       (select count(*)::int
        from medication_logs
        where patient_user_id = $1
          and status = 'taken'
          and coalesce(
            medication_logs.logged_for_date,
            coalesce(taken_at, scheduled_for, created_at)::date
          ) = current_date) as taken_today,
       (select count(*)::int
        from medication_logs
        where patient_user_id = $1
          and status = 'missed'
          and coalesce(
            medication_logs.logged_for_date,
            coalesce(taken_at, scheduled_for, created_at)::date
          ) = current_date) as missed_today,
       (select count(*)::int
        from medication_logs
        where patient_user_id = $1
          and status = 'skipped'
          and coalesce(
            medication_logs.logged_for_date,
            coalesce(taken_at, scheduled_for, created_at)::date
          ) = current_date) as skipped_today`,
    [patientUserId],
  );

  return {
    activeMedications: summary?.active_medications ?? 0,
    dueToday: summary?.due_today ?? 0,
    loggedToday: summary?.logged_today ?? 0,
    missedToday: summary?.missed_today ?? 0,
    skippedToday: summary?.skipped_today ?? 0,
    takenToday: summary?.taken_today ?? 0,
  } satisfies MedicationAdherenceSummary;
}

export async function recordMedicationLog(input: {
  clientRef?: string | null;
  localDate?: string | null;
  medicationId: string;
  notes?: string | null;
  patientUserId: string;
  recordedByUserId: string;
  scheduleId?: string | null;
  scheduledFor?: string | null;
  source?: string;
  status: MedicationLogStatus;
  takenAt?: string | null;
}) {
  const ownership = await getMedicationOwnership({
    medicationId: input.medicationId,
    patientUserId: input.patientUserId,
  });

  if (!ownership) {
    throw new Error("That medication could not be found for this patient.");
  }

  const existing = input.clientRef
    ? await queryOne<{ id: string }>(
        `select id from medication_logs where client_ref = $1`,
        [input.clientRef],
      )
    : null;

  if (existing) {
    return existing.id;
  }

  const loggedForDate = input.localDate?.trim() || new Date().toISOString().slice(0, 10);
  const maxTakenEntriesForDay = Math.max(ownership.schedule_times?.length ?? 0, 1);

  if (input.status === "taken") {
    const takenCountForDate = await queryOne<{ total: number }>(
      `select count(*)::int as total
       from medication_logs
       where medication_id = $1
         and patient_user_id = $2
         and status = 'taken'
         and logged_for_date = $3::date`,
      [input.medicationId, input.patientUserId, loggedForDate],
    );

    if ((takenCountForDate?.total ?? 0) >= maxTakenEntriesForDay) {
      throw new Error(
        maxTakenEntriesForDay === 1
          ? "This medication was already marked as taken for this date."
          : "All scheduled doses for this medication were already marked as taken for this date.",
      );
    }
  }

  const logId = createId("log");

  await queryMany(
    `insert into medication_logs (
       id,
       medication_id,
       schedule_id,
       patient_user_id,
       recorded_by_user_id,
       client_ref,
       logged_for_date,
       scheduled_for,
       taken_at,
       status,
       notes,
       source
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      logId,
      input.medicationId,
      input.scheduleId || ownership.schedule_id || null,
      input.patientUserId,
      input.recordedByUserId,
      input.clientRef || null,
      loggedForDate,
      input.scheduledFor || null,
      input.takenAt || null,
      input.status,
      input.notes || null,
      input.source || "online",
    ],
  );

  return logId;
}

export async function createActivityPlan(input: {
  category: string;
  createdByUserId: string;
  daysOfWeek: string[];
  frequencyType: string;
  instructions?: string | null;
  patientUserId: string;
  targetMinutes?: number | null;
  title: string;
}) {
  await queryMany(
    `insert into activity_plans (
       id,
       patient_user_id,
       created_by_user_id,
       title,
       category,
       instructions,
       frequency_type,
       days_of_week,
       target_minutes,
       is_active
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, true)`,
    [
      createId("activity"),
      input.patientUserId,
      input.createdByUserId,
      input.title.trim(),
      input.category.trim(),
      input.instructions?.trim() || null,
      input.frequencyType.trim(),
      input.daysOfWeek,
      input.targetMinutes ?? null,
    ],
  );
}

async function getActivityOwnership(input: {
  activityPlanId: string;
  patientUserId: string;
}) {
  return queryOne<{ id: string }>(
    `select id
     from activity_plans
     where id = $1 and patient_user_id = $2`,
    [input.activityPlanId, input.patientUserId],
  );
}

export async function listActivityPlansForPatient(
  patientUserId: string,
  options?: { includeInactive?: boolean },
) {
  const rows = await queryMany<ActivityRow>(
    `select
       activity_plans.id,
       activity_plans.title,
       activity_plans.category,
       activity_plans.instructions,
       activity_plans.frequency_type,
       activity_plans.days_of_week,
       activity_plans.target_minutes,
       activity_plans.is_active,
       trim(created_by_user.first_name || ' ' || created_by_user.last_name) as created_by_display_name,
       latest_log.completion_status as latest_completion_status,
       latest_log.completed_at::text as latest_completed_at
     from activity_plans
     join users as created_by_user on created_by_user.id = activity_plans.created_by_user_id
     left join lateral (
       select activity_logs.completion_status, activity_logs.completed_at
       from activity_logs
       where activity_logs.activity_plan_id = activity_plans.id
       order by activity_logs.created_at desc
       limit 1
     ) as latest_log on true
     where activity_plans.patient_user_id = $1
       and ($2::boolean = true or activity_plans.is_active = true)
     order by activity_plans.is_active desc, activity_plans.created_at asc`,
    [patientUserId, options?.includeInactive === true],
  );

  return rows.map(mapActivityRow);
}

export async function updateActivityPlan(input: {
  activityPlanId: string;
  category: string;
  daysOfWeek: string[];
  frequencyType: string;
  instructions?: string | null;
  patientUserId: string;
  targetMinutes?: number | null;
  title: string;
}) {
  const ownership = await getActivityOwnership({
    activityPlanId: input.activityPlanId,
    patientUserId: input.patientUserId,
  });

  if (!ownership) {
    throw new Error("That routine could not be found for this patient.");
  }

  await queryMany(
    `update activity_plans
     set title = $1,
         category = $2,
         instructions = $3,
         frequency_type = $4,
         days_of_week = $5::text[],
         target_minutes = $6,
         updated_at = now()
     where id = $7 and patient_user_id = $8`,
    [
      input.title.trim(),
      input.category.trim(),
      input.instructions?.trim() || null,
      input.frequencyType.trim(),
      input.daysOfWeek,
      input.targetMinutes ?? null,
      input.activityPlanId,
      input.patientUserId,
    ],
  );
}

export async function archiveActivityPlan(input: {
  activityPlanId: string;
  patientUserId: string;
}) {
  const ownership = await getActivityOwnership(input);

  if (!ownership) {
    throw new Error("That routine could not be found for this patient.");
  }

  await queryMany(
    `update activity_plans
     set is_active = false,
         updated_at = now()
     where id = $1 and patient_user_id = $2`,
    [input.activityPlanId, input.patientUserId],
  );
}

export async function recordActivityLog(input: {
  activityPlanId: string;
  completionStatus: ActivityCompletionStatus;
  notes?: string | null;
  patientUserId: string;
  recordedByUserId: string;
}) {
  const ownership = await getActivityOwnership({
    activityPlanId: input.activityPlanId,
    patientUserId: input.patientUserId,
  });

  if (!ownership) {
    throw new Error("That routine could not be found for this patient.");
  }

  await queryMany(
    `insert into activity_logs (
       id,
       activity_plan_id,
       patient_user_id,
       recorded_by_user_id,
       scheduled_for,
       completion_status,
       completed_at,
       notes
     )
     values ($1, $2, $3, $4, current_date, $5, $6, $7)`,
    [
      createId("activity-log"),
      input.activityPlanId,
      input.patientUserId,
      input.recordedByUserId,
      input.completionStatus,
      input.completionStatus === "done" ? new Date().toISOString() : null,
      input.notes || null,
    ],
  );
}

export async function listActivityLogsForPatient(
  patientUserId: string,
  limit = 15,
) {
  const rows = await queryMany<ActivityLogRow>(
    `select
       activity_logs.id,
       activity_logs.activity_plan_id,
       activity_plans.title as activity_title,
       activity_logs.scheduled_for::text,
       activity_logs.completion_status,
       activity_logs.completed_at::text,
       activity_logs.notes,
       activity_logs.created_at::text,
       trim(
         coalesce(recorded_by_user.first_name, '') || ' ' ||
         coalesce(recorded_by_user.last_name, '')
       ) as recorded_by_display_name
     from activity_logs
     join activity_plans on activity_plans.id = activity_logs.activity_plan_id
     left join users as recorded_by_user on recorded_by_user.id = activity_logs.recorded_by_user_id
     where activity_logs.patient_user_id = $1
     order by coalesce(activity_logs.completed_at, activity_logs.created_at) desc
     limit $2`,
    [patientUserId, limit],
  );

  return rows.map(mapActivityLogRow);
}

export async function getActivitySummary(patientUserId: string) {
  const summary = await queryOne<{
    active_plans: number;
    completed_today: number;
    missed_today: number;
  }>(
    `select
       (select count(*)::int
        from activity_plans
        where patient_user_id = $1 and is_active = true) as active_plans,
       (select count(*)::int
        from activity_logs
        where patient_user_id = $1
          and completion_status = 'done'
          and coalesce(completed_at, created_at)::date = current_date) as completed_today,
       (select count(*)::int
        from activity_logs
        where patient_user_id = $1
          and completion_status = 'missed'
          and coalesce(completed_at, created_at)::date = current_date) as missed_today`,
    [patientUserId],
  );

  return {
    activePlans: summary?.active_plans ?? 0,
    completedToday: summary?.completed_today ?? 0,
    missedToday: summary?.missed_today ?? 0,
  } satisfies ActivitySummary;
}

export async function createAppointment(input: {
  appointmentAt: string;
  createdByUserId: string;
  location?: string | null;
  notes?: string | null;
  patientUserId: string;
  providerName?: string | null;
  title: string;
}) {
  await queryMany(
    `insert into appointments (
       id,
       patient_user_id,
       created_by_user_id,
       title,
       provider_name,
       location,
       appointment_at,
       status,
       notes
     )
     values ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)`,
    [
      createId("appointment"),
      input.patientUserId,
      input.createdByUserId,
      input.title.trim(),
      input.providerName?.trim() || null,
      input.location?.trim() || null,
      input.appointmentAt,
      input.notes?.trim() || null,
    ],
  );
}

async function getAppointmentOwnership(input: {
  appointmentId: string;
  patientUserId: string;
}) {
  return queryOne<{ id: string }>(
    `select id
     from appointments
     where id = $1 and patient_user_id = $2`,
    [input.appointmentId, input.patientUserId],
  );
}

export async function updateAppointment(input: {
  appointmentAt: string;
  appointmentId: string;
  location?: string | null;
  notes?: string | null;
  patientUserId: string;
  providerName?: string | null;
  status: string;
  title: string;
}) {
  const ownership = await getAppointmentOwnership({
    appointmentId: input.appointmentId,
    patientUserId: input.patientUserId,
  });

  if (!ownership) {
    throw new Error("That appointment could not be found for this patient.");
  }

  await queryMany(
    `update appointments
     set title = $1,
         provider_name = $2,
         location = $3,
         appointment_at = $4,
         status = $5,
         notes = $6,
         updated_at = now()
     where id = $7 and patient_user_id = $8`,
    [
      input.title.trim(),
      input.providerName?.trim() || null,
      input.location?.trim() || null,
      input.appointmentAt,
      input.status.trim(),
      input.notes?.trim() || null,
      input.appointmentId,
      input.patientUserId,
    ],
  );
}

export async function cancelAppointment(input: {
  appointmentId: string;
  patientUserId: string;
}) {
  const ownership = await getAppointmentOwnership(input);

  if (!ownership) {
    throw new Error("That appointment could not be found for this patient.");
  }

  await queryMany(
    `update appointments
     set status = 'cancelled',
         updated_at = now()
     where id = $1 and patient_user_id = $2`,
    [input.appointmentId, input.patientUserId],
  );
}

export async function listAppointmentsForPatient(
  patientUserId: string,
  options?: { includeCancelled?: boolean },
) {
  const rows = await queryMany<AppointmentRow>(
    `select
       appointments.id,
       appointments.title,
       appointments.provider_name,
       appointments.location,
       appointments.appointment_at::text,
       appointments.status,
       appointments.notes
     from appointments
     where appointments.patient_user_id = $1
       and ($2::boolean = true or appointments.status <> 'cancelled')
     order by appointments.appointment_at asc`,
    [patientUserId, options?.includeCancelled === true],
  );

  return rows.map(mapAppointmentRow);
}

async function getMedicationCounts(patientUserId: string) {
  const [activeMedications, dueToday, takenToday] = await Promise.all([
    queryOne<CountRow>(
      `select count(*)::int as total
       from medications
       where patient_user_id = $1 and is_active = true`,
      [patientUserId],
    ),
    queryOne<CountRow>(
      `select coalesce(
         sum(coalesce(array_length(medication_schedules.times_of_day, 1), 1)),
         0
       )::int as total
       from medication_schedules
       join medications on medications.id = medication_schedules.medication_id
       where medication_schedules.patient_user_id = $1
         and medications.is_active = true
         and (medication_schedules.start_date is null or medication_schedules.start_date <= current_date)
         and (medication_schedules.end_date is null or medication_schedules.end_date >= current_date)
         and (
           coalesce(cardinality(medication_schedules.days_of_week), 0) = 0
           or trim(to_char(current_date, 'Dy')) = any(medication_schedules.days_of_week)
         )`,
      [patientUserId],
    ),
    queryOne<CountRow>(
      `select count(*)::int as total
       from medication_logs
       where patient_user_id = $1
         and status = 'taken'
         and coalesce(
           medication_logs.logged_for_date,
           coalesce(taken_at, scheduled_for, created_at)::date
         ) = current_date`,
      [patientUserId],
    ),
  ]);

  return {
    activeMedications: activeMedications?.total ?? 0,
    dueToday: dueToday?.total ?? 0,
    takenToday: takenToday?.total ?? 0,
  };
}

async function getCareCircleCounts(patientUserId: string) {
  const [activeCaregivers, activeFamilyMembers, pendingRequests] = await Promise.all([
    queryOne<CountRow>(
      `select count(*)::int as total
       from care_relationships
       where patient_user_id = $1
         and member_role = 'caregiver'
         and relationship_status = 'active'`,
      [patientUserId],
    ),
    queryOne<CountRow>(
      `select count(*)::int as total
       from care_relationships
       where patient_user_id = $1
         and member_role = 'family_member'
         and relationship_status = 'active'`,
      [patientUserId],
    ),
    queryOne<CountRow>(
      `select count(*)::int as total
       from care_relationships
       where patient_user_id = $1
         and relationship_status = 'pending'`,
      [patientUserId],
    ),
  ]);

  return {
    activeCaregivers: activeCaregivers?.total ?? 0,
    activeFamilyMembers: activeFamilyMembers?.total ?? 0,
    pendingRequests: pendingRequests?.total ?? 0,
  };
}

export async function getPatientDashboardData(patientUserId: string) {
  const [user, patientProfile, medications, activityPlans, appointments] =
    await Promise.all([
      getUserById(patientUserId),
      getPatientProfile(patientUserId),
      listMedicationsForPatient(patientUserId),
      listActivityPlansForPatient(patientUserId),
      listAppointmentsForPatient(patientUserId),
    ]);

  if (!user) {
    return null;
  }

  const [medicationSummary, careCircle] = await Promise.all([
    getMedicationCounts(patientUserId),
    getCareCircleCounts(patientUserId),
  ]);

  return {
    activityPlans,
    appointments,
    careCircle,
    medicationSummary,
    medications,
    patientProfile,
    user,
  } satisfies PatientDashboardData;
}

export async function getCareMemberDashboardData(input: {
  patientUserId?: string | null;
  userId: string;
}) {
  const user = await getUserById(input.userId);

  if (!user) {
    return null;
  }

  const linkedPatients = await listLinkedPatientsForMember(input.userId);
  const activePatients = linkedPatients.filter(
    (patient) => patient.relationshipStatus === "active",
  );
  const selectedPatientId =
    input.patientUserId &&
    activePatients.some((patient) => patient.patientUserId === input.patientUserId)
      ? input.patientUserId
      : activePatients[0]?.patientUserId || null;
  const selectedPatient = selectedPatientId
    ? await getPatientDashboardData(selectedPatientId)
    : null;

  return {
    activeLinkedPatients: activePatients,
    linkedPatients,
    selectedPatient,
    user,
  } satisfies CareMemberDashboardData;
}

export async function pullPatientSyncPayload(patientUserId: string) {
  const [medications, activityPlans, appointments, recentLogs] = await Promise.all([
    listMedicationsForPatient(patientUserId),
    listActivityPlansForPatient(patientUserId),
    listAppointmentsForPatient(patientUserId),
    queryMany<{
      client_ref: string | null;
      created_at: string;
      id: string;
      medication_id: string;
      notes: string | null;
      schedule_id: string | null;
      scheduled_for: string | null;
      source: string;
      status: MedicationLogStatus;
      taken_at: string | null;
    }>(
      `select
         id,
         medication_id,
         schedule_id,
         client_ref,
         scheduled_for::text,
         taken_at::text,
         status,
         notes,
         source,
         created_at::text
       from medication_logs
       where patient_user_id = $1
       order by created_at desc
       limit 20`,
      [patientUserId],
    ),
  ]);

  return {
    activityPlans,
    appointments,
    medications,
    recentLogs,
  };
}

export async function pushMedicationSyncOperations(input: {
  actorUserId: string;
  deviceId?: string | null;
  operations: SyncPushOperation[];
  patientUserId: string;
}) {
  const appliedIds: string[] = [];

  for (const operation of input.operations) {
    const appliedId = await recordMedicationLog({
      clientRef: operation.clientRef,
      localDate: operation.localDate ?? null,
      medicationId: operation.medicationId,
      notes: operation.notes ?? null,
      patientUserId: input.patientUserId,
      recordedByUserId: input.actorUserId,
      scheduleId: operation.scheduleId ?? null,
      scheduledFor: operation.scheduledFor ?? null,
      source: "offline_sync",
      status: operation.status,
      takenAt: operation.takenAt ?? null,
    });

    appliedIds.push(appliedId);
  }

  await queryMany(
    `insert into sync_events (
       id,
       patient_user_id,
       actor_user_id,
       device_id,
       sync_direction,
       sync_status,
       item_type,
       item_count,
       details
     )
     values ($1, $2, $3, $4, 'push', 'completed', 'medication_logs', $5, $6::jsonb)`,
    [
      createId("sync"),
      input.patientUserId,
      input.actorUserId,
      input.deviceId ?? null,
      input.operations.length,
      JSON.stringify({
        appliedIds,
      }),
    ],
  );

  return {
    appliedIds,
    appliedCount: appliedIds.length,
  };
}
