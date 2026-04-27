export function getRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

export function getOptionalString(value: unknown, fieldName = "Field", maxLength = 1000) {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be valid text.`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }

  return trimmedValue;
}

export function getBooleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return fallback;
}

export function getRequiredBoolean(value: unknown, fieldName: string) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  throw new Error(`${fieldName} must be true or false.`);
}

export function getOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function getPositiveInteger(
  value: unknown,
  fieldName: string,
  options: { max?: number; required: false },
): number | null;
export function getPositiveInteger(
  value: unknown,
  fieldName: string,
  options?: { max?: number; required?: true },
): number;
export function getPositiveInteger(
  value: unknown,
  fieldName: string,
  options: { max?: number; required?: boolean } = {},
) {
  const { max = 10_000, required = true } = options;

  if (value == null || value === "") {
    if (!required) {
      return null;
    }

    throw new Error(`${fieldName} is required.`);
  }

  const parsedValue =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > max) {
    throw new Error(`${fieldName} must be a whole number between 1 and ${max}.`);
  }

  return parsedValue;
}

export function getStringArray(value: unknown, fieldName = "List", maxItems = 20) {
  if (!Array.isArray(value)) {
    return [];
  }

  const items = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (items.length > maxItems) {
    throw new Error(`${fieldName} must include ${maxItems} items or fewer.`);
  }

  return items;
}

export function getOptionalImageDataUrl(value: unknown, fieldLabel = "Image") {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldLabel} must be a valid uploaded image.`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue.startsWith("data:image/")) {
    throw new Error(`${fieldLabel} must be a valid image upload.`);
  }

  if (trimmedValue.length > 2_000_000) {
    throw new Error(`${fieldLabel} is too large. Please choose a smaller image.`);
  }

  return trimmedValue;
}

