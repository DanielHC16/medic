"use client";

import { useEffect, useState } from "react";

import { formatClockTime, formatFrequencyLabel } from "@/lib/display";
import {
  getLocalDateKey,
  getMedicationDoseLimitForDate,
  getNextReminderSlot,
  getTakenCountForDate,
} from "@/lib/medication-reminders";
import type {
  MedicationLogRecord,
  MedicationRecord,
  PreferredContactMethod,
  RoleSlug,
  TimeFormatPreference,
} from "@/lib/medic-types";

type ReminderStatus = "completed" | "due" | "manual" | "upcoming";

type ReminderItem = {
  doseLimit: number;
  item: MedicationRecord;
  nextSlot: Date | null;
  scheduledLabel: string;
  status: ReminderStatus;
  takenCount: number;
};

type MedicationReminderPanelProps = {
  contactMethod?: PreferredContactMethod;
  logs: MedicationLogRecord[];
  patientDisplayName: string;
  patientUserId: string;
  role: RoleSlug;
  timeFormat?: TimeFormatPreference;
  viewerDisplayName?: string;
  medications: MedicationRecord[];
};

function getContactMethodLabel(method: PreferredContactMethod | undefined) {
  switch (method) {
    case "email":
      return "Email summary is the saved reminder preference.";
    case "sms":
      return "SMS-first is the saved reminder preference.";
    default:
      return "In-app reminders are the saved reminder preference.";
  }
}

function formatLiveTime(date: Date, timeFormat: TimeFormatPreference) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    hour12: timeFormat !== "24h",
    minute: "2-digit",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatRelativeSlotLabel(slot: Date | null, now: Date) {
  if (!slot) {
    return "No scheduled reminder time";
  }

  const minutes = Math.round((slot.getTime() - now.getTime()) / 60000);

  if (minutes <= -60) {
    const hoursOverdue = Math.floor(Math.abs(minutes) / 60);
    const minutesOverdue = Math.abs(minutes) % 60;
    return minutesOverdue === 0
      ? `${hoursOverdue}h overdue`
      : `${hoursOverdue}h ${minutesOverdue}m overdue`;
  }

  if (minutes < 0) {
    return `${Math.abs(minutes)} min overdue`;
  }

  if (minutes === 0) {
    return "Due now";
  }

  if (minutes < 60) {
    return `In ${minutes} min`;
  }

  const hoursAway = Math.floor(minutes / 60);
  const minutesAway = minutes % 60;
  return minutesAway === 0
    ? `In ${hoursAway}h`
    : `In ${hoursAway}h ${minutesAway}m`;
}

function getReminderToneClasses(status: ReminderStatus) {
  switch (status) {
    case "due":
      return "border-[rgba(214,128,96,0.3)] bg-[rgba(214,128,96,0.1)]";
    case "completed":
      return "border-[rgba(92,139,107,0.18)] bg-[rgba(92,139,107,0.08)]";
    case "manual":
      return "border-[rgba(122,134,129,0.18)] bg-[rgba(122,134,129,0.08)]";
    default:
      return "border-[rgba(91,132,170,0.18)] bg-[rgba(91,132,170,0.08)]";
  }
}

function getReminderStatusLabel(status: ReminderStatus) {
  switch (status) {
    case "due":
      return "Needs attention";
    case "completed":
      return "Completed for today";
    case "manual":
      return "Manual schedule";
    default:
      return "Coming up";
  }
}

function getViewerLabel(
  role: RoleSlug,
  viewerDisplayName: string | undefined,
  patientDisplayName: string,
) {
  if (role === "patient") {
    return viewerDisplayName || patientDisplayName;
  }

  return `${viewerDisplayName || "Care partner"} for ${patientDisplayName}`;
}

function getReminderItems(
  medications: MedicationRecord[],
  logs: MedicationLogRecord[],
  now: Date,
) {
  return medications
    .filter((item) => item.isActive)
    .map((item) => {
      const takenCount = getTakenCountForDate(item, logs, now);
      const doseLimit = getMedicationDoseLimitForDate(item, now);
      const nextSlot = getNextReminderSlot(item, logs, now);
      const scheduledLabel =
        nextSlot || item.scheduleTimes[0]
          ? formatClockTime(
              nextSlot
                ? `${`${nextSlot.getHours()}`.padStart(2, "0")}:${`${nextSlot.getMinutes()}`.padStart(2, "0")}`
                : item.scheduleTimes[0],
            )
          : "No time set";

      let status: ReminderStatus = "manual";

      if (doseLimit > 0 && takenCount >= doseLimit) {
        status = "completed";
      } else if (nextSlot && nextSlot.getTime() <= now.getTime()) {
        status = "due";
      } else if (nextSlot) {
        status = "upcoming";
      }

      return {
        doseLimit,
        item,
        nextSlot,
        scheduledLabel,
        status,
        takenCount,
      } satisfies ReminderItem;
    })
    .sort((left, right) => {
      const priority = {
        due: 0,
        upcoming: 1,
        manual: 2,
        completed: 3,
      } satisfies Record<ReminderStatus, number>;
      const priorityDifference = priority[left.status] - priority[right.status];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      if (left.nextSlot && right.nextSlot) {
        return left.nextSlot.getTime() - right.nextSlot.getTime();
      }

      return left.item.name.localeCompare(right.item.name);
    });
}

