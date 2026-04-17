import type { MedicationLogRecord, MedicationRecord } from "@/lib/medic-types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekdayLabel(date: Date) {
  return WEEKDAY_LABELS[date.getDay()];
}

export function isMedicationScheduledToday(item: MedicationRecord, date: Date) {
  if (item.scheduleDays.length === 0) {
    return true;
  }

  return item.scheduleDays.includes(getWeekdayLabel(date));
}

export function getMedicationDoseLimitForDate(item: MedicationRecord, date: Date) {
  const slotCount = item.scheduleTimes.length;

  if (!isMedicationScheduledToday(item, date)) {
    return slotCount > 0 ? slotCount : 1;
  }

  return slotCount > 0 ? slotCount : 1;
}

function getLogDateKey(log: MedicationLogRecord) {
  if (log.loggedForDate) {
    return log.loggedForDate;
  }

  const reference = log.takenAt || log.scheduledFor || log.createdAt;
  return getLocalDateKey(new Date(reference));
}

export function getMedicationLogsForDate(
  logs: MedicationLogRecord[],
  medicationId: string,
  date: Date,
) {
  const targetKey = getLocalDateKey(date);

  return logs.filter(
    (log) => log.medicationId === medicationId && getLogDateKey(log) === targetKey,
  );
}

export function getTakenCountForDate(
  item: MedicationRecord,
  logs: MedicationLogRecord[],
  date: Date,
) {
  return getMedicationLogsForDate(logs, item.id, date).filter(
    (log) => log.status === "taken",
  ).length;
}

export function getMedicationReminderSlots(item: MedicationRecord, date: Date) {
  if (!isMedicationScheduledToday(item, date)) {
    return [] as Date[];
  }

  return item.scheduleTimes
    .map((value) => {
      const [hoursString, minutesString] = value.split(":");
      const hours = Number(hoursString);
      const minutes = Number(minutesString);

      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return null;
      }

      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hours,
        minutes,
        0,
        0,
      );
    })
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => left.getTime() - right.getTime());
}

export function getNextReminderSlot(
  item: MedicationRecord,
  logs: MedicationLogRecord[],
  date: Date,
) {
  const slots = getMedicationReminderSlots(item, date);
  const takenCount = getTakenCountForDate(item, logs, date);

  if (takenCount >= slots.length) {
    return null;
  }

  return slots[takenCount] ?? null;
}
