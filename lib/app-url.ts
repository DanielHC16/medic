const DEFAULT_PUBLIC_APP_URL = "https://medic-orpin.vercel.app";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeBaseUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    return trimTrailingSlash(parsedUrl.toString());
  } catch {
    return null;
  }
}

function isLocalOrigin(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value);
}

export function getPreferredPublicAppUrl(currentOrigin?: string | null) {
  const configuredUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (configuredUrl) {
    return configuredUrl;
  }

  const normalizedOrigin = normalizeBaseUrl(currentOrigin);

  if (normalizedOrigin && !isLocalOrigin(normalizedOrigin)) {
    return normalizedOrigin;
  }

  return DEFAULT_PUBLIC_APP_URL;
}
