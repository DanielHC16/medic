export type ApiScaffold = {
  id: string;
  method: "GET" | "POST" | "PATCH";
  path: string;
  status: "implemented" | "placeholder";
  description: string;
};

export type FeatureModule = {
  id: string;
  title: string;
  pagePath: string;
  summary: string;
  roles: string[];
  apiRoutes: ApiScaffold[];
};

export const foundationApiScaffolds: ApiScaffold[] = [
  {
    id: "health",
    method: "GET",
    path: "/api/health",
    status: "implemented",
    description: "Basic API heartbeat without touching the database.",
  },
  {
    id: "db-status",
    method: "GET",
    path: "/api/db/status",
    status: "implemented",
    description: "Runs a real Neon query and returns database metadata.",
  },
  {
    id: "db-bootstrap",
    method: "POST",
    path: "/api/db/bootstrap",
    status: "implemented",
    description: "Creates the initial testing tables and inserts demo rows.",
  },
  {
    id: "db-sample",
    method: "GET",
    path: "/api/db/sample",
    status: "implemented",
    description: "Fetches demo roles, users, patient profiles, and care links.",
  },
  {
    id: "modules",
    method: "GET",
    path: "/api/modules",
    status: "implemented",
    description: "Returns the current scaffold map for pages and API routes.",
  },
];

export const placeholderApiScaffolds: ApiScaffold[] = [
  {
    id: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    status: "implemented",
    description: "Custom sign-in entrypoint with cookie session creation.",
  },
  {
    id: "auth-register",
    method: "POST",
    path: "/api/auth/register",
    status: "implemented",
    description: "Role-aware sign-up entrypoint for patient, caregiver, and family member.",
  },
  {
    id: "patients",
    method: "GET",
    path: "/api/patients",
    status: "implemented",
    description: "Returns patient self data or linked patients depending on role.",
  },
  {
    id: "invitations",
    method: "POST",
    path: "/api/invitations",
    status: "implemented",
    description: "Creates patient-generated invitation codes and links.",
  },
  {
    id: "medications",
    method: "GET",
    path: "/api/medications",
    status: "implemented",
    description: "Medication list retrieval plus create endpoint support.",
  },
  {
    id: "schedules",
    method: "GET",
    path: "/api/schedules",
    status: "implemented",
    description: "Combined medication, routine, and appointment schedule data.",
  },
  {
    id: "activities",
    method: "GET",
    path: "/api/activities",
    status: "implemented",
    description: "Daily routine and activity plan list plus create support.",
  },
  {
    id: "appointments",
    method: "GET",
    path: "/api/appointments",
    status: "implemented",
    description: "Appointment records and create support.",
  },
  {
    id: "wellness-recommendations",
    method: "GET",
    path: "/api/wellness/recommendations",
    status: "placeholder",
    description: "Gemini-backed wellness suggestions.",
  },
  {
    id: "sync-pull",
    method: "POST",
    path: "/api/sync/pull",
    status: "implemented",
    description: "Pulls remote medication schedules, logs, routines, and appointments.",
  },
  {
    id: "sync-push",
    method: "POST",
    path: "/api/sync/push",
    status: "implemented",
    description: "Pushes queued offline medication log operations to Neon.",
  },
  {
    id: "dashboard-patient",
    method: "GET",
    path: "/api/dashboard/patient",
    status: "implemented",
    description: "Patient dashboard summary data.",
  },
  {
    id: "dashboard-caregiver",
    method: "GET",
    path: "/api/dashboard/caregiver",
    status: "implemented",
    description: "Caregiver dashboard summary data with linked-patient switching.",
  },
  {
    id: "dashboard-family",
    method: "GET",
    path: "/api/dashboard/family",
    status: "implemented",
    description: "Family dashboard summary data with linked-patient switching.",
  },
];

