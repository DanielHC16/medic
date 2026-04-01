"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { MedicationRecord } from "@/lib/medic-types";

type MedicationManagerProps = {
  canManage: boolean;
  items: MedicationRecord[];
  patientUserId: string;
};

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function MedicationManager({
  canManage,
  items,
  patientUserId,
}: MedicationManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreateMedication(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/medications", {
        body: JSON.stringify({
          daysOfWeek: parseCommaList(String(formData.get("daysOfWeek") || "")),
          dosageUnit: formData.get("dosageUnit"),
          dosageValue: formData.get("dosageValue"),
          form: formData.get("form"),
          frequencyType: formData.get("frequencyType"),
          instructions: formData.get("instructions"),
          name: formData.get("name"),
          patientUserId,
          timesOfDay: parseCommaList(String(formData.get("timesOfDay") || "")),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to add medication.");
      }

      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add medication.");
    } finally {
      setPending(false);
    }
  }

  async function markTaken(item: MedicationRecord) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/medication-logs", {
        body: JSON.stringify({
          medicationId: item.id,
          patientUserId,
          scheduleId: item.scheduleId,
          scheduledFor: new Date().toISOString(),
          status: "taken",
          takenAt: new Date().toISOString(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        ok: boolean;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to mark medication as taken.");
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to mark medication as taken.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Medication List
        </h2>
        <div className="mt-4 grid gap-4">
          {items.length === 0 ? (
            <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
              No medications have been added yet.
            </p>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {item.name}
                    </p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {item.dosageValue}
                      {item.dosageUnit ? ` ${item.dosageUnit}` : ""} · {item.form}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      {item.scheduleFrequencyType || "manual"} ·{" "}
                      {item.scheduleTimes.join(", ") || "No times set"} ·{" "}
                      {item.scheduleDays.join(", ") || "No day pattern"}
                    </p>
                    {item.instructions ? (
                      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                        {item.instructions}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-[var(--color-muted-foreground)]">
                    <span>
                      Latest log: {item.latestLogStatus || "none"}
                    </span>
                    <span>
                      Last taken: {item.latestTakenAt ? item.latestTakenAt : "Not yet"}
                    </span>
                    {canManage ? (
                      <button
                        type="button"
                        onClick={() => markTaken(item)}
                        className="medic-button medic-button-primary px-4 py-2 text-sm"
                      >
                        Mark taken
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Add Medication
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
          Create a medication plus its initial schedule in one step.
        </p>

        {canManage ? (
          <form action={handleCreateMedication} className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Name</span>
              <input
                name="name"
                required
                className="medic-field"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Dosage value
                </span>
                <input
                  name="dosageValue"
                  required
                  className="medic-field"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Dosage unit
                </span>
                <input
                  name="dosageUnit"
                  className="medic-field"
                  placeholder="mg"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Form</span>
              <input
                name="form"
                required
                className="medic-field"
                placeholder="Tablet"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Frequency
              </span>
              <input
                name="frequencyType"
                required
                className="medic-field"
                placeholder="daily"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Days of week
              </span>
              <input
                name="daysOfWeek"
                className="medic-field"
                placeholder="Mon,Tue,Wed,Thu,Fri,Sat,Sun"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Times of day
              </span>
              <input
                name="timesOfDay"
                className="medic-field"
                placeholder="08:00,20:00"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Instructions
              </span>
              <textarea
                name="instructions"
                className="medic-field min-h-24"
              />
            </label>

            <button
              type="submit"
              disabled={pending}
              className="medic-button medic-button-primary"
            >
              {pending ? "Saving..." : "Add medication"}
            </button>
          </form>
        ) : (
          <p className="mt-5 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
            Family members have view-only access.
          </p>
        )}

        {message ? (
          <p className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
