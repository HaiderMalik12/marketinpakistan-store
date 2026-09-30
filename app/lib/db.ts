import "server-only";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;

export function getSql() {
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}
