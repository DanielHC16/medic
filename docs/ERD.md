# MEDIC ERD

This ERD reflects the schema that is actually implemented by `bootstrapMedicSchema()` in [lib/db/medic-data.ts](/c:/Users/Hardy/OneDrive/Desktop/cs-elective/medic/lib/db/medic-data.ts). It is the current Neon cloud schema used by the test page, seeded demo accounts, and the implemented patient-caregiver-family flows.

## Implemented Cloud ERD

```mermaid
erDiagram
    roles ||--o{ users : assigns
    users ||--|| patient_profiles : extends
    users ||--o{ care_invitations : patient_owner
    users ||--o{ care_invitations : created_by
    users ||--o{ care_relationships : patient
    users ||--o{ care_relationships : related_member
    care_invitations ||--o{ care_relationships : source_invite
    users ||--o{ medications : patient_owner
    users ||--o{ medications : created_by
    medications ||--o{ medication_schedules : schedules
    users ||--o{ medication_schedules : patient_owner
    medications ||--o{ medication_logs : tracked_by
    medication_schedules ||--o{ medication_logs : schedule_instance
    users ||--o{ medication_logs : patient_owner
    users ||--o{ medication_logs : recorded_by
    users ||--o{ activity_plans : patient_owner
    users ||--o{ activity_plans : created_by
    activity_plans ||--o{ activity_logs : tracked_by
    users ||--o{ activity_logs : patient_owner
    users ||--o{ activity_logs : recorded_by
    users ||--o{ appointments : patient_owner
    users ||--o{ appointments : created_by
    users ||--o{ sync_events : patient_owner
    users ||--o{ sync_events : actor

    roles {
        text id PK
        text slug UK
        text label
        timestamptz created_at
    }

    users {
        text id PK
        text role_id FK
        text email UK
        text phone UK nullable
        text first_name
        text last_name
        text account_status
        text onboarding_status
        text password_hash nullable
        text password_salt nullable
        timestamptz last_login_at nullable
        timestamptz created_at
        timestamptz updated_at
    }

    patient_profiles {
        text user_id PK, FK
        date date_of_birth nullable
        text assistance_level nullable
        text emergency_notes nullable
        timestamptz created_at
        timestamptz updated_at
    }

    care_invitations {
        text id PK
        text patient_user_id FK
        text created_by_user_id FK
        text member_role
        text invite_code UK
        text approval_mode
        text status
        timestamptz expires_at
        timestamptz created_at
        timestamptz accepted_at nullable
    }

    care_relationships {
        text id PK
        text patient_user_id FK
        text related_user_id FK
        text member_role
        text relationship_status
        text invite_code nullable
        text invitation_id FK nullable
        text approved_by_user_id FK nullable
        timestamptz joined_at nullable
        timestamptz created_at
        timestamptz updated_at
    }

    medications {
        text id PK
        text patient_user_id FK
        text created_by_user_id FK
        text name
        text form
        text dosage_value
        text dosage_unit nullable
        text instructions nullable
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    medication_schedules {
        text id PK
        text medication_id FK
        text patient_user_id FK
        text frequency_type
        text[] days_of_week
        text[] times_of_day
        integer interval_hours nullable
        date start_date nullable
        date end_date nullable
        timestamptz created_at
        timestamptz updated_at
    }

    medication_logs {
        text id PK
        text medication_id FK
        text schedule_id FK nullable
        text patient_user_id FK
        text recorded_by_user_id FK
        text client_ref UK nullable
        timestamptz scheduled_for nullable
        timestamptz taken_at nullable
        text status
        text notes nullable
        text source
        timestamptz created_at
    }

    activity_plans {
        text id PK
        text patient_user_id FK
        text created_by_user_id FK
        text title
        text category
        text instructions nullable
        text frequency_type
        text[] days_of_week
        integer target_minutes nullable
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    activity_logs {
        text id PK
        text activity_plan_id FK
        text patient_user_id FK
        text recorded_by_user_id FK nullable
        date scheduled_for nullable
        text completion_status
        timestamptz completed_at nullable
        text notes nullable
        timestamptz created_at
    }

    appointments {
        text id PK
        text patient_user_id FK
        text created_by_user_id FK
        text title
        text provider_name nullable
        text location nullable
        timestamptz appointment_at
        text status
        text notes nullable
        timestamptz created_at
        timestamptz updated_at
    }

    sync_events {
        text id PK
        text patient_user_id FK
        text actor_user_id FK nullable
        text device_id nullable
        text sync_direction
        text sync_status
        text item_type
        integer item_count
        jsonb details nullable
        timestamptz synced_at
    }
```

## Flow Coverage In This Schema

- Patient accounts live in `users`, with patient-specific details in `patient_profiles`.
- Caregiver and family-member linking is driven by `care_invitations` plus `care_relationships`.
- Medication setup uses `medications`, `medication_schedules`, and `medication_logs`.
- Wellness and daily routine support uses `activity_plans`, `activity_logs`, and `appointments`.
- Offline sync testing writes audit rows into `sync_events`.

## Important Implementation Notes

- `Neon Postgres` is the current source of truth.
- The current browser offline test flow uses queued local operations and pushes them to `/api/sync/push`.
- A real device-side SQLite or browser-compatible local database layer is still a later phase and is not represented as a live implemented schema in this ERD yet.
