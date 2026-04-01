"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ActivityPlanRecord, AppointmentRecord } from "@/lib/medic-types";

function parseCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function WellnessManager(props: {
  activityPlans: ActivityPlanRecord[];
  appointments: AppointmentRecord[];
  canManage: boolean;
  patientUserId: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createActivity(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/activities", {
        body: JSON.stringify({
          category: formData.get("category"),
          daysOfWeek: parseCommaList(String(formData.get("daysOfWeek") || "")),
          frequencyType: formData.get("frequencyType"),
          instructions: formData.get("instructions"),
          patientUserId: props.patientUserId,
          targetMinutes: Number(formData.get("targetMinutes") || 0) || null,
          title: formData.get("title"),
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
        throw new Error(payload.message || "Unable to create activity plan.");
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create activity plan.",
      );
    } finally {
      setPending(false);
    }
  }

  async function createAppointmentItem(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/appointments", {
        body: JSON.stringify({
          appointmentAt: formData.get("appointmentAt"),
          location: formData.get("location"),
          notes: formData.get("notes"),
          patientUserId: props.patientUserId,
          providerName: formData.get("providerName"),
          title: formData.get("appointmentTitle"),
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
        throw new Error(payload.message || "Unable to create appointment.");
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create appointment.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Wellness Routines
        </h2>
        <div className="mt-4 grid gap-4">
          {props.activityPlans.length === 0 ? (
            <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
              No wellness routines yet.
            </p>
          ) : (
            props.activityPlans.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  {item.category} · {item.frequencyType} · {item.daysOfWeek.join(", ")}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  {item.instructions || "No extra instructions."}
                </p>
              </article>
            ))
          )}
        </div>

        {props.canManage ? (
          <form action={createActivity} className="mt-6 grid gap-4">
            <input
              name="title"
              placeholder="Routine title"
              className="medic-field"
            />
            <input
              name="category"
              placeholder="mobility"
              className="medic-field"
            />
            <input
              name="frequencyType"
              placeholder="daily"
              className="medic-field"
            />
            <input
              name="daysOfWeek"
              placeholder="Mon,Tue,Wed"
              className="medic-field"
            />
            <input
              name="targetMinutes"
              type="number"
              placeholder="10"
              className="medic-field"
            />
            <textarea
              name="instructions"
              placeholder="Instructions"
              className="medic-field min-h-24"
            />
            <button
              type="submit"
              disabled={pending}
              className="medic-button medic-button-primary"
            >
              Add routine
            </button>
          </form>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Appointments
        </h2>
        <div className="mt-4 grid gap-4">
          {props.appointments.length === 0 ? (
            <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
              No appointments yet.
            </p>
          ) : (
            props.appointments.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  {item.providerName || "Provider not set"} · {item.location || "No location"}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  {item.appointmentAt}
                </p>
              </article>
            ))
          )}
        </div>

        {props.canManage ? (
          <form action={createAppointmentItem} className="mt-6 grid gap-4">
            <input
              name="appointmentTitle"
              placeholder="Checkup"
              className="medic-field"
            />
            <input
              name="providerName"
              placeholder="Dr. Lim"
              className="medic-field"
            />
            <input
              name="location"
              placeholder="ABC Clinic"
              className="medic-field"
            />
            <input
              name="appointmentAt"
              type="datetime-local"
              className="medic-field"
            />
            <textarea
              name="notes"
              placeholder="Notes"
              className="medic-field min-h-24"
            />
            <button
              type="submit"
              disabled={pending}
              className="medic-button medic-button-primary"
            >
              Add appointment
            </button>
          </form>
        ) : null}

        {message ? (
          <p className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
