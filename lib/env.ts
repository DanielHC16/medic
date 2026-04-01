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

export function getEnvironmentSummary() {
  return {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasNeonProjectId: Boolean(process.env.NEON_PROJECT_ID),
    hasNeonAuthBaseUrl: Boolean(process.env.NEON_AUTH_BASE_URL),
  };
}
