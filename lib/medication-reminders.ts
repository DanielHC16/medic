import type { MedicationLogRecord, MedicationRecord } from "@/lib/medic-types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MINUTES_PER_DAY = 24 * 60;

const FREQUENCY_INTERVAL_HOURS: Record<string, number> = {
  daily: 24,
  four_times_daily: 6,
  three_times_daily: 8,
  twice_daily: 12,
};

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

function parseScheduleTimeToMinutes(value: string) {
  const [hoursString, minutesString] = value.split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

export function getMedicationIntervalHoursForSchedule(
  frequencyType: string | null | undefined,
  scheduleTimes: string[],
) {
  const frequencyInterval =
    frequencyType && FREQUENCY_INTERVAL_HOURS[frequencyType]
      ? FREQUENCY_INTERVAL_HOURS[frequencyType]
      : null;

  if (frequencyInterval) {
    return frequencyInterval;
  }

  const parsedTimes = scheduleTimes
    .map(parseScheduleTimeToMinutes)
    .filter((value): value is number => value !== null)
    .sort((left, right) => left - right);

  if (parsedTimes.length <= 1) {
    return 24;
  }

  const gaps = parsedTimes.map((time, index) => {
    const nextTime = parsedTimes[(index + 1) % parsedTimes.length];
    const gap = nextTime > time ? nextTime - time : MINUTES_PER_DAY - time + nextTime;
    return gap;
  });
  const shortestGap = Math.min(...gaps);

  return Math.max(1, Math.round(shortestGap / 60));
}

export function getMedicationIntervalHours(item: MedicationRecord) {
  if (
    typeof item.intervalHours === "number" &&
    Number.isFinite(item.intervalHours) &&
    item.intervalHours > 0
  ) {
    return item.intervalHours;
  }

  return getMedicationIntervalHoursForSchedule(
    item.scheduleFrequencyType,
    item.scheduleTimes,
  );
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

  const takenLogs = getMedicationLogsForDate(logs, item.id, date)
    .filter((log) => log.status === "taken")
    .sort((left, right) => {
      const leftDate = new Date(left.takenAt || left.scheduledFor || left.createdAt);
      const rightDate = new Date(right.takenAt || right.scheduledFor || right.createdAt);
      return leftDate.getTime() - rightDate.getTime();
    });
  const intervalMs = getMedicationIntervalHours(item) * 60 * 60 * 1000;
  let nextSlot = slots[takenCount] ?? null;

  if (!nextSlot || takenCount === 0 || !Number.isFinite(intervalMs) || intervalMs <= 0) {
    return nextSlot;
  }

  const previousTakenLog = takenLogs[takenCount - 1];
  const previousTakenAt = previousTakenLog?.takenAt
    ? new Date(previousTakenLog.takenAt)
    : null;

  if (!previousTakenAt || Number.isNaN(previousTakenAt.getTime())) {
    return nextSlot;
  }

  const earliestSafeSlot = new Date(previousTakenAt.getTime() + intervalMs);

  if (earliestSafeSlot.getTime() > nextSlot.getTime()) {
    nextSlot = earliestSafeSlot;
  }

  return nextSlot;
}
