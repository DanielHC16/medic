function normalizeEnvironmentValue(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value.trim().replace(/^['"]+|['"]+$/g, "");
}

export function getDatabaseUrl() {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      "Missing database connection string. Expected DATABASE_URL or POSTGRES_URL.",
    );
  }

  return connectionString;
}

export function getGeminiApiKey() {
  const apiKey = normalizeEnvironmentValue(
    process.env.API_KEY ?? process.env.GEMINI_API_KEY,
  );

  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Expected API_KEY or GEMINI_API_KEY in the environment.",
    );
  }

  return apiKey;
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function getNeonAuthBaseUrl() {
  const baseUrl = normalizeEnvironmentValue(
    process.env.NEON_AUTH_BASE_URL ?? process.env.VITE_NEON_AUTH_URL,
  );

  if (!baseUrl) {
    throw new Error(
      "Missing Neon Auth URL. Expected NEON_AUTH_BASE_URL in the environment.",
    );
  }

  return baseUrl;
}

export function getNeonAuthCookieSecret() {
  const secret = normalizeEnvironmentValue(
    process.env.NEON_AUTH_COOKIE_SECRET ?? process.env.SESSION_SECRET,
  );

  if (secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing Neon Auth cookie secret. Set NEON_AUTH_COOKIE_SECRET or SESSION_SECRET to at least 32 characters.",
    );
  }

  return "medic-development-neon-auth-cookie-secret-32-chars";
}

export function getEnvironmentSummary() {
  const neonAuthCookieSecret = normalizeEnvironmentValue(
    process.env.NEON_AUTH_COOKIE_SECRET ?? process.env.SESSION_SECRET,
  );

  return {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasGeminiApiKey: Boolean(process.env.API_KEY ?? process.env.GEMINI_API_KEY),
    geminiModel: getGeminiModel(),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasNeonProjectId: Boolean(process.env.NEON_PROJECT_ID),
    hasNeonAuthBaseUrl: Boolean(process.env.NEON_AUTH_BASE_URL),
    hasNeonAuthCookieSecret: neonAuthCookieSecret.length >= 32,
    hasDedicatedNeonAuthCookieSecret: Boolean(process.env.NEON_AUTH_COOKIE_SECRET),
    usesDevelopmentNeonAuthCookieSecret: neonAuthCookieSecret.length < 32,
  };
}