export function assertRole(value: unknown) {
  if (
    value !== "patient" &&
    value !== "caregiver" &&
    value !== "family_member"
  ) {
    throw new Error("A valid role is required.");
  }

  return value;
}

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .-]{0,78}[\p{L}\p{M}.]$/u;
const TEXT_PATTERN = /^[\p{L}\p{M}\p{N}\s.,'"/()\-:+#&%!?@]+$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{1,127}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const INVITE_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
const DOSAGE_VALUE_PATTERN = /^(?:0\.[0-9]{1,3}|[1-9][0-9]{0,5}(?:\.[0-9]{1,3})?)$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const MAX_BIRTH_DATE = "1900-01-01";
export const MIN_SENIOR_AGE = 51;

const PASSWORD_REQUIREMENTS = [
  {
    id: "length",
    label: `${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters`,
    test: (password: string) =>
      password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
  },
  {
    id: "lowercase",
    label: "a lowercase letter",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: "uppercase",
    label: "an uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "a number",
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    id: "symbol",
    label: "a symbol",
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAY_ALIASES = new Map([
  ["sunday", "Sun"],
  ["sun", "Sun"],
  ["monday", "Mon"],
  ["mon", "Mon"],
  ["tuesday", "Tue"],
  ["tue", "Tue"],
  ["tues", "Tue"],
  ["wednesday", "Wed"],
  ["wed", "Wed"],
  ["thursday", "Thu"],
  ["thu", "Thu"],
  ["thur", "Thu"],
  ["thurs", "Thu"],
  ["friday", "Fri"],
  ["fri", "Fri"],
  ["saturday", "Sat"],
  ["sat", "Sat"],
]);

type AppointmentStatus = "cancelled" | "completed" | "scheduled";
type AssistanceLevel =
  | "caregiver_assistance"
  | "family_support"
  | "independent"
  | "limited_mobility"
  | "minimal_assistance";
type MedicationFrequency =
  | "custom"
  | "daily"
  | "four_times_daily"
  | "three_times_daily"
  | "twice_daily"
  | "weekly";
type RoutineFrequency = "custom" | "daily" | "twice_daily" | "weekdays" | "weekly";

function assertLength(value: string, fieldName: string, minLength: number, maxLength: number) {
  if (value.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters.`);
  }

  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
}

export function getSafeText(
  value: unknown,
  fieldName: string,
  options: { maxLength?: number; minLength?: number; required: false },
): string | null;
export function getSafeText(
  value: unknown,
  fieldName: string,
  options?: { maxLength?: number; minLength?: number; required?: true },
): string;
export function getSafeText(
  value: unknown,
  fieldName: string,
  options: { maxLength?: number; minLength?: number; required?: boolean } = {},
) {
  const { maxLength = 160, minLength = 1, required = true } = options;

  if (value == null || value === "") {
    if (!required) {
      return null;
    }

    throw new Error(`${fieldName} is required.`);
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be valid text.`);
  }

  const trimmedValue = value.trim().replace(/\s+/g, " ");

  if (!trimmedValue) {
    if (!required) {
      return null;
    }

    throw new Error(`${fieldName} is required.`);
  }

  assertLength(trimmedValue, fieldName, minLength, maxLength);

  if (!TEXT_PATTERN.test(trimmedValue)) {
    throw new Error(`${fieldName} contains unsupported characters.`);
  }

  return trimmedValue;
}

export function getPersonName(value: unknown, fieldName: string) {
  const name = getSafeText(value, fieldName, {
    maxLength: 80,
    minLength: 2,
  });

  if (!NAME_PATTERN.test(name)) {
    throw new Error(`${fieldName} must be a valid name.`);
  }

  return name;
}

export function getEmail(value: unknown, fieldName = "Email") {
  const email = getRequiredString(value, fieldName).toLowerCase();
  assertLength(email, fieldName, 5, 254);

  if (
    !EMAIL_PATTERN.test(email) ||
    email.includes("..") ||
    email.startsWith(".") ||
    email.endsWith(".")
  ) {
    throw new Error(`${fieldName} must be a valid email address.`);
  }

  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    throw new Error(`${fieldName} must be a valid email address.`);
  }

  const domainLabels = domain.split(".");
  const hasInvalidLabel = domainLabels.some(
    (label) =>
      label.length === 0 ||
      label.length > 63 ||
      label.startsWith("-") ||
      label.endsWith("-") ||
      !/^[a-z0-9-]+$/.test(label),
  );

  if (hasInvalidLabel) {
    throw new Error(`${fieldName} must be a valid email address.`);
  }

  return email;
}

export function getPhoneNumber(
  value: unknown,
  fieldName: string,
  options: { required: false },
): string | null;
export function getPhoneNumber(
  value: unknown,
  fieldName?: string,
  options?: { required?: true },
): string;
export function getPhoneNumber(
  value: unknown,
  fieldName = "Phone",
  options: { required?: boolean } = {},
) {
  const { required = true } = options;

  if (value == null || value === "") {
    if (!required) {
      return null;
    }

    throw new Error(`${fieldName} is required.`);
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a valid phone number.`);
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 15) {
    throw new Error(`${fieldName} must contain 10 to 15 digits.`);
  }

  if (/^0+$/.test(digits) || /^(\d)\1+$/.test(digits)) {
    throw new Error(`${fieldName} must be a real phone number.`);
  }

  return digits;
}

function formatRequirementList(items: string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function getPasswordRequirementStatuses(value: unknown) {
  const password = typeof value === "string" ? value.trim() : "";

  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    id: requirement.id,
    isMet: requirement.test(password),
    label: requirement.label,
  }));
}

export function getPasswordRequirementMessage(value: unknown) {
  const missingRequirements = getPasswordRequirementStatuses(value)
    .filter((requirement) => !requirement.isMet)
    .map((requirement) => requirement.label);

  if (missingRequirements.length === 0) {
    return null;
  }

  return `Password must include ${formatRequirementList(missingRequirements)}.`;
}

export function getPassword(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("Password must be valid text.");
  }

  const password = value.trim();
  const requirementMessage = getPasswordRequirementMessage(password);

  if (requirementMessage) {
    throw new Error(requirementMessage);
  }

  return password;
}

export function getLoginPassword(value: unknown) {
  const password = getRequiredString(value, "Password");
  assertLength(password, "Password", 1, PASSWORD_MAX_LENGTH);
  return password;
}

export function getLoginIdentifier(value: unknown) {
  const identifier = getRequiredString(value, "Email or phone");

  if (identifier.includes("@")) {
    return getEmail(identifier, "Email");
  }

  return getPhoneNumber(identifier, "Phone");
}

export function getEntityId(
  value: unknown,
  fieldName: string,
  options: { required: false },
): string | null;
export function getEntityId(
  value: unknown,
  fieldName?: string,
  options?: { required?: true },
): string;
export function getEntityId(
  value: unknown,
  fieldName = "Identifier",
  options: { required?: boolean } = {},
) {
  const { required = true } = options;

  if (value == null || value === "") {
    if (!required) {
      return null;
    }

    throw new Error(`${fieldName} is required.`);
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be valid.`);
  }

  const id = value.trim();

  if (!ID_PATTERN.test(id)) {
    throw new Error(`${fieldName} must be valid.`);
  }

  return id;
}

function getDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return {
    day: Number(day),
    date,
    month: Number(month),
    year: Number(year),
  };
}

function getAgeOn(dateOfBirth: Date, today = new Date()) {
  let age = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - dateOfBirth.getUTCMonth();
  const dayDelta = today.getUTCDate() - dateOfBirth.getUTCDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  return age;
}

export function getDateOnly(
  value: unknown,
  fieldName: string,
  options: { max?: string; min?: string; required: false },
): string | null;
export function getDateOnly(
  value: unknown,
  fieldName: string,
  options?: { max?: string; min?: string; required?: true },
): string;
export function getDateOnly(
  value: unknown,
  fieldName: string,
  options: { max?: string; min?: string; required?: boolean } = {},
) {
  const { max, min, required = true } = options;

  if (value == null || value === "") {
    if (!required) {
      return null;
    }

    throw new Error(`${fieldName} is required.`);
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a valid date.`);
  }

  const trimmedValue = value.trim();
  const parts = getDateParts(trimmedValue);

  if (!parts) {
    throw new Error(`${fieldName} must be a valid date.`);
  }

  if (min && trimmedValue < min) {
    throw new Error(`${fieldName} must be on or after ${min}.`);
  }

  if (max && trimmedValue > max) {
    throw new Error(`${fieldName} must be on or before ${max}.`);
  }

  return trimmedValue;
}

export function getSeniorDateOfBirth(
  value: unknown,
  options: { required?: boolean } = {},
) {
  const dateOfBirth =
    options.required === false
      ? getDateOnly(value, "Date of birth", {
          min: MAX_BIRTH_DATE,
          required: false,
        })
      : getDateOnly(value, "Date of birth", {
          min: MAX_BIRTH_DATE,
        });

  if (!dateOfBirth) {
    return null;
  }

  const parts = getDateParts(dateOfBirth);

  if (!parts || parts.date > new Date()) {
    throw new Error("Date of birth must be a valid past date.");
  }

  if (getAgeOn(parts.date) < MIN_SENIOR_AGE) {
    throw new Error("Senior patient age must be over 50.");
  }

  return dateOfBirth;
}

export function getDateTime(
  value: unknown,
  fieldName: string,
  options: { required: false },
): string | null;
export function getDateTime(
  value: unknown,
  fieldName: string,
  options?: { required?: true },
): string;
export function getDateTime(
  value: unknown,
  fieldName: string,
  options: { required?: boolean } = {},
) {
  if (value == null || value === "") {
    if (options.required === false) {
      return null;
    }

    throw new Error(`${fieldName} is required.`);
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a valid date and time.`);
  }

  const trimmedValue = value.trim();
  const date = new Date(trimmedValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date and time.`);
  }

  const lowerBound = Date.UTC(2000, 0, 1);
  const upperBound = Date.now() + 1000 * 60 * 60 * 24 * 365 * 10;

  if (date.getTime() < lowerBound || date.getTime() > upperBound) {
    throw new Error(`${fieldName} must be within a valid scheduling range.`);
  }

  return trimmedValue;
}

export function getInviteCode(
  value: unknown,
  options: { required: false },
): string | null;
export function getInviteCode(value: unknown, options?: { required?: true }): string;
export function getInviteCode(value: unknown, options: { required?: boolean } = {}) {
  if (value == null || value === "") {
    if (options.required === false) {
      return null;
    }

    throw new Error("Invite code is required.");
  }

  if (typeof value !== "string") {
    throw new Error("Invite code must be valid.");
  }

  const code = value.replace(/\s+/g, "").toUpperCase();

  if (!INVITE_CODE_PATTERN.test(code)) {
    throw new Error("Invite code must be a valid 6-character code.");
  }

  return code;
}

function getEnumValue<const T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
  fieldName: string,
  fallback?: T[number],
) {
  if (value == null || value === "") {
    if (fallback) {
      return fallback;
    }

    throw new Error(`${fieldName} is required.`);
  }

  if (typeof value !== "string" || !allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be valid.`);
  }

  return value as T[number];
}

export function getInviteApprovalMode(value: unknown, fallback: "auto" | "manual" = "manual") {
  return getEnumValue(value, ["auto", "manual"] as const, "Approval mode", fallback);
}

