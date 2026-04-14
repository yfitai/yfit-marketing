/**
 * CIBC Mastercard CSV Importer
 *
 * Parses CIBC credit card statement CSV files and imports expenses into the database.
 * Auto-categorizes transactions based on merchant name keywords.
 * Calculates 5% GST Input Tax Credits (ITCs) on all eligible business expenses.
 *
 * CIBC CSV Format (standard export):
 *   Date,Description,Debit,Credit
 *   2025-03-01,"TIM HORTONS #1234",5.25,
 *   2025-03-02,"SHELL #5678",85.00,
 *   2025-03-15,"PAYMENT - THANK YOU",,500.00
 */

import { getDb } from "./db";
import { expenses, csvImportBatches, type ExpenseCategory } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const GST_RATE = 0.05; // 5% federal GST (Manitoba)

// ─── Auto-categorization rules ────────────────────────────────────────────────
// Each entry: [keyword patterns (lowercase), category, gstEligible]
const CATEGORIZATION_RULES: Array<{
  patterns: string[];
  category: ExpenseCategory;
  gstEligible: boolean;
}> = [
  // Gas & Fuel
  {
    patterns: ["shell", "petro", "esso", "husky", "co-op gas", "pioneer gas", "gas station", "fuel", "ultramar", "irving oil", "sunoco", "mobil", "chevron"],
    category: "gas_fuel",
    gstEligible: true,
  },
  // Office Supplies
  {
    patterns: ["staples", "office depot", "best buy", "amazon", "walmart office", "costco", "dollar store", "grand & toy"],
    category: "office_supplies",
    gstEligible: true,
  },
  // Software Subscriptions (YFIT AI business tools)
  {
    patterns: [
      "manus", "elevenlabs", "eleven labs", "upload-post", "uploadpost",
      "railway", "n8n", "openai", "anthropic", "claude", "github",
      "google workspace", "microsoft 365", "adobe", "figma", "notion",
      "slack", "zoom", "dropbox", "canva", "netlify", "vercel",
      "resend", "supabase", "cloudflare", "namecheap", "godaddy",
      "pexels", "unsplash", "shutterstock", "envato",
    ],
    category: "software_subscription",
    gstEligible: true,
  },
  // Stripe Fees (Stripe payouts / fee invoices)
  {
    patterns: ["stripe", "stripe.com"],
    category: "stripe_fees",
    gstEligible: true,
  },
  // Advertising
  {
    patterns: ["meta ads", "facebook ads", "google ads", "tiktok ads", "linkedin ads", "twitter ads", "snapchat ads", "pinterest ads"],
    category: "advertising",
    gstEligible: true,
  },
  // Professional Services
  {
    patterns: ["accountant", "bookkeeper", "legal", "lawyer", "notary", "cpa", "tax prep"],
    category: "professional_services",
    gstEligible: true,
  },
  // Equipment
  {
    patterns: ["apple store", "best buy", "memory express", "canada computers", "newegg", "dell", "hp inc", "lenovo", "logitech", "microsoft store"],
    category: "equipment",
    gstEligible: true,
  },
];

// Transactions to skip (payments, credits, transfers — not expenses)
const SKIP_PATTERNS = [
  "payment - thank you",
  "payment received",
  "online payment",
  "transfer from",
  "transfer to",
  "credit adjustment",
  "interest charge",
  "annual fee",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  date: Date;
  description: string;
  amountCadCents: number; // positive = debit (expense)
  isCredit: boolean;
  category: ExpenseCategory;
  gstEligible: boolean;
  gstItcCadCents: number;
  preTaxAmountCadCents: number;
  needsReview: boolean; // true if auto-categorization was uncertain
}

export interface ImportResult {
  batchId: string;
  imported: number;
  skipped: number;
  credits: number;
  totalAmountCadCents: number;
  transactions: ParsedTransaction[];
  errors: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categorize(description: string): { category: ExpenseCategory; gstEligible: boolean; needsReview: boolean } {
  const lower = description.toLowerCase();

  // Check skip patterns first
  for (const skip of SKIP_PATTERNS) {
    if (lower.includes(skip)) {
      return { category: "other", gstEligible: false, needsReview: false };
    }
  }

  // Check categorization rules
  for (const rule of CATEGORIZATION_RULES) {
    for (const pattern of rule.patterns) {
      if (lower.includes(pattern)) {
        return { category: rule.category, gstEligible: rule.gstEligible, needsReview: false };
      }
    }
  }

  // Default: uncategorized, needs review
  return { category: "other", gstEligible: true, needsReview: true };
}

function parseAmount(value: string): number {
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[$,\s]/g, "").trim();
  if (!cleaned || cleaned === "") return 0;
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100); // convert to cents
}

function parseDate(value: string): Date | null {
  // CIBC formats: "2025-03-01", "03/01/2025", "March 1, 2025"
  const cleaned = value.trim();

  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const d = new Date(cleaned + "T12:00:00Z");
    return isNaN(d.getTime()) ? null : d;
  }

  // MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
    const [m, d, y] = cleaned.split("/");
    const date = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), 12));
    return isNaN(date.getTime()) ? null : date;
  }

  // Try native parse as fallback
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse a CIBC CSV string into an array of transactions.
 * Handles both standard CIBC format and minor variations.
 */
