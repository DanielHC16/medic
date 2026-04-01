# MEDIC Implementation Plan

## Recommended Order

### Phase 1: Foundation and Testing

- Keep the project on the App Router in Next.js 16.
- Add a simple test page for API health and Neon connectivity.
- Create the initial database bootstrap for `roles`, `users`, `patient_profiles`, and `care_relationships`.
- Scaffold blank routes and blank pages for the main modules so the project structure is stable early.

### Phase 2: Auth and Role Onboarding

- Build custom auth stubs into real sign-in and sign-up flows.
- Implement role-aware registration for `patient`, `caregiver`, and `family_member`.
- Add invite-code flows so caregivers and family members can attach to a patient account safely.
- Enforce role-based access rules at the application layer.

### Phase 3: Medication Core

- Implement medication CRUD for patients and authorized caregivers.
- Implement medication schedule CRUD with daily and weekly recurrence.
- Add medication logs so doses can be marked as `taken`, `missed`, or `skipped`.
- Build the patient medication dashboard first because it is the main product value.

### Phase 4: Offline-First Medication Flow

- Add a local data layer for medication schedules, medication logs, and patient essentials.
- Queue offline writes locally and replay them when connectivity returns.
- Add a sync status indicator and conflict strategy for late edits or duplicate actions.
- Keep the first sync scope narrow: medication schedules and logs only.

### Phase 5: Caregiver and Family Monitoring

- Build dashboard views for caregiver and family roles.
- Show adherence summaries, next medication times, and missed medication alerts.
- Add patient-to-caregiver and patient-to-family access boundaries.

### Phase 6: Activity and Wellness Routines

- Implement activity plans, activity schedules, and completion logs.
- Add appointments and routine reminders.
- Reuse the same sync pattern established for medication data.

### Phase 7: AI Recommendations

- Add the Gemini-backed recommendation endpoint only after medication and activity data are trustworthy.
- Generate recommendations from age, adherence patterns, routine history, and optional notes.
- Store recommendation history and mark offline behavior clearly as unavailable or cached-only.

### Phase 8: PWA Hardening

- Add the final service worker strategy, install flow, manifest polish, and notification support.
- Expand offline coverage after the medication sync flow is reliable.
- Validate iOS and Android install behavior carefully before calling the app production-ready.

### Phase 9: Security, QA, and Deployment Hardening

- Add audit trails for sensitive actions.
- Add integration tests for key patient safety flows.
- Add error monitoring, analytics, and data backup procedures.
- Review accessibility, large text behavior, and elderly-friendly interactions.

## What To Build Immediately After This First Step

1. Turn the auth stub routes into real registration and login flows.
2. Create invite-code creation and invite-code acceptance flows.
3. Add medication tables and medication CRUD routes.
4. Build the patient medication dashboard from real database records.
5. Add medication logging and adherence summaries.
6. Implement the first offline queue only for medication logs and schedule reads.
7. Add caregiver and family dashboards once medication data is stable.
8. Add activities, appointments, and wellness routines after the medication loop is solid.
9. Add Gemini recommendations last, once real patient data and guardrails exist.

## Technical Recommendations

- Stay with raw SQL plus `@neondatabase/serverless` for now because the schema is still moving.
- Add an ORM later only when the domain model becomes stable enough to justify it.
- Keep API contracts small and role-specific instead of building a single large generic endpoint per module.
- Treat the Neon schema as canonical and keep the local offline store as a synchronized subset.
