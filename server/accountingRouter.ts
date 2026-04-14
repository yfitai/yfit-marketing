/**
 * Accounting tRPC Router
 *
 * Provides procedures for the monthly P&L / GST accounting system.
 * Handles CSV uploads, expense management, and report generation.
 *
 * Authentication: PIN-based (ACCOUNTING_ADMIN_PIN env var).
 * The frontend sends the PIN in a header; the server verifies it.
 * A valid PIN sets a signed session cookie (8 hours).
 */

import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { expenses, csvImportBatches, monthlyReports, stripeIncome } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { importCibcCsv, getExpensesForMonth } from "./csvImporter";
import { syncStripeIncomeForMonth, getStripeIncomeForMonth } from "./stripeSync";
import {
  verifyAdminPin,
  createAccountingSession,
  verifyAccountingSession,
  getAccountingCookie,
  ACCOUNTING_COOKIE,
  ACCOUNTING_SESSION_DURATION,
} from "./accountingAuth";

// ─── PIN Auth Middleware ───────────────────────────────────────────────────────

/**
 * Verify the accounting session cookie.
 * Throws UNAUTHORIZED if not authenticated.
 */
async function requireAccountingAuth(ctx: { req: { cookies?: Record<string, string> } }) {
  const token = getAccountingCookie(ctx.req);
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Accounting authentication required" });
  }
  const valid = await verifyAccountingSession(token);
  if (!valid) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired accounting session" });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute and upsert a monthly report record.
 */
