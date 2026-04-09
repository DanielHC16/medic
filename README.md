# MEDIC

MEDIC is a Next.js 16 PWA-oriented care coordination project for `patient`, `caregiver`, and `family_member` users. The current build already includes a working Neon-backed schema, custom session-based auth, care-circle linking, medication and wellness testing flows, and a direct database testing hub for local development.

## Current Progress

### Working Right Now

- Next.js 16 App Router project with a deployed-ready build setup
- Neon Postgres connection and schema bootstrap
- Implemented cloud ERD in [docs/ERD.md](docs/ERD.md)
- Custom sign-up and sign-in flow with session cookies
- Role-aware dashboards for patient, caregiver, and family member
- Care-circle invite flow with approval and revoke endpoints
- Medication creation, schedule creation, and medication logging
- Wellness activity plan creation and appointment creation
- Offline sync skeleton for medication log queue testing
- Open Testing Hub at `/test`
- Direct Database Workbench in the Testing Hub for creating records directly in Neon

### In Progress / Temporary Foundations

- Offline support currently uses a browser queue for sync testing
- SQLite or browser-compatible local database support is still a later implementation phase
- Access control is functional but still not the final locked RBAC version
- Wellness recommendations route exists, but production AI integration is not finalized

## How MEDIC Works Right Now

### 1. Neon Is The Current Source Of Truth

All implemented data currently lives in Neon Postgres. The app bootstraps and seeds the schema through:

- `POST /api/db/bootstrap`
- `GET /api/db/status`
- `GET /api/db/sample`

The live schema includes:

- roles
- users
- patient_profiles
- care_invitations
- care_relationships
- medications
- medication_schedules
- medication_logs
- activity_plans
- activity_logs
- appointments
- sync_events

The actual implemented ERD is documented in [docs/ERD.md](docs/ERD.md).

### 2. Auth And Role Flow

- Users can register as `patient`, `caregiver`, or `family_member`
- Sessions are stored in a signed cookie
- Patients land on the patient home/dashboard flows
- Caregivers and family members can join a patient through the care-circle flow

### 3. Care-Circle Linking

- Patients can generate invite records
- Caregivers and family members can join using an invite
- Relationships can be approved or revoked
- The current flow supports the care-circle structure needed for patient, caregiver, and family coordination

### 4. Medication And Wellness Foundation

- Patients can create medication records and initial schedules
- Medication logs can be marked and recorded
- Wellness routines and appointments can be created
- Dashboards read from live Neon data

### 5. Offline Sync Today

The current offline layer is only an initial bridge:

- medication-log actions can be queued locally in the browser
- queued data can be pushed back to Neon through sync endpoints
- sync events are stored in `sync_events`

This is not yet the final SQLite implementation. The future offline layer will replace this with a more complete local-first storage strategy.

## Open Testing Hub

The main testing page is available at `/test`.

### What You Can Test There

- API heartbeat
- Neon connection status
- schema bootstrap
- sample seeded data
- scaffold/module map
- direct database inserts through the Testing Workbench

### Testing Workbench Features

The Testing Workbench lets you directly create records in Neon from the UI:

- add `patient`, `caregiver`, and `family_member` accounts
- generate patient invite records
- add medications and schedules
- add wellness/activity routines
- add appointments
- inspect current users, invites, medications, routines, and appointments

### Production Safety

The direct Testing Workbench is disabled in production by default.

It only enables when:

- `NODE_ENV !== "production"`
- or `ENABLE_TEST_WORKBENCH=true`

That makes it safe to keep in the codebase without exposing test-only write tooling on a normal production deployment.

## Important Routes Right Now

### Main Pages

- `/`
- `/test`
- `/sign-in`
- `/sign-up`
- `/join`
- `/patient/dashboard`
- `/patient/medications`
- `/patient/schedule`
- `/patient/care-circle`
- `/caregiver/dashboard`
- `/family/dashboard`
- `/wellness`
- `/profile`

### Core API Routes