export function getPreferredContactMethod(value: unknown) {
  return getEnumValue(value, ["app", "email", "sms"] as const, "Preferred contact method");
}

export function getTimeFormatPreference(value: unknown) {
  return getEnumValue(value, ["12h", "24h"] as const, "Time format");
}

export function getAssistanceLevel(
  value: unknown,
  fallback: AssistanceLevel = "independent",
) {
  return getEnumValue(
    value,
    [
      "caregiver_assistance",
      "family_support",
      "independent",
      "limited_mobility",
      "minimal_assistance",
    ] as const,
    "Assistance level",
    fallback,
  );
}

export function getMedicationFrequency(value: unknown): MedicationFrequency {
  return getEnumValue(
    value,
    ["custom", "daily", "four_times_daily", "three_times_daily", "twice_daily", "weekly"] as const,
    "Frequency",
  );
}

export function getRoutineFrequency(value: unknown): RoutineFrequency {
  return getEnumValue(
    value,
    ["custom", "daily", "twice_daily", "weekdays", "weekly"] as const,
    "Frequency",
  );
}

export function getAppointmentStatus(value: unknown): AppointmentStatus {
  return getEnumValue(value, ["cancelled", "completed", "scheduled"] as const, "Appointment status");
}

export function getMedicationLogStatus(value: unknown) {
  return getEnumValue(
    value,
    ["missed", "queued_offline", "skipped", "taken"] as const,
    "Medication log status",
    "taken",
  );
}

export function getActivityCompletionStatus(value: unknown) {
  return getEnumValue(
    value,
    ["done", "missed", "planned"] as const,
    "Activity status",
    "planned",
  );
}

export function getDosageValue(value: unknown) {
  const dosageValue = getRequiredString(value, "Dosage value");

  if (!DOSAGE_VALUE_PATTERN.test(dosageValue)) {
    throw new Error("Dosage value must be a positive number.");
  }

  return dosageValue;
}

export function getDosageUnit(value: unknown) {
  const unit = getOptionalString(value, "Dosage unit", 20);

  if (!unit) {
    return null;
  }

  if (!/^[A-Za-z][A-Za-z0-9/% ]{0,19}$/.test(unit)) {
    throw new Error("Dosage unit must be valid.");
  }

  return unit;
}

export function getWeekdayArray(value: unknown, fieldName = "Days of week") {
  const rawItems =
    typeof value === "string"
      ? value.split(",")
      : Array.isArray(value)
        ? value
        : [];
  const normalizedDays: string[] = [];

  for (const item of rawItems) {
    if (typeof item !== "string") {
      throw new Error(`${fieldName} must only include valid weekdays.`);
    }

    const normalizedDay = WEEKDAY_ALIASES.get(item.trim().toLowerCase());

    if (!normalizedDay) {
      throw new Error(`${fieldName} includes an invalid weekday.`);
    }

    if (!normalizedDays.includes(normalizedDay)) {
      normalizedDays.push(normalizedDay);
    }
  }

  const sortedDays = WEEKDAYS.filter((day) => normalizedDays.includes(day));

  if (sortedDays.length === 0) {
    throw new Error(`${fieldName} must include at least one weekday.`);
  }

  return sortedDays;
}

export function getTimeArray(value: unknown, fieldName = "Times of day") {
  const rawItems =
    typeof value === "string"
      ? value.split(",")
      : Array.isArray(value)
        ? value
        : [];
  const times: string[] = [];

  for (const item of rawItems) {
    if (typeof item !== "string") {
      throw new Error(`${fieldName} must only include valid times.`);
    }

    const time = item.trim();

    if (!TIME_PATTERN.test(time)) {
      throw new Error(`${fieldName} must use HH:MM times.`);
    }

    if (!times.includes(time)) {
      times.push(time);
    }
  }

  if (times.length === 0) {
    throw new Error(`${fieldName} must include at least one time.`);
  }

  if (times.length > 12) {
    throw new Error(`${fieldName} must include 12 times or fewer.`);
  }

  return times.sort();
}

export function getOptionalDateTime(value: unknown, fieldName: string) {
  return getDateTime(value, fieldName, { required: false });
}

export function getOptionalRedirectPath(value: unknown) {
  const path = getOptionalString(value, "Redirect URL", 200);

  if (!path) {
    return null;
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    throw new Error("Redirect URL must be an internal app path.");
  }

  return path;
}