async function computeMonthlyReport(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const period = `${year}-${String(month).padStart(2, "0")}`;

  const income = await getStripeIncomeForMonth(year, month);
  const expenseData = await getExpensesForMonth(year, month);

  const netGstRemittableCadCents = income.gstCollectedCadCents - expenseData.totalGstItcCadCents;
  const netProfitCadCents = income.netRevenueCadCents - expenseData.totalExpensesCadCents;

  const reportData = {
    period,
    grossRevenueCadCents: income.grossRevenueCadCents,
    totalRefundsCadCents: income.totalRefundsCadCents,
    stripeFeesTotalCadCents: income.stripeFeesTotalCadCents,
    netRevenueCadCents: income.netRevenueCadCents,
    gstCollectedCadCents: income.gstCollectedCadCents,
    totalExpensesCadCents: expenseData.totalExpensesCadCents,
    totalGstItcCadCents: expenseData.totalGstItcCadCents,
    netGstRemittableCadCents,
    netProfitCadCents,
  };

  const existing = await db
    .select({ id: monthlyReports.id })
    .from(monthlyReports)
    .where(eq(monthlyReports.period, period));

  if (existing.length > 0) {
    await db
      .update(monthlyReports)
      .set(reportData)
      .where(eq(monthlyReports.period, period));
  } else {
    await db.insert(monthlyReports).values(reportData);
  }

  return {
    ...reportData,
    incomeRows: income.rows,
    expenseRows: expenseData.rows,
    expensesByCategory: expenseData.byCategory,
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const accountingRouter = router({
  /**
   * Verify admin PIN and set session cookie.
   * Returns { success: true } on correct PIN.
   */
  login: publicProcedure
    .input(z.object({ pin: z.string().min(4) }))
    .mutation(async ({ input, ctx }) => {
      const correct = verifyAdminPin(input.pin);
      if (!correct) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect PIN" });
      }

      const token = await createAccountingSession();

      // Set cookie: httpOnly, secure in production, 8 hours
      ctx.res.cookie(ACCOUNTING_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ACCOUNTING_SESSION_DURATION * 1000,
        path: "/",
      });

      return { success: true };
    }),

  /**
   * Check if the current session is valid.
   */
  checkSession: publicProcedure.query(async ({ ctx }) => {
    const token = getAccountingCookie(ctx.req);
    if (!token) return { authenticated: false };
    const valid = await verifyAccountingSession(token);
    return { authenticated: valid };
  }),

  /**
   * Logout — clear the accounting session cookie.
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(ACCOUNTING_COOKIE, { path: "/" });
    return { success: true };
  }),

  /**
   * Upload and import a CIBC CSV file.
   */
  uploadCsv: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        csvContent: z.string(),
        statementMonth: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await requireAccountingAuth(ctx);
      const result = await importCibcCsv(input.csvContent, input.fileName, input.statementMonth);
      return result;
    }),

  /**
   * Sync Stripe income for a given month.
   */
  syncStripe: publicProcedure
    .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
    .mutation(async ({ input, ctx }) => {
      await requireAccountingAuth(ctx);
      return syncStripeIncomeForMonth(input.year, input.month);
    }),

  /**
   * Get the full monthly report data (income + expenses + GST summary).
   */
  getMonthlyReport: publicProcedure
    .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
    .query(async ({ input, ctx }) => {
      await requireAccountingAuth(ctx);
      return computeMonthlyReport(input.year, input.month);
    }),

  /**
   * List all monthly reports.
   */
  listReports: publicProcedure.query(async ({ ctx }) => {
    await requireAccountingAuth(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    return db
      .select()
      .from(monthlyReports)
      .orderBy(desc(monthlyReports.period));
  }),

  /**
   * List all expenses for a given month.
   */
  listExpenses: publicProcedure
    .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
    .query(async ({ input, ctx }) => {
      await requireAccountingAuth(ctx);
      return getExpensesForMonth(input.year, input.month);
    }),

  /**
   * Update an expense (category, notes, gstEligible, reviewed).
   */
  updateExpense: publicProcedure
    .input(
      z.object({
        id: z.number(),
        category: z.enum([
          "gas_fuel",
          "office_supplies",
          "software_subscription",
          "stripe_fees",
          "advertising",
          "professional_services",
          "equipment",
          "other",
        ]).optional(),
        notes: z.string().optional(),
        gstEligible: z.boolean().optional(),
        reviewed: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await requireAccountingAuth(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;

      const existing = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
      }

      const expense = existing[0];
      const gstEligible = updates.gstEligible ?? expense.gstEligible;

      const preTaxAmountCadCents = gstEligible
        ? Math.round(expense.amountCadCents / 1.05)
        : expense.amountCadCents;
      const gstItcCadCents = gstEligible
        ? expense.amountCadCents - preTaxAmountCadCents
        : 0;

      await db
        .update(expenses)
        .set({
          ...updates,
          preTaxAmountCadCents,
          gstItcCadCents,
        })
        .where(eq(expenses.id, id));

      return { success: true };
    }),

  /**
   * Delete an expense.
   */
  deleteExpense: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await requireAccountingAuth(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(expenses).where(eq(expenses.id, input.id));
      return { success: true };
    }),

  /**
   * List all CSV import batches.
   */
  listBatches: publicProcedure.query(async ({ ctx }) => {
    await requireAccountingAuth(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    return db
      .select()
      .from(csvImportBatches)
      .orderBy(desc(csvImportBatches.importedAt));
  }),

  /**
   * Get year-end summary (all 12 months for a given year).
   */
  getYearEndSummary: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireAccountingAuth(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const reports = await db
        .select()
        .from(monthlyReports)
        .where(
          and(
            gte(monthlyReports.period, `${input.year}-01`),
            lte(monthlyReports.period, `${input.year}-12`)
          )
        )
        .orderBy(monthlyReports.period);

      const totals = {
        grossRevenueCadCents: reports.reduce((s, r) => s + r.grossRevenueCadCents, 0),
        totalRefundsCadCents: reports.reduce((s, r) => s + r.totalRefundsCadCents, 0),
        stripeFeesTotalCadCents: reports.reduce((s, r) => s + r.stripeFeesTotalCadCents, 0),
        netRevenueCadCents: reports.reduce((s, r) => s + r.netRevenueCadCents, 0),
        gstCollectedCadCents: reports.reduce((s, r) => s + r.gstCollectedCadCents, 0),
        totalExpensesCadCents: reports.reduce((s, r) => s + r.totalExpensesCadCents, 0),
        totalGstItcCadCents: reports.reduce((s, r) => s + r.totalGstItcCadCents, 0),
        netGstRemittableCadCents: reports.reduce((s, r) => s + r.netGstRemittableCadCents, 0),
        netProfitCadCents: reports.reduce((s, r) => s + r.netProfitCadCents, 0),
      };

      return { year: input.year, months: reports, totals };
    }),
});
