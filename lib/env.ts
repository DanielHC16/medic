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
  const apiKey = process.env.API_KEY ?? process.env.GEMINI_API_KEY;

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

export function getEnvironmentSummary() {
  return {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasGeminiApiKey: Boolean(process.env.API_KEY ?? process.env.GEMINI_API_KEY),
    geminiModel: getGeminiModel(),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasNeonProjectId: Boolean(process.env.NEON_PROJECT_ID),
    hasNeonAuthBaseUrl: Boolean(process.env.NEON_AUTH_BASE_URL),
  };
}
