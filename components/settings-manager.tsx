"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { UserPreferences } from "@/lib/medic-types";

export function SettingsManager(props: {
  preferences: UserPreferences;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    dailySummaryEnabled: props.preferences.dailySummaryEnabled,
    highContrastEnabled: props.preferences.highContrastEnabled,
    largeTextEnabled: props.preferences.largeTextEnabled,
    preferredContactMethod: props.preferences.preferredContactMethod,
    timeFormat: props.preferences.timeFormat,
  });

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/settings", {
        body: JSON.stringify({
          dailySummaryEnabled: formData.get("dailySummaryEnabled") === "on",
          highContrastEnabled: formData.get("highContrastEnabled") === "on",
          largeTextEnabled: formData.get("largeTextEnabled") === "on",
          preferredContactMethod: formData.get("preferredContactMethod"),
          timeFormat: formData.get("timeFormat"),
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
        throw new Error(payload.message || "Unable to update settings.");
      }

      setMessage("Settings updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update settings.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Settings and preferences
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted-foreground)]">
          Adjust how reminders and patient information are presented inside MEDIC.
        </p>

        <form action={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Preferred contact method
            </span>
            <select
              name="preferredContactMethod"
              value={formState.preferredContactMethod}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  preferredContactMethod: event.target.value as UserPreferences["preferredContactMethod"],
                }))
              }
              className="medic-field"
            >
              <option value="app">In-app only</option>
              <option value="email">Email summary</option>
              <option value="sms">SMS-first</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              Time format
            </span>
            <select
              name="timeFormat"
              value={formState.timeFormat}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  timeFormat: event.target.value as UserPreferences["timeFormat"],
                }))
              }
              className="medic-field"
            >
              <option value="12h">12-hour clock</option>
              <option value="24h">24-hour clock</option>
            </select>
          </label>

          <ToggleRow
            checked={formState.largeTextEnabled}
            description="Increase text size on MEDIC cards and forms."
            name="largeTextEnabled"
            onChange={(checked) =>
              setFormState((current) => ({
                ...current,
                largeTextEnabled: checked,
              }))
            }
            title="Large text mode"
          />

          <ToggleRow
            checked={formState.highContrastEnabled}
            description="Use stronger contrast for labels, cards, and key actions."
            name="highContrastEnabled"
            onChange={(checked) =>
              setFormState((current) => ({
                ...current,
                highContrastEnabled: checked,
              }))
            }
            title="High contrast mode"
          />

          <ToggleRow
            checked={formState.dailySummaryEnabled}
            description="Show and prepare the daily status summary for the patient dashboard."
            name="dailySummaryEnabled"
            onChange={(checked) =>
              setFormState((current) => ({
                ...current,
                dailySummaryEnabled: checked,
              }))
            }
            title="Daily summary cards"
          />

          <button
            type="submit"
            disabled={pending}
            className="medic-button medic-button-primary"
          >
            {pending ? "Saving settings..." : "Save settings"}
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
          Preference preview
        </h2>
        <div className="mt-4 grid gap-4">
          <PreviewItem
            label="Contact method"
            value={formState.preferredContactMethod}
          />
          <PreviewItem label="Time format" value={formState.timeFormat} />
          <PreviewItem
            label="Large text"
            value={formState.largeTextEnabled ? "Enabled" : "Disabled"}
          />
          <PreviewItem
            label="High contrast"
            value={formState.highContrastEnabled ? "Enabled" : "Disabled"}
          />
          <PreviewItem
            label="Daily summary"
            value={formState.dailySummaryEnabled ? "Enabled" : "Disabled"}
          />
        </div>
      </article>
    </section>
  );
}

function ToggleRow(props: {
  checked: boolean;
  description: string;
  name: string;
  onChange: (checked: boolean) => void;
  title: string;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <div>
        <p className="text-base font-semibold text-[var(--foreground)]">{props.title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted-foreground)]">
          {props.description}
        </p>
      </div>
      <input
        type="checkbox"
        name={props.name}
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
        className="mt-1 h-5 w-5 accent-[var(--color-primary)]"
      />
    </label>
  );
}

function PreviewItem(props: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-primary)]">
        {props.label}
      </p>
      <p className="mt-3 text-base text-[var(--foreground)]">{props.value}</p>
    </article>
  );
}
