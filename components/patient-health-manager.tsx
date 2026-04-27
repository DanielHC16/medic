"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PatientProfile } from "@/lib/medic-types";
import { getSeniorDateOfBirth } from "@/lib/validation";

const assistanceOptions = [
  { label: "Independent", value: "independent" },
  { label: "Minimal assistance", value: "minimal_assistance" },
  { label: "Needs caregiver assistance", value: "caregiver_assistance" },
  { label: "Needs family support", value: "family_support" },
  { label: "Limited mobility", value: "limited_mobility" },
];

export function PatientHealthManager(props: {
  profile: PatientProfile | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    assistanceLevel: props.profile?.assistanceLevel ?? "independent",
    dateOfBirth: props.profile?.dateOfBirth ?? "",
    emergencyNotes: props.profile?.emergencyNotes ?? "",
  });
  const seniorCutoff = getSeniorBirthDateCutoff();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      getSeniorDateOfBirth(formData.get("dateOfBirth"), { required: false });

      const response = await fetch("/api/profile/health", {
        body: JSON.stringify({
          assistanceLevel: formData.get("assistanceLevel"),
          dateOfBirth: formData.get("dateOfBirth"),
          emergencyNotes: formData.get("emergencyNotes"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as {
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to update the health info.");
      }

      setMessage("Health information updated.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update the health info.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Patient health information
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
          Keep the patient profile updated so caregivers and family members can work
          from the same current health context.
        </p>

        <form action={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Date of birth
            </span>
            <input
              name="dateOfBirth"
              type="date"
              value={formState.dateOfBirth}
              min="1900-01-01"
              max={seniorCutoff}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  dateOfBirth: event.target.value,
                }))
              }
              className="medic-field"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Assistance level
            </span>
            <select
              name="assistanceLevel"
              value={formState.assistanceLevel}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  assistanceLevel: event.target.value,
                }))
              }
              className="medic-field"
            >
              {assistanceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Emergency notes
            </span>
            <textarea
              name="emergencyNotes"
              value={formState.emergencyNotes}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  emergencyNotes: event.target.value,
                }))
              }
              className="medic-field min-h-32"
              maxLength={1000}
              placeholder="Medication sensitivities, emergency contacts, mobility notes..."
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="medic-button medic-button-primary"
          >
            {pending ? "Saving health info..." : "Save health info"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            {message}
          </p>
        ) : null}
      </article>

      <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Current summary
        </h2>
        <div className="mt-4 grid gap-4">
          <SummaryItem
            label="Date of birth"
            value={formState.dateOfBirth || "Not set"}
          />
          <SummaryItem
            label="Assistance level"
            value={
              assistanceOptions.find(
                (option) => option.value === formState.assistanceLevel,
              )?.label || "Not set"
            }
          />
          <SummaryItem
            label="Emergency notes"
            value={formState.emergencyNotes || "No emergency notes yet."}
          />
        </div>
      </article>
    </section>
  );
}

function getSeniorBirthDateCutoff() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 51);
  return date.toISOString().slice(0, 10);
}

function SummaryItem(props: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-primary)]">
        {props.label}
      </p>
      <p className="mt-3 text-base leading-7 text-[var(--foreground)]">{props.value}</p>
    </article>
  );
}
