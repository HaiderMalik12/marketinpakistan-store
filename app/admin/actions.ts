"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/app/lib/session";

export type LoginState = { error?: string };

function passwordsMatch(input: string, expected: string): boolean {
  // Hash both so lengths are equal and the comparison is constant-time.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { error: "Admin login is not configured." };

  const password = String(formData.get("password") ?? "");
  if (!password || !passwordsMatch(password, expected)) {
    // Slow down guessing; serverless has no shared memory for a real rate limit.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Wrong password." };
  }

  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