export const featureModules: FeatureModule[] = [
  {
    id: "sign-in",
    title: "Sign In",
    pagePath: "/sign-in",
    summary: "Blank entry page for the future custom sign-in flow.",
    roles: ["patient", "caregiver", "family_member"],
    apiRoutes: [placeholderApiScaffolds[0]],
  },
  {
    id: "sign-up",
    title: "Sign Up",
    pagePath: "/sign-up",
    summary: "Blank registration entry page for role-aware onboarding.",
    roles: ["patient", "caregiver", "family_member"],
    apiRoutes: [placeholderApiScaffolds[1], placeholderApiScaffolds[3]],
  },
  {
    id: "patient-dashboard",
    title: "Patient Dashboard",
    pagePath: "/patient/dashboard",
    summary: "Main patient landing page for medication status and wellness summary.",
    roles: ["patient"],
    apiRoutes: [placeholderApiScaffolds[11], placeholderApiScaffolds[2]],
  },
  {
    id: "patient-medications",
    title: "Patient Medications",
    pagePath: "/patient/medications",
    summary: "Medication list, medication details, and adherence tracking for the patient.",
    roles: ["patient", "caregiver"],
    apiRoutes: [placeholderApiScaffolds[4], placeholderApiScaffolds[5]],
  },
  {
    id: "patient-care-circle",
    title: "Patient Care Circle",
    pagePath: "/patient/care-circle",
    summary: "Manage invite links, invite codes, approvals, and access visibility.",
    roles: ["patient"],
    apiRoutes: [placeholderApiScaffolds[3]],
  },
  {
    id: "patient-schedule",
    title: "Patient Schedule",
    pagePath: "/patient/schedule",
    summary: "Combined schedule view for medications, routines, and appointments.",
    roles: ["patient", "caregiver", "family_member"],
    apiRoutes: [
      placeholderApiScaffolds[5],
      placeholderApiScaffolds[6],
      placeholderApiScaffolds[7],
    ],
  },
  {
    id: "join",
    title: "Join A Patient",
    pagePath: "/join",
    summary: "Preview an invite and join a patient as caregiver or family member.",
    roles: ["caregiver", "family_member"],
    apiRoutes: [placeholderApiScaffolds[3]],
  },
  {
    id: "caregiver-dashboard",
    title: "Caregiver Dashboard",
    pagePath: "/caregiver/dashboard",
    summary: "Blank monitoring page for caregivers to review adherence and reminders.",
    roles: ["caregiver"],
    apiRoutes: [placeholderApiScaffolds[12], placeholderApiScaffolds[3]],
  },
  {
    id: "family-dashboard",
    title: "Family Dashboard",
    pagePath: "/family/dashboard",
    summary: "Blank monitoring page for family members with a lighter access scope.",
    roles: ["family_member"],
    apiRoutes: [placeholderApiScaffolds[13], placeholderApiScaffolds[3]],
  },
  {
    id: "wellness",
    title: "Wellness",
    pagePath: "/wellness",
    summary: "Future page for daily routines, activities, and AI suggestions.",
    roles: ["patient", "caregiver"],
    apiRoutes: [placeholderApiScaffolds[6], placeholderApiScaffolds[8]],
  },
  {
    id: "profile",
    title: "Profile",
    pagePath: "/profile",
    summary: "Blank page for patient info, role metadata, and linked-account settings.",
    roles: ["patient", "caregiver", "family_member"],
    apiRoutes: [placeholderApiScaffolds[2]],
  },
];

export const implementationPhases = [
  "Foundation and testing",
  "Auth and role onboarding",
  "Medication core",
  "Offline-first medication sync",
  "Caregiver and family monitoring",
  "Activity and wellness routines",
  "AI recommendations",
  "PWA hardening",
  "Security and QA hardening",
];

export function getFeatureModule(id: string) {
  const featureModule = featureModules.find((entry) => entry.id === id);

  if (!featureModule) {
    throw new Error(`Unknown MEDIC feature module: ${id}`);
  }

  return featureModule;
}
