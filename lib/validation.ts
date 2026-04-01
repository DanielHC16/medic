export function getRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

export function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
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
