import { createId, createInviteCode } from "@/lib/ids";
import type {
  ActivityCompletionStatus,
  ActivityPlanRecord,
  AppointmentRecord,
  AuthenticatedUser,
  CareInvitationPreview,
  CareMemberDashboardData,
  CareRelationship,
  InviteApprovalMode,
  LinkedPatientSummary,
  MedicationLogStatus,
  MedicationRecord,
  PatientDashboardData,
  PatientProfile,
  RoleSlug,
  SyncPushOperation,
  TestingWorkbenchSnapshot,
} from "@/lib/medic-types";
import { createPasswordHash, verifyPassword } from "@/lib/security/passwords";
import { getSql } from "@/lib/db/neon";

const DEMO_PASSWORD = "DemoPass123!";
const PATIENT_ROLE_ID = "role-patient";
const CAREGIVER_ROLE_ID = "role-caregiver";
const FAMILY_ROLE_ID = "role-family-member";

type UserRow = {
  account_status: string;
  email: string;
  first_name: string;
  last_name: string;
  onboarding_status: string;
  phone: string | null;
  role: RoleSlug;
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
  target_minutes: number | null;
  title: string;
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
    scheduled_for timestamptz,
    taken_at timestamptz,
    status text not null,
    notes text,
    source text not null default 'online',
    created_at timestamptz not null default now(),
    constraint medication_logs_status_check
      check (status in ('taken', 'missed', 'skipped', 'queued_offline'))
  )`,
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

function mapUserRow(row: UserRow): AuthenticatedUser {
  return {
    accountStatus: row.account_status,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    onboardingStatus: row.onboarding_status,
    phone: row.phone,
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

async function queryMany<T>(query: string, params: unknown[] = []) {
  const sql = getSql();
  return (await sql.query(query, params)) as T[];
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
    await queryMany(
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
    await queryMany(statement);
  }

  for (const statement of indexStatements) {
    await queryMany(statement);
  }

  await ensureReferenceRoles();
}

async function seedDemoUsers() {
  const patientPassword = createPasswordHash(DEMO_PASSWORD);
  const caregiverPassword = createPasswordHash(DEMO_PASSWORD);
  const familyPassword = createPasswordHash(DEMO_PASSWORD);

  const seededUsers = [
    {
      email: "patient.demo@medic.local",
      firstName: "Maria",
      id: "user-patient-demo",
      lastName: "Santos",
      password: patientPassword,
      phone: "09170000001",
      role: "patient" as const,
    },
    {
      email: "caregiver.demo@medic.local",
      firstName: "Ana",
      id: "user-caregiver-demo",
      lastName: "Reyes",
      password: caregiverPassword,
      phone: "09170000002",
      role: "caregiver" as const,
    },
    {
      email: "family.demo@medic.local",
      firstName: "Luis",
      id: "user-family-demo",
      lastName: "Cruz",
      password: familyPassword,
      phone: "09170000003",
      role: "family_member" as const,
    },
  ];

  for (const user of seededUsers) {
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
        user.password.hash,
        user.password.salt,
      ],
    );
  }

  await queryMany(
    `insert into patient_profiles (user_id, date_of_birth, assistance_level, emergency_notes)
     values ($1, date '1950-06-15', 'minimal_assistance', 'Initial seeded patient profile.')
     on conflict (user_id) do update
     set date_of_birth = excluded.date_of_birth,
         assistance_level = excluded.assistance_level,
         emergency_notes = excluded.emergency_notes,
         updated_at = now()`,
    ["user-patient-demo"],
  );
}

async function seedDemoRelationshipsAndInvites() {
  const inviteId = "invite-family-demo";
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
     values ($1, $2, $3, 'family_member', 'FAM123', 'manual', 'active', now() + interval '30 days')
     on conflict (id) do update
     set invite_code = excluded.invite_code,
         approval_mode = excluded.approval_mode,
         status = excluded.status,
         expires_at = excluded.expires_at`,
    [inviteId, "user-patient-demo", "user-patient-demo"],
  );

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
     values
       ('rel-patient-caregiver-demo', 'user-patient-demo', 'user-caregiver-demo', 'caregiver', 'active', 'CARE123', null, now()),
       ('rel-patient-family-demo', 'user-patient-demo', 'user-family-demo', 'family_member', 'pending', 'FAM123', $1, null)
     on conflict (id) do update
     set patient_user_id = excluded.patient_user_id,
         related_user_id = excluded.related_user_id,
         member_role = excluded.member_role,
         relationship_status = excluded.relationship_status,
         invite_code = excluded.invite_code,
         invitation_id = excluded.invitation_id,
         joined_at = excluded.joined_at,
         updated_at = now()`,
    [inviteId],
  );
}

async function seedDemoMedicationAndWellnessData() {
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
     values
       ('med-demo-acetaminophen', 'user-patient-demo', 'user-caregiver-demo', 'Acetaminophen', 'Tablet', '500', 'mg', 'Take after breakfast.', true)
     on conflict (id) do update
     set name = excluded.name,
         form = excluded.form,
         dosage_value = excluded.dosage_value,
         dosage_unit = excluded.dosage_unit,
         instructions = excluded.instructions,
         updated_at = now()`,
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
     values
       ('sched-demo-acetaminophen', 'med-demo-acetaminophen', 'user-patient-demo', 'daily', array['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], array['08:00','20:00'], current_date)
     on conflict (id) do update
     set frequency_type = excluded.frequency_type,
         days_of_week = excluded.days_of_week,
         times_of_day = excluded.times_of_day,
         updated_at = now()`,
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
     values
       ('log-demo-acetaminophen-1', 'med-demo-acetaminophen', 'sched-demo-acetaminophen', 'user-patient-demo', 'user-patient-demo', 'demo-log-1', now(), now(), 'taken', 'Seeded completion log.', 'seed')
     on conflict (id) do nothing`,
  );

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
     values
       ('activity-demo-stretch', 'user-patient-demo', 'user-caregiver-demo', 'Morning Stretching', 'mobility', 'Gentle upper and lower body stretches.', 'daily', array['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], 10, true)
     on conflict (id) do update
     set title = excluded.title,
         category = excluded.category,
         instructions = excluded.instructions,
         frequency_type = excluded.frequency_type,
         days_of_week = excluded.days_of_week,
         target_minutes = excluded.target_minutes,
         updated_at = now()`,
  );

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
     values
       ('appointment-demo-checkup', 'user-patient-demo', 'user-caregiver-demo', 'Monthly Checkup', 'Dr. Lim', 'ABC Clinic', now() + interval '2 days', 'scheduled', 'Bring medication list.')
     on conflict (id) do update
     set title = excluded.title,
         provider_name = excluded.provider_name,
         location = excluded.location,
         appointment_at = excluded.appointment_at,
         status = excluded.status,
         notes = excluded.notes,
         updated_at = now()`,
  );
}

export async function bootstrapMedicSchema() {
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
      users: [
        "patient.demo@medic.local",
        "caregiver.demo@medic.local",
        "family.demo@medic.local",
      ],
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
       users.onboarding_status
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
  firstName: string;
  inviteCode?: string;
  lastName: string;
  password: string;
  phone?: string;
  role: RoleSlug;
}) {
  await ensureMedicSchema();

  const existingUser = await queryOne<{ id: string }>(
    `select id from users where lower(email) = lower($1) or phone = $2`,
    [normalizeEmail(input.email), normalizePhone(input.phone)],
  );

  if (existingUser) {
    throw new Error("An account with that email or phone already exists.");
  }

  const { hash, salt } = createPasswordHash(input.password);
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
      normalizeEmail(input.email),
      normalizePhone(input.phone),
      input.firstName.trim(),
      input.lastName.trim(),
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
       values ($1, $2, $3, null)`,
      [
        userId,
        input.dateOfBirth ? input.dateOfBirth : null,
        input.assistanceLevel || "independent",
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
    inviteLink: `/join?code=${preview.code}`,
  };
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
    [code.trim().toUpperCase()],
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

  const existingRelationship = await queryOne<{ id: string }>(
    `select id
     from care_relationships
     where patient_user_id = $1 and related_user_id = $2`,
    [preview.patientUserId, input.userId],
  );

  if (existingRelationship) {
    return {
      relationshipStatus: "active",
    };
  }

  const relationshipStatus =
    (input.approvalModeOverride || preview.approvalMode) === "auto"
      ? "active"
      : "pending";

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
       instructions,
       is_active
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
    [
      medicationId,
      input.patientUserId,
      input.createdByUserId,
      input.name.trim(),
      input.form.trim(),
      input.dosageValue.trim(),
      input.dosageUnit?.trim() || null,
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

export async function listMedicationsForPatient(patientUserId: string) {
  const rows = await queryMany<MedicationRow>(
    `select
       medications.id,
       medications.patient_user_id,
       medications.name,
       medications.form,
       medications.dosage_value,
       medications.dosage_unit,
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
     order by medications.created_at asc`,
    [patientUserId],
  );

  return rows.map(mapMedicationRow);
}

export async function recordMedicationLog(input: {
  clientRef?: string | null;
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
  const existing = input.clientRef
    ? await queryOne<{ id: string }>(
        `select id from medication_logs where client_ref = $1`,
        [input.clientRef],
      )
    : null;

  if (existing) {
    return existing.id;
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
       scheduled_for,
       taken_at,
       status,
       notes,
       source
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      logId,
      input.medicationId,
      input.scheduleId || null,
      input.patientUserId,
      input.recordedByUserId,
      input.clientRef || null,
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

export async function listActivityPlansForPatient(patientUserId: string) {
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
       trim(created_by_user.first_name || ' ' || created_by_user.last_name) as created_by_display_name
     from activity_plans
     join users as created_by_user on created_by_user.id = activity_plans.created_by_user_id
     where activity_plans.patient_user_id = $1
     order by activity_plans.created_at asc`,
    [patientUserId],
  );

  return rows.map(mapActivityRow);
}

export async function recordActivityLog(input: {
  activityPlanId: string;
  completionStatus: ActivityCompletionStatus;
  notes?: string | null;
  patientUserId: string;
  recordedByUserId: string;
}) {
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

export async function listAppointmentsForPatient(patientUserId: string) {
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
     order by appointments.appointment_at asc`,
    [patientUserId],
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
      `select count(*)::int as total
       from medication_schedules
       where patient_user_id = $1`,
      [patientUserId],
    ),
    queryOne<CountRow>(
      `select count(*)::int as total
       from medication_logs
       where patient_user_id = $1
         and status = 'taken'
         and taken_at::date = current_date`,
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
    input.patientUserId ||
    activePatients[0]?.patientUserId ||
    linkedPatients[0]?.patientUserId ||
    null;
  const selectedPatient = selectedPatientId
    ? await getPatientDashboardData(selectedPatientId)
    : null;

  return {
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
