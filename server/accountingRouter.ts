/**
 * Accounting tRPC Router
 *
 * Provides procedures for the monthly P&L / GST accounting system.
 * Handles CSV uploads, expense management, and report generation.
 * All procedures are protected — only the owner/admin can access them.
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { expenses, csvImportBatches, monthlyReports, stripeIncome } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { importCibcCsv, getExpensesForMonth } from "./csvImporter";
import { syncStripeIncomeForMonth, getStripeIncomeForMonth } from "./stripeSync";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireOwner(ctx: { user: { role: string } | null }) {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
}

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

  // Upsert the monthly report
  const existing = await db
    .select({ id: monthlyReports.id })
    .from(monthlyReports)
    .where(eq(monthlyReports.period, period))
    .limit(1);

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
   * Upload and import a CIBC CSV file.
   * Accepts base64-encoded CSV content.
   */
  uploadCsv: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        csvContent: z.string(), // raw CSV text
        statementMonth: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireOwner(ctx);
      const result = await importCibcCsv(input.csvContent, input.fileName, input.statementMonth);
      return result;
    }),

  /**
   * Sync Stripe income for a given month.
   */
  syncStripe: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
    .mutation(async ({ input, ctx }) => {
      requireOwner(ctx);
      return syncStripeIncomeForMonth(input.year, input.month);
    }),

  /**
   * Get the full monthly report data (income + expenses + GST summary).
   */
  getMonthlyReport: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
    .query(async ({ input, ctx }) => {
      requireOwner(ctx);
      return computeMonthlyReport(input.year, input.month);
    }),

  /**
   * List all monthly reports (for the dashboard overview).
   */
  listReports: protectedProcedure.query(async ({ ctx }) => {
    requireOwner(ctx);
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
  listExpenses: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
    .query(async ({ input, ctx }) => {
      requireOwner(ctx);
      return getExpensesForMonth(input.year, input.month);
    }),

  /**
   * Update an expense (category, notes, gstEligible, reviewed).
   */
  updateExpense: protectedProcedure
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
      requireOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;

      // Recalculate GST ITC if gstEligible changes
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
  deleteExpense: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      requireOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(expenses).where(eq(expenses.id, input.id));
      return { success: true };
    }),

  /**
   * List all CSV import batches.
   */
  listBatches: protectedProcedure.query(async ({ ctx }) => {
    requireOwner(ctx);
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
  getYearEndSummary: protectedProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input, ctx }) => {
      requireOwner(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const yearPrefix = `${input.year}-`;
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
