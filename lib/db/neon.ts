import { neon } from "@neondatabase/serverless";

import { getDatabaseUrl } from "@/lib/env";

type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | undefined;

export function getSql() {
  if (!sqlClient) {
    sqlClient = neon(getDatabaseUrl());
  }

  return sqlClient;
}

export async function runDatabaseStatusCheck() {
  const sql = getSql();
  const rows = (await sql.query(
    `select
      current_database() as database_name,
      current_user as current_user,
      now()::text as server_time,
      version() as postgres_version`,
  )) as Array<{
    current_user: string;
    database_name: string;
    postgres_version: string;
    server_time: string;
  }>;
  const row = rows[0];

  return {
    currentUser: row.current_user,
    databaseName: row.database_name,
    postgresVersion: row.postgres_version,
    serverTime: row.server_time,
  };
}
