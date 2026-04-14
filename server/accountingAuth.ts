/**
 * Accounting Admin PIN Authentication
 *
 * Simple PIN-based authentication for the accounting dashboard.
 * This bypasses Manus OAuth and uses a secret PIN stored in ACCOUNTING_ADMIN_PIN env var.
 * The PIN is verified server-side and a signed session cookie is set.
 */

import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./_core/env";

const ACCOUNTING_COOKIE = "yfit_accounting_session";
const ACCOUNTING_SESSION_DURATION = 8 * 60 * 60; // 8 hours in seconds

function getSecret(): Uint8Array {
  const secret = ENV.cookieSecret || "fallback-dev-secret-do-not-use-in-prod";
  return new TextEncoder().encode(secret);
}

/**
 * Verify the provided PIN against the environment variable.
 * Returns true if correct, false otherwise.
 */
export function verifyAdminPin(pin: string): boolean {
  const correctPin = ENV.accountingAdminPin;
  if (!correctPin) {
    console.warn("[AccountingAuth] ACCOUNTING_ADMIN_PIN is not set");
    return false;
  }
  return pin === correctPin;
}

/**
 * Create a signed JWT session token for the accounting dashboard.
 */
export async function createAccountingSession(): Promise<string> {
  const token = await new SignJWT({ role: "accounting_admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCOUNTING_SESSION_DURATION}s`)
    .sign(getSecret());
  return token;
}

/**
 * Verify an accounting session token from the cookie.
 * Returns true if valid, false otherwise.
 */
export async function verifyAccountingSession(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "accounting_admin";
  } catch {
    return false;
  }
}

/**
 * Extract the accounting session cookie from an Express request.
 */
export function getAccountingCookie(req: { cookies?: Record<string, string> }): string | null {
  return req.cookies?.[ACCOUNTING_COOKIE] ?? null;
}

export { ACCOUNTING_COOKIE, ACCOUNTING_SESSION_DURATION };
