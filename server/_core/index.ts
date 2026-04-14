import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStripeRoutes } from "../stripe";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Stripe payment routes
  registerStripeRoutes(app);

  // ── Accounting REST endpoints (called by n8n workflows) ────────────────────
  // POST /api/send-monthly-report — generates PDF and emails monthly P&L
  app.post("/api/send-monthly-report", async (req, res) => {
    try {
      const now = new Date();
      const year = req.body?.year ?? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
      const month = req.body?.month ?? (now.getMonth() === 0 ? 12 : now.getMonth());

      const { syncStripeIncomeForMonth, getStripeIncomeForMonth } = await import("../stripeSync");
      const { getExpensesForMonth } = await import("../csvImporter");
      const { generateMonthlyReport } = await import("../accountingPdf");
      const { sendMonthlyReport } = await import("../accountingEmail");
      const { getDb } = await import("../db");
      const { monthlyReports } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Sync Stripe income first
      await syncStripeIncomeForMonth(year, month);

      // Gather data
      const income = await getStripeIncomeForMonth(year, month);
      const expenseData = await getExpensesForMonth(year, month);

      const netGstRemittableCadCents = income.gstCollectedCadCents - expenseData.totalGstItcCadCents;
      const netProfitCadCents = income.netRevenueCadCents - expenseData.totalExpensesCadCents;

      const reportData = {
        year,
        month,
        grossRevenueCadCents: income.grossRevenueCadCents,
        totalRefundsCadCents: income.totalRefundsCadCents,
        stripeFeesTotalCadCents: income.stripeFeesTotalCadCents,
        netRevenueCadCents: income.netRevenueCadCents,
        gstCollectedCadCents: income.gstCollectedCadCents,
        totalExpensesCadCents: expenseData.totalExpensesCadCents,
        totalGstItcCadCents: expenseData.totalGstItcCadCents,
        netGstRemittableCadCents,
        netProfitCadCents,
        expensesByCategory: expenseData.byCategory,
        incomeRows: income.rows,
        expenseRows: expenseData.rows,
      };

      // Generate PDF
      const pdfBuffer = await generateMonthlyReport(reportData);

      // Send email
      const emailResult = await sendMonthlyReport(pdfBuffer, year, month, reportData);

      // Upsert monthly report record
      const db = await getDb();
      if (db) {
        const period = `${year}-${String(month).padStart(2, "0")}`;
        const existing = await db.select({ id: monthlyReports.id }).from(monthlyReports).where(eq(monthlyReports.period, period)).limit(1);
        const dbData = {
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
        if (existing.length > 0) {
          await db.update(monthlyReports).set(dbData).where(eq(monthlyReports.period, period));
        } else {
          await db.insert(monthlyReports).values(dbData);
        }
      }

      res.json({ success: true, year, month, emailSent: emailResult.success, messageId: emailResult.messageId });
    } catch (err) {
      console.error("[/api/send-monthly-report]", err);
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // POST /api/send-year-end-report — generates annual statement PDF and emails it
  app.post("/api/send-year-end-report", async (req, res) => {
    try {
      const year = req.body?.year ?? new Date().getFullYear() - 1;

      const { getDb } = await import("../db");
      const { monthlyReports } = await import("../../drizzle/schema");
      const { and, gte, lte } = await import("drizzle-orm");
      const { generateYearEndStatement } = await import("../accountingPdf");
      const { sendYearEndStatement } = await import("../accountingEmail");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const reports = await db
        .select()
        .from(monthlyReports)
        .where(
          and(
            gte(monthlyReports.period, `${year}-01`),
            lte(monthlyReports.period, `${year}-12`)
          )
        );

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

      const pdfBuffer = await generateYearEndStatement(year, reports, totals);
      const emailResult = await sendYearEndStatement(pdfBuffer, year, totals);

      res.json({ success: true, year, emailSent: emailResult.success, messageId: emailResult.messageId });
    } catch (err) {
      console.error("[/api/send-year-end-report]", err);
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