- `/api/health`
- `/api/db/status`
- `/api/db/bootstrap`
- `/api/db/sample`
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/invitations`
- `/api/invitations/accept`
- `/api/relationships/[id]/approve`
- `/api/relationships/[id]/revoke`
- `/api/medications`
- `/api/medication-logs`
- `/api/activities`
- `/api/appointments`
- `/api/schedules`
- `/api/sync/push`
- `/api/sync/pull`
- `/api/testing/workbench`

## Local Setup Tutorial

### 1. Clone And Install

```bash
git clone <your-repo-url>
cd medic
npm install
```

### 2. Create `.env.local`

Create a file named `.env.local` in the project root.

Ask Daniel for API credentials to copy paste inside `.env.local`.

Minimum local setup:

```env
DATABASE_URL=your_neon_connection_string
SESSION_SECRET=replace_this_with_a_long_random_secret
```

Optional variables:

```env
POSTGRES_URL=your_neon_connection_string
ENABLE_TEST_WORKBENCH=true
```

Notes:

- `DATABASE_URL` is the main connection string used by the app
- `POSTGRES_URL` can be used as a fallback
- `SESSION_SECRET` should be changed from the development default
- `ENABLE_TEST_WORKBENCH=true` is only needed if you intentionally want the direct DB workbench enabled in a production-like environment

### 3. Start The App

```bash
npm run dev
```

Then open:

- `http://localhost:3000/`
- `http://localhost:3000/test`

### 4. Recommended First Local Test Flow

1. Open `/test`
2. Run the bootstrap action to create the schema and seed demo data
3. Check the database status and sample data cards
4. Use the Testing Workbench to add more patients, caregivers, family members, medications, activities, and appointments
5. Sign in with the demo or newly created accounts

## Demo Accounts

After bootstrap or reset, the seeded local/test accounts use a Breaking Bad-themed
dataset with three patient care circles:

- Patient: `walter.white@medic.local`
- Caregiver: `jesse.pinkman@medic.local`
- Family member: `skyler.white@medic.local`
- Patient: `hector.salamanca@medic.local`
- Caregiver: `gus.fring@medic.local`
- Family member: `tuco.salamanca@medic.local`
- Patient: `saul.goodman@medic.local`
- Caregiver: `kim.wexler@medic.local`
- Family member: `chuck.mcgill@medic.local`

Default seeded password for every seeded account:

- `DemoPass123!`

## Commit And Redeploy Safety

### Verified

- `npm run lint` passes
- `npm run build` passes
- the app still builds as a normal Next.js deployment target
- the Testing Workbench is blocked in production by default
- `.env.local`, `.next`, `.vercel`, and local database files are ignored by `.gitignore`

### Important Commit Note

Before committing everything, review your git status carefully.

At the moment, this workspace has tracked deletions for:

- `AGENTS.md`
- `CLAUDE.md`

Those deletions may be intentional local changes, but they should be reviewed before making a final commit.

### Deployment Note

From the current build and route setup, this project should redeploy cleanly. The main deployment risk right now is not the build itself, but accidentally committing unintended worktree changes or forgetting required environment variables.

## TODO

### High Priority

- finalize role-based permissions for patient, caregiver, and family member
- add QR code generation and QR scanning for care-circle linking
- build the missing patient sections: Health Info, Alerts, Settings
- build the missing caregiver sections: Monitoring, Profile
- build the missing family sections: Updates, Profile

### Offline And Data

- replace the temporary browser queue with the planned SQLite or browser-compatible offline data layer
- define sync conflict rules for duplicate or late updates
- expand offline coverage beyond medication logs

### Security And Production Hardening

- harden auth validation and password handling
- add password reset and account recovery flows
- add audit trails for sensitive actions
- add route-level authorization checks everywhere they are still soft

### Product Features

- complete medication management UX
- expand activity and appointment workflows
- add alerts and emergency actions
- add messaging or structured check-ins
- integrate Gemini-powered recommendations once the core data model is stable

## Supporting Docs

- ERD: [docs/ERD.md](docs/ERD.md)
- Build order / roadmap: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
