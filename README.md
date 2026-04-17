# MEDIC

MEDIC is a Next.js PWA-oriented care coordination platform for `patient`, `caregiver`, and `family_member` users. It provides role-aware dashboards, care-circle linking, medication tracking, wellness routines, and appointment management backed by Neon Postgres with session-based authentication.

## Overview

MEDIC helps patients, their caregivers, and family members stay coordinated around day-to-day care. Each role has a tailored dashboard showing the data most relevant to them while the underlying care-circle model keeps everyone connected to the same patient record.

### Core Features

- Role-based sign-up and sign-in with session cookies
- Role-aware dashboards for patient, caregiver, and family member
- Care-circle invite flow with approval and revoke controls
- Medication records, schedules, and logging with "mark as taken" actions
- Wellness activity plans with once/twice daily frequency tracking
- Appointment creation, editing, and "mark as done" workflows
- Image uploads for medications, activities, and appointments
- Patient switcher so caregivers and family members can view each linked patient's live data
- Progress summary modals with daily medication and activity breakdowns
- Profile management with uploadable profile pictures

## Tech Stack

- Next.js App Router with Server Components and Route Handlers
- Neon Postgres as the source of truth
- Custom session-based authentication using signed HTTP-only cookies
- Tailwind CSS with custom design tokens
- TypeScript end to end

## Architecture

### Data

All application data lives in Neon Postgres. The schema is bootstrapped through API routes and covers:

- `roles`, `users`, `patient_profiles`
- `care_invitations`, `care_relationships`
- `medications`, `medication_schedules`, `medication_logs`
- `activity_plans`, `activity_logs`
- `appointments`
- `sync_events`

The full ERD is documented in [`docs/ERD.md`](docs/ERD.md).

### Roles And Routing

- Patients land on `/patient/dashboard` with access to medications, schedule, care-circle, wellness, and profile pages
- Caregivers land on `/caregiver/dashboard` with management actions for all linked patients
- Family members land on `/family/dashboard` with read-mostly views of the same patient data

### Care-Circle Linking

Patients generate invite codes that caregivers and family members redeem at `/caregiver/join` or `/family/join`. Relationships are then approved or revoked by the patient, and every care-circle member scopes their dashboard data to the patients they are linked to.

## Local Setup

### 1. Install

```bash
git clone <your-repo-url>
cd medic
npm install
```

### 2. Environment

Create `.env.local` in the project root:

```env
DATABASE_URL=your_neon_connection_string
SESSION_SECRET=replace_this_with_a_long_random_secret
```

Optional:

```env
POSTGRES_URL=your_neon_connection_string
ENABLE_TEST_WORKBENCH=true
```

Notes:

- `DATABASE_URL` is the main connection string used by the app
- `POSTGRES_URL` can be used as a fallback
- `SESSION_SECRET` should always be changed from any development default
- `ENABLE_TEST_WORKBENCH=true` only matters if you want the Testing Workbench enabled in a production-like environment

### 3. Run

```bash
npm run dev
```

Then open:

- `http://localhost:3000/`
- `http://localhost:3000/test` (local testing hub)

## Demo Accounts

After bootstrapping the schema, seeded care circles are available for local testing:

- Patient: `walter.white@medic.local`
- Caregiver: `jesse.pinkman@medic.local`
- Family member: `skyler.white@medic.local`
- Patient: `hector.salamanca@medic.local`
- Caregiver: `gus.fring@medic.local`
- Family member: `tuco.salamanca@medic.local`
- Patient: `saul.goodman@medic.local`
- Caregiver: `kim.wexler@medic.local`
- Family member: `chuck.mcgill@medic.local`

Default seeded password for every account: `DemoPass123!`

## Important Routes

### Pages

- `/`, `/sign-in`, `/sign-up`, `/test`
- `/patient/dashboard`, `/patient/medications`, `/patient/schedule`, `/patient/care-circle`, `/patient/wellness`, `/patient/profile`
- `/caregiver/dashboard`, `/caregiver/monitoring`, `/caregiver/medications`, `/caregiver/wellness`, `/caregiver/join`, `/caregiver/profile`
- `/family/dashboard`, `/family/updates`, `/family/wellness`, `/family/join`, `/family/profile`

### API

- `/api/health`, `/api/db/status`, `/api/db/bootstrap`, `/api/db/sample`
- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- `/api/profile`
- `/api/invitations`, `/api/invitations/accept`
- `/api/relationships/[id]/approve`, `/api/relationships/[id]/revoke`
- `/api/medications`, `/api/medication-logs`, `/api/schedules`
- `/api/activities`, `/api/appointments`
- `/api/sync/push`, `/api/sync/pull`
- `/api/testing/workbench`

## Testing Hub

The testing hub at `/test` exposes API heartbeat checks, schema bootstrap, sample data seeding, and a direct database workbench for creating accounts, invites, medications, routines, and appointments. The workbench is disabled in production unless `ENABLE_TEST_WORKBENCH=true` is set, so it is safe to keep in the repo.

## Supporting Docs

- ERD: [`docs/ERD.md`](docs/ERD.md)
- Implementation plan: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)