function getReminderStorageKey(
  role: RoleSlug,
  patientUserId: string,
  medicationId: string,
  slot: Date,
) {
  return [
    "medic-reminder",
    role,
    patientUserId,
    medicationId,
    getLocalDateKey(slot),
    `${`${slot.getHours()}`.padStart(2, "0")}:${`${slot.getMinutes()}`.padStart(2, "0")}`,
  ].join(":");
}

export function MedicationReminderPanel({
  contactMethod = "app",
  logs,
  patientDisplayName,
  patientUserId,
  role,
  timeFormat = "12h",
  viewerDisplayName,
  medications,
}: MedicationReminderPanelProps) {
  const [now, setNow] = useState(() => new Date());
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window === "undefined" || typeof window.Notification === "undefined") {
      return "unsupported";
    }

    return window.Notification.permission;
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const reminderItems = getReminderItems(medications, logs, now);
  const dueItems = reminderItems.filter((item) => item.status === "due");
  const upcomingItems = reminderItems.filter((item) => item.status === "upcoming");
  const completedCount = reminderItems.filter((item) => item.status === "completed").length;
  const viewerLabel = getViewerLabel(role, viewerDisplayName, patientDisplayName);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.Notification === "undefined" ||
      notificationPermission !== "granted"
    ) {
      return;
    }

    for (const reminder of dueItems) {
      if (!reminder.nextSlot) {
        continue;
      }

      const storageKey = getReminderStorageKey(
        role,
        patientUserId,
        reminder.item.id,
        reminder.nextSlot,
      );

      if (window.localStorage.getItem(storageKey)) {
        continue;
      }

      const title =
        role === "patient"
          ? `Time to take ${reminder.item.name}`
          : `${patientDisplayName} is due for ${reminder.item.name}`;

      const body = `${reminder.item.dosageValue}${
        reminder.item.dosageUnit ? ` ${reminder.item.dosageUnit}` : ""
      } ${reminder.item.form.toLowerCase()} at ${reminder.scheduledLabel}.`;

      new window.Notification(title, {
        body,
        tag: storageKey,
      });
      window.localStorage.setItem(storageKey, new Date().toISOString());
    }
  }, [dueItems, notificationPermission, patientDisplayName, patientUserId, role]);

  async function enableBrowserNotifications() {
    if (typeof window === "undefined" || typeof window.Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
  }

  return (
    <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
            Live medication reminders
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {viewerLabel}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
            Local time now: {formatLiveTime(now, timeFormat)}
          </p>
          <p className="text-sm leading-6 text-[var(--color-muted-foreground)]">
            {getContactMethodLabel(contactMethod)} Browser notifications work while this page
            stays open.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatusChip label={`${dueItems.length} due now`} tone="due" />
          <StatusChip label={`${upcomingItems.length} upcoming`} tone="upcoming" />
          <StatusChip label={`${completedCount} completed`} tone="completed" />
          {notificationPermission === "default" ? (
            <button
              type="button"
              onClick={enableBrowserNotifications}
              className="medic-button medic-button-primary px-4 py-2 text-sm"
            >
              Enable browser alerts
            </button>
          ) : notificationPermission === "granted" ? (
            <StatusChip label="Browser alerts on" tone="completed" />
          ) : notificationPermission === "denied" ? (
            <StatusChip label="Browser alerts blocked" tone="manual" />
          ) : (
            <StatusChip label="Browser alerts unsupported" tone="manual" />
          )}
        </div>
      </div>

      {reminderItems.length === 0 ? (
        <p className="mt-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
          No active medications are available for reminders yet.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {reminderItems.slice(0, 6).map((reminder) => (
            <article
              key={`${reminder.item.id}-${reminder.status}`}
              className={`rounded-3xl border p-4 ${getReminderToneClasses(reminder.status)}`}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-semibold text-[var(--foreground)]">
                    {reminder.item.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {reminder.item.dosageValue}
                    {reminder.item.dosageUnit ? ` ${reminder.item.dosageUnit}` : ""} /{" "}
                    {reminder.item.form} /{" "}
                    {formatFrequencyLabel(reminder.item.scheduleFrequencyType)}
                  </p>
                </div>
                <StatusChip
                  label={getReminderStatusLabel(reminder.status)}
                  tone={reminder.status}
                />
              </div>

              <div className="mt-4 grid gap-2 text-sm text-[var(--color-muted-foreground)]">
                <p>
                  Scheduled: <span className="font-medium text-[var(--foreground)]">{reminder.scheduledLabel}</span>
                </p>
                <p>
                  Progress:{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {reminder.takenCount}/{reminder.doseLimit} doses logged today
                  </span>
                </p>
                <p>
                  Timing:{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {formatRelativeSlotLabel(reminder.nextSlot, now)}
                  </span>
                </p>
                {reminder.item.instructions ? (
                  <p>Instructions: {reminder.item.instructions}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function StatusChip(props: { label: string; tone: ReminderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        props.tone === "due"
          ? "bg-[rgba(214,128,96,0.16)] text-[rgb(130,70,43)]"
          : props.tone === "completed"
            ? "bg-[rgba(92,139,107,0.12)] text-[rgb(57,96,72)]"
            : props.tone === "upcoming"
              ? "bg-[rgba(91,132,170,0.12)] text-[rgb(57,83,107)]"
              : "bg-[rgba(122,134,129,0.14)] text-[rgb(84,93,89)]"
      }`}
    >
      {props.label}
    </span>
  );
}
