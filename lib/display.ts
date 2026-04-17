export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatClockTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return value;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date(2000, 0, 1, hours, minutes);

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatTimeList(values: string[]) {
  return values.length > 0 ? values.map((value) => formatClockTime(value)).join(", ") : "No times set";
}

export function formatDayList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "No day pattern";
}

export function formatFrequencyLabel(value: string | null | undefined) {
  switch (value) {
    case "daily":
      return "Once daily";
    case "twice_daily":
      return "Twice daily";
    case "three_times_daily":
      return "Three times daily";
    case "four_times_daily":
      return "Four times daily";
    case "weekly":
      return "Weekly";
    case "custom":
      return "Custom schedule";
    default:
      return formatStatusLabel(value);
  }
}

export function formatStatusLabel(value: string | null | undefined) {
  if (!value) {
    return "None";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