export function parseCibcCsv(csvContent: string): { transactions: ParsedTransaction[]; errors: string[] } {
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim() !== "");
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  // Detect header row
  let startLine = 0;
  const firstLine = lines[0]?.toLowerCase() ?? "";
  if (firstLine.includes("date") || firstLine.includes("description") || firstLine.includes("debit")) {
    startLine = 1; // skip header
  }

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted fields)
    const fields = parseCsvLine(line);
    if (fields.length < 3) {
      errors.push(`Line ${i + 1}: insufficient columns (${fields.length})`);
      continue;
    }

    // CIBC format: Date, Description, Debit, Credit
    // Some exports: Date, Description, Amount (positive=debit, negative=credit)
    const dateStr = fields[0]?.trim() ?? "";
    const description = fields[1]?.replace(/^"|"$/g, "").trim() ?? "";
    const debitStr = fields[2]?.trim() ?? "";
    const creditStr = fields[3]?.trim() ?? "";

    const date = parseDate(dateStr);
    if (!date) {
      errors.push(`Line ${i + 1}: invalid date "${dateStr}"`);
      continue;
    }

    let amountCadCents = 0;
    let isCredit = false;

    if (creditStr && parseAmount(creditStr) > 0) {
      // This is a credit/payment — skip
      isCredit = true;
      amountCadCents = parseAmount(creditStr);
    } else if (debitStr) {
      amountCadCents = parseAmount(debitStr);
      // Handle negative amounts as credits (some CIBC formats)
      if (amountCadCents < 0) {
        isCredit = true;
        amountCadCents = Math.abs(amountCadCents);
      }
    }

    if (amountCadCents === 0) {
      errors.push(`Line ${i + 1}: zero amount, skipping`);
      continue;
    }

    // Skip credits/payments
    if (isCredit) continue;

    // Check if this is a skip pattern
    const lower = description.toLowerCase();
    const shouldSkip = SKIP_PATTERNS.some(p => lower.includes(p));
    if (shouldSkip) continue;

    const { category, gstEligible, needsReview } = categorize(description);

    // Calculate GST ITC
    // In Canada, if a business expense includes GST, the ITC = total / 1.05 * 0.05
    // We assume all amounts on the CIBC statement are GST-inclusive for eligible expenses.
    const preTaxAmountCadCents = gstEligible ? Math.round(amountCadCents / 1.05) : amountCadCents;
    const gstItcCadCents = gstEligible ? amountCadCents - preTaxAmountCadCents : 0;

    transactions.push({
      date,
      description,
      amountCadCents,
      isCredit: false,
      category,
      gstEligible,
      gstItcCadCents,
      preTaxAmountCadCents,
      needsReview,
    });
  }

  return { transactions, errors };
}

/**
 * Parse a single CSV line, handling quoted fields with commas inside.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Import parsed transactions into the database.
 * Creates a batch record for audit trail purposes.
 */
export async function importCibcCsv(
  csvContent: string,
  fileName: string,
  statementMonth: string // "2025-03"
): Promise<ImportResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { transactions, errors } = parseCibcCsv(csvContent);

  let imported = 0;
  let skipped = 0;
  let credits = 0;
  let totalAmountCadCents = 0;

  for (const tx of transactions) {
    try {
      await db.insert(expenses).values({
        transactionDate: tx.date,
        merchantName: tx.description,
        amountCadCents: tx.amountCadCents,
        gstItcCadCents: tx.gstItcCadCents,
        preTaxAmountCadCents: tx.preTaxAmountCadCents,
        category: tx.category,
        gstEligible: tx.gstEligible,
        notes: tx.needsReview ? "Auto-categorized as 'other' — please review" : null,
        importBatchId: batchId,
        reviewed: !tx.needsReview,
      });
      imported++;
      totalAmountCadCents += tx.amountCadCents;
    } catch (err) {
      errors.push(`Failed to insert "${tx.description}": ${err instanceof Error ? err.message : String(err)}`);
      skipped++;
    }
  }

  // Create batch record
  await db.insert(csvImportBatches).values({
    batchId,
    statementMonth,
    fileName,
    totalTransactions: imported,
    totalAmountCadCents,
  });

  console.log(`[CSVImport] Batch ${batchId}: imported=${imported}, skipped=${skipped}, errors=${errors.length}`);

  return {
    batchId,
    imported,
    skipped,
    credits,
    totalAmountCadCents,
    transactions,
    errors,
  };
}

/**
 * Get all expenses for a given month.
 */
export async function getExpensesForMonth(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const { gte, lte, and } = await import("drizzle-orm");

  const rows = await db
    .select()
    .from(expenses)
    .where(
      and(
        gte(expenses.transactionDate, startDate),
        lte(expenses.transactionDate, endDate)
      )
    );

  const totalExpensesCadCents = rows.reduce((s, r) => s + r.amountCadCents, 0);
  const totalGstItcCadCents = rows.reduce((s, r) => s + r.gstItcCadCents, 0);

  // Group by category
  const byCategory: Record<string, { totalCadCents: number; gstItcCadCents: number; count: number }> = {};
  for (const row of rows) {
    if (!byCategory[row.category]) {
      byCategory[row.category] = { totalCadCents: 0, gstItcCadCents: 0, count: 0 };
    }
    byCategory[row.category].totalCadCents += row.amountCadCents;
    byCategory[row.category].gstItcCadCents += row.gstItcCadCents;
    byCategory[row.category].count++;
  }

  return {
    rows,
    totalExpensesCadCents,
    totalGstItcCadCents,
    byCategory,
  };
}

/**
 * Get all import batches for a given month.
 */
export async function getImportBatchesForMonth(statementMonth: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(csvImportBatches)
    .where(eq(csvImportBatches.statementMonth, statementMonth));
}
