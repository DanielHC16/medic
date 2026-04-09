export function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase();
}

export function buildInvitePath(code: string) {
  const normalizedCode = normalizeInviteCode(code);
  return `/join?code=${encodeURIComponent(normalizedCode)}`;
}

export function buildInviteUrl(origin: string, code: string) {
  return `${origin}${buildInvitePath(code)}`;
}

export function extractInviteCodeFromText(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    const code = parsedUrl.searchParams.get("code");

    if (code) {
      return normalizeInviteCode(code);
    }
  } catch {
    // Ignore invalid URLs and fall back to raw-code parsing.
  }

  const normalizedValue = trimmedValue.replace(/\s+/g, "").toUpperCase();

  if (/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  return null;
}
