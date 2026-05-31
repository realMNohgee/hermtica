import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbUrl = process.env.TURSO_DATABASE_URL || "file:./hermtica.db";
// Convert libsql:// to https:// for Vercel compatibility
const url = dbUrl.replace("libsql://", "https://");

export const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });
