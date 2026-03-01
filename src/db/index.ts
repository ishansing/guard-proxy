import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(Bun.env.DATABASE_URL ?? "postgres://user:pass@localhost:5432/db", {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {}, // suppress notices
});

export const db = drizzle(client, { schema });
export { schema };
