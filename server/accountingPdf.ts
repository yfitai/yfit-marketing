/**
 * Monthly P&L / GST Accounting PDF Generator
 *
 * Generates a Manitoba-specific monthly P&L report with:
 * - Income section (Stripe gross revenue, refunds, Stripe fees, net revenue)
 * - Expense section (categorized by type with GST ITC details)
 * - GST Remittance Summary (GST collected vs ITCs = net remittance owing)
 * - Net profit/loss
 *
 * Also generates an annual year-end statement for the accountant.
 */

import PDFDocument from "pdfkit";
import type { Expense, StripeIncome, MonthlyReport } from "../drizzle/schema";

// ─── Formatting helpers ───────────────────────────────────────────────────────

function cad(cents: number): string {
  const dollars = cents / 100;
  const sign = dollars < 0 ? "-" : "";
  return `${sign}$${Math.abs(dollars).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

const CATEGORY_LABELS: Record<string, string> = {
  gas_fuel: "Gas & Fuel",
  office_supplies: "Office Supplies",
  software_subscription: "Software Subscriptions",
  stripe_fees: "Stripe Processing Fees",
  advertising: "Advertising",
  professional_services: "Professional Services",
  equipment: "Equipment",
  other: "Other / Uncategorized",
};

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ─── PDF Layout constants ─────────────────────────────────────────────────────

const MARGIN = 50;
const PAGE_WIDTH = 612; // Letter
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COL_LABEL = MARGIN;
const COL_VALUE = PAGE_WIDTH - MARGIN - 120;
const COL_VALUE2 = PAGE_WIDTH - MARGIN - 60;

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawHRule(doc: PDFKit.PDFDocument, y: number, color = "#CCCCCC") {
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor(color).lineWidth(0.5).stroke();
}

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.rect(MARGIN, y, CONTENT_WIDTH, 22).fill("#1B4F72");
  doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold")
    .text(title, MARGIN + 8, y + 6, { width: CONTENT_WIDTH - 16 });
  doc.fillColor("#000000");
  return y + 30;
}

function drawRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  y: number,
  options: { bold?: boolean; indent?: number; color?: string; bgColor?: string } = {}
): number {
  const { bold = false, indent = 0, color = "#000000", bgColor } = options;

  if (bgColor) {
    doc.rect(MARGIN, y, CONTENT_WIDTH, 18).fill(bgColor);
  }

  const font = bold ? "Helvetica-Bold" : "Helvetica";
  doc.font(font).fontSize(9).fillColor(color);
  doc.text(label, COL_LABEL + indent, y + 4, { width: COL_VALUE - COL_LABEL - indent - 10 });
  doc.text(value, COL_VALUE, y + 4, { width: 120, align: "right" });
  doc.fillColor("#000000").font("Helvetica");
  return y + 18;
}

function drawTwoColRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value1: string,
  value2: string,
  y: number,
  options: { bold?: boolean; bgColor?: string } = {}
): number {
  const { bold = false, bgColor } = options;
  if (bgColor) {
    doc.rect(MARGIN, y, CONTENT_WIDTH, 18).fill(bgColor);
  }
  const font = bold ? "Helvetica-Bold" : "Helvetica";
  doc.font(font).fontSize(9).fillColor("#000000");
  doc.text(label, COL_LABEL, y + 4, { width: COL_VALUE2 - COL_LABEL - 130 });
  doc.text(value1, COL_VALUE2 - 120, y + 4, { width: 120, align: "right" });
  doc.text(value2, COL_VALUE2, y + 4, { width: 120, align: "right" });
  doc.font("Helvetica");
  return y + 18;
}

function checkPageBreak(doc: PDFKit.PDFDocument, y: number, needed = 60): number {
  if (y + needed > doc.page.height - MARGIN) {
    doc.addPage();
    return MARGIN + 20;
  }
  return y;
}

// ─── Main PDF generators ──────────────────────────────────────────────────────

export interface MonthlyReportData {
  year: number;
  month: number;
  grossRevenueCadCents: number;
  totalRefundsCadCents: number;
  stripeFeesTotalCadCents: number;
  netRevenueCadCents: number;
  gstCollectedCadCents: number;
  totalExpensesCadCents: number;
  totalGstItcCadCents: number;
  netGstRemittableCadCents: number;
  netProfitCadCents: number;
  expensesByCategory: Record<string, { totalCadCents: number; gstItcCadCents: number; count: number }>;
  incomeRows: StripeIncome[];
  expenseRows: Expense[];
}

/**
 * Generate a monthly P&L / GST report PDF.
 */
export async function generateMonthlyReport(data: MonthlyReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const monthName = MONTH_NAMES[data.month];
    const periodLabel = `${monthName} ${data.year}`;
    const generatedDate = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });

    // ── Cover / Header ────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_WIDTH, 90).fill("#1B4F72");
    doc.fillColor("#FFFFFF").fontSize(22).font("Helvetica-Bold")
      .text("YFIT AI", MARGIN, 20);
    doc.fontSize(13).font("Helvetica")
      .text(`Monthly Financial Report — ${periodLabel}`, MARGIN, 46);
    doc.fontSize(9)
      .text(`Manitoba, Canada  |  GST Registration Required  |  Generated: ${generatedDate}`, MARGIN, 66);
    doc.fillColor("#000000");

    let y = 110;

    // ── INCOME SECTION ────────────────────────────────────────────────────────
    y = drawSectionHeader(doc, "INCOME (Stripe Revenue)", y);

    y = drawRow(doc, "Gross Revenue (USD → CAD)", cad(data.grossRevenueCadCents), y);
    y = drawRow(doc, "  Less: Refunds", `(${cad(data.totalRefundsCadCents)})`, y, { indent: 8 });
    y = drawRow(doc, "  Less: Stripe Processing Fees (2.9% + $0.30)", `(${cad(data.stripeFeesTotalCadCents)})`, y, { indent: 8 });
    drawHRule(doc, y);
    y += 4;
    y = drawRow(doc, "Net Revenue", cad(data.netRevenueCadCents), y, { bold: true, bgColor: "#EBF5FB" });
    y += 6;

    // GST collected note
    if (data.gstCollectedCadCents > 0) {
      y = drawRow(doc, "GST Collected from Canadian Customers (5%)", cad(data.gstCollectedCadCents), y, { color: "#1A5276" });
    } else {
      doc.font("Helvetica").fontSize(8).fillColor("#666666")
        .text("Note: GST collected = $0.00. Enable Stripe Tax to automatically collect 5% GST from Canadian customers.", MARGIN, y + 2, { width: CONTENT_WIDTH });
      y += 22;
      doc.fillColor("#000000");
    }

    y += 10;
    y = checkPageBreak(doc, y);

    // ── EXPENSES SECTION ──────────────────────────────────────────────────────
    y = drawSectionHeader(doc, "EXPENSES (CIBC Mastercard)", y);

    if (Object.keys(data.expensesByCategory).length === 0) {
      doc.font("Helvetica").fontSize(9).fillColor("#666666")
        .text("No expenses imported for this period. Upload your CIBC CSV statement in the accounting dashboard.", MARGIN, y + 4, { width: CONTENT_WIDTH });
      y += 24;
      doc.fillColor("#000000");
    } else {
      // Header row
      y = drawTwoColRow(doc, "Category", "Amount (incl. GST)", "GST ITC (5%)", y, { bold: true, bgColor: "#D6EAF8" });
      drawHRule(doc, y);
      y += 2;

      let rowBg = false;
      for (const [cat, vals] of Object.entries(data.expensesByCategory)) {
        y = checkPageBreak(doc, y, 20);
        const label = `${CATEGORY_LABELS[cat] ?? cat} (${vals.count} transaction${vals.count !== 1 ? "s" : ""})`;
        y = drawTwoColRow(doc, label, cad(vals.totalCadCents), cad(vals.gstItcCadCents), y, {
          bgColor: rowBg ? "#F8F9FA" : undefined,
        });
        rowBg = !rowBg;
      }

      drawHRule(doc, y);
      y += 4;
      y = drawTwoColRow(doc, "Total Expenses", cad(data.totalExpensesCadCents), cad(data.totalGstItcCadCents), y, {
        bold: true,
        bgColor: "#EBF5FB",
      });
    }

    y += 10;
    y = checkPageBreak(doc, y);

    // ── GST REMITTANCE SECTION ────────────────────────────────────────────────
    y = drawSectionHeader(doc, "GST REMITTANCE SUMMARY (5% Federal GST — Manitoba)", y);

    y = drawRow(doc, "GST Collected on Sales", cad(data.gstCollectedCadCents), y);
    y = drawRow(doc, "  Less: Input Tax Credits (ITCs) on Expenses", `(${cad(data.totalGstItcCadCents)})`, y, { indent: 8 });
    drawHRule(doc, y);
    y += 4;

    const gstColor = data.netGstRemittableCadCents > 0 ? "#922B21" : "#1A5276";
    const gstLabel = data.netGstRemittableCadCents > 0
      ? "Net GST Owing to CRA"
      : "Net GST Refund from CRA";
    y = drawRow(doc, gstLabel, cad(Math.abs(data.netGstRemittableCadCents)), y, {
      bold: true,
      bgColor: data.netGstRemittableCadCents > 0 ? "#FADBD8" : "#D5F5E3",
      color: gstColor,
    });

    y += 4;
    doc.font("Helvetica").fontSize(8).fillColor("#666666")
      .text(
        "Manitoba businesses registered for GST remit quarterly or annually to the CRA. " +
        "Consult your accountant to confirm your reporting period and filing deadlines.",
        MARGIN, y, { width: CONTENT_WIDTH }
      );
    y += 22;
    doc.fillColor("#000000");

    y = checkPageBreak(doc, y);

    // ── NET PROFIT / LOSS ─────────────────────────────────────────────────────
    y = drawSectionHeader(doc, "NET PROFIT / LOSS", y);

    y = drawRow(doc, "Net Revenue", cad(data.netRevenueCadCents), y);
    y = drawRow(doc, "  Less: Total Expenses", `(${cad(data.totalExpensesCadCents)})`, y, { indent: 8 });
    drawHRule(doc, y);
    y += 4;

    const profitColor = data.netProfitCadCents >= 0 ? "#1A5276" : "#922B21";
    const profitLabel = data.netProfitCadCents >= 0 ? "Net Profit" : "Net Loss";
    y = drawRow(doc, profitLabel, cad(data.netProfitCadCents), y, {
      bold: true,
      bgColor: data.netProfitCadCents >= 0 ? "#D5F5E3" : "#FADBD8",
      color: profitColor,
    });

    y += 20;

    // ── TRANSACTION DETAIL (Income) ───────────────────────────────────────────
    if (data.incomeRows.length > 0) {
      y = checkPageBreak(doc, y, 60);
      y = drawSectionHeader(doc, `STRIPE TRANSACTION DETAIL (${data.incomeRows.length} charges)`, y);

      // Header
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#FFFFFF");
      doc.rect(MARGIN, y, CONTENT_WIDTH, 16).fill("#2E86C1");
      doc.text("Date", MARGIN + 4, y + 4, { width: 80 });
      doc.text("Description", MARGIN + 90, y + 4, { width: 200 });
      doc.text("USD", MARGIN + 300, y + 4, { width: 70, align: "right" });
      doc.text("CAD", MARGIN + 380, y + 4, { width: 70, align: "right" });
      doc.text("Status", MARGIN + 460, y + 4, { width: 60, align: "right" });
      doc.fillColor("#000000").font("Helvetica");
      y += 18;

      let rowBg = false;
      for (const row of data.incomeRows.slice(0, 50)) { // limit to 50 rows
        y = checkPageBreak(doc, y, 16);
        if (rowBg) doc.rect(MARGIN, y, CONTENT_WIDTH, 14).fill("#F8F9FA");
        doc.font("Helvetica").fontSize(7.5).fillColor("#000000");
        const dateStr = new Date(row.chargedAt).toLocaleDateString("en-CA");
        doc.text(dateStr, MARGIN + 4, y + 3, { width: 80 });
        doc.text((row.description ?? row.customerEmail ?? "—").slice(0, 40), MARGIN + 90, y + 3, { width: 200 });
        doc.text(`$${(row.amountUsdCents / 100).toFixed(2)}`, MARGIN + 300, y + 3, { width: 70, align: "right" });
        doc.text(cad(row.amountCadCents), MARGIN + 380, y + 3, { width: 70, align: "right" });
        doc.text(row.status, MARGIN + 460, y + 3, { width: 60, align: "right" });
        y += 14;
        rowBg = !rowBg;
      }

      if (data.incomeRows.length > 50) {
        y += 4;
        doc.font("Helvetica").fontSize(8).fillColor("#666666")
          .text(`... and ${data.incomeRows.length - 50} more transactions (see full export)`, MARGIN, y);
        y += 14;
        doc.fillColor("#000000");
      }
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const totalPages = (doc as any).bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - 30;
      drawHRule(doc, footerY - 4);
      doc.font("Helvetica").fontSize(7.5).fillColor("#666666")
        .text(
          `YFIT AI — Confidential Financial Report — ${periodLabel}  |  Page ${i + 1} of ${totalPages}`,
          MARGIN, footerY, { width: CONTENT_WIDTH, align: "center" }
        );
    }

    doc.end();
  });
}

/**
 * Generate a year-end annual statement PDF for the accountant.
 */
export async function generateYearEndStatement(
  year: number,
  months: MonthlyReport[],
  totals: {
    grossRevenueCadCents: number;
    totalRefundsCadCents: number;
    stripeFeesTotalCadCents: number;
    netRevenueCadCents: number;
    gstCollectedCadCents: number;
    totalExpensesCadCents: number;
    totalGstItcCadCents: number;
    netGstRemittableCadCents: number;
    netProfitCadCents: number;
  }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const generatedDate = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });

    // ── Cover ─────────────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_WIDTH, 100).fill("#1B4F72");
    doc.fillColor("#FFFFFF").fontSize(24).font("Helvetica-Bold")
      .text("YFIT AI", MARGIN, 18);
    doc.fontSize(15).font("Helvetica")
      .text(`Annual Financial Statement — ${year}`, MARGIN, 48);
    doc.fontSize(9)
      .text(`Manitoba, Canada  |  Fiscal Year: January 1 – December 31, ${year}  |  Prepared: ${generatedDate}`, MARGIN, 72);
    doc.fillColor("#000000");

    let y = 120;

    // ── Annual Summary ────────────────────────────────────────────────────────
    y = drawSectionHeader(doc, `ANNUAL SUMMARY — ${year}`, y);

    y = drawRow(doc, "Gross Revenue", cad(totals.grossRevenueCadCents), y);
    y = drawRow(doc, "  Less: Refunds", `(${cad(totals.totalRefundsCadCents)})`, y, { indent: 8 });
    y = drawRow(doc, "  Less: Stripe Processing Fees", `(${cad(totals.stripeFeesTotalCadCents)})`, y, { indent: 8 });
    drawHRule(doc, y);
    y += 4;
    y = drawRow(doc, "Net Revenue", cad(totals.netRevenueCadCents), y, { bold: true, bgColor: "#EBF5FB" });
    y += 6;
    y = drawRow(doc, "Total Expenses", `(${cad(totals.totalExpensesCadCents)})`, y);
    drawHRule(doc, y);
    y += 4;
    const profitColor = totals.netProfitCadCents >= 0 ? "#1A5276" : "#922B21";
    y = drawRow(doc, totals.netProfitCadCents >= 0 ? "Net Profit" : "Net Loss", cad(totals.netProfitCadCents), y, {
      bold: true,
      bgColor: totals.netProfitCadCents >= 0 ? "#D5F5E3" : "#FADBD8",
      color: profitColor,
    });

    y += 16;

    // ── GST Annual Summary ────────────────────────────────────────────────────
    y = drawSectionHeader(doc, "ANNUAL GST REMITTANCE SUMMARY", y);

    y = drawRow(doc, "Total GST Collected", cad(totals.gstCollectedCadCents), y);
    y = drawRow(doc, "Total Input Tax Credits (ITCs)", `(${cad(totals.totalGstItcCadCents)})`, y, { indent: 8 });
    drawHRule(doc, y);
    y += 4;
    const gstColor = totals.netGstRemittableCadCents > 0 ? "#922B21" : "#1A5276";
    y = drawRow(
      doc,
      totals.netGstRemittableCadCents > 0 ? "Net GST Owing to CRA" : "Net GST Refund from CRA",
      cad(Math.abs(totals.netGstRemittableCadCents)),
      y,
      { bold: true, bgColor: totals.netGstRemittableCadCents > 0 ? "#FADBD8" : "#D5F5E3", color: gstColor }
    );

    y += 16;

    // ── Monthly Breakdown ─────────────────────────────────────────────────────
    y = checkPageBreak(doc, y, 60);
    y = drawSectionHeader(doc, "MONTHLY BREAKDOWN", y);

    // Header
    doc.rect(MARGIN, y, CONTENT_WIDTH, 16).fill("#2E86C1");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#FFFFFF");
    const colW = CONTENT_WIDTH / 6;
    const cols = ["Month", "Gross Revenue", "Net Revenue", "Expenses", "GST Owing", "Net Profit"];
    cols.forEach((col, i) => {
      doc.text(col, MARGIN + i * colW + 4, y + 4, { width: colW - 8, align: i === 0 ? "left" : "right" });
    });
    doc.fillColor("#000000").font("Helvetica");
    y += 18;

    let rowBg = false;
    for (const m of months) {
      y = checkPageBreak(doc, y, 16);
      const [, mNum] = m.period.split("-");
      const mName = MONTH_NAMES[parseInt(mNum)] ?? m.period;
      if (rowBg) doc.rect(MARGIN, y, CONTENT_WIDTH, 14).fill("#F8F9FA");
      doc.font("Helvetica").fontSize(8).fillColor("#000000");
      const vals = [
        mName,
        cad(m.grossRevenueCadCents),
        cad(m.netRevenueCadCents),
        cad(m.totalExpensesCadCents),
        cad(m.netGstRemittableCadCents),
        cad(m.netProfitCadCents),
      ];
      vals.forEach((val, i) => {
        doc.text(val, MARGIN + i * colW + 4, y + 3, { width: colW - 8, align: i === 0 ? "left" : "right" });
      });
      y += 14;
      rowBg = !rowBg;
    }

    // Totals row
    drawHRule(doc, y);
    y += 4;
    doc.rect(MARGIN, y, CONTENT_WIDTH, 16).fill("#EBF5FB");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#000000");
    const totalVals = [
      "TOTAL",
      cad(totals.grossRevenueCadCents),
      cad(totals.netRevenueCadCents),
      cad(totals.totalExpensesCadCents),
      cad(totals.netGstRemittableCadCents),
      cad(totals.netProfitCadCents),
    ];
    totalVals.forEach((val, i) => {
      doc.text(val, MARGIN + i * colW + 4, y + 4, { width: colW - 8, align: i === 0 ? "left" : "right" });
    });
    y += 20;

    // ── Accountant Notes ──────────────────────────────────────────────────────
    y = checkPageBreak(doc, y, 80);
    y = drawSectionHeader(doc, "NOTES FOR ACCOUNTANT", y);

    const notes = [
      `Business: YFIT AI — AI-Powered Fitness & Nutrition Application`,
      `Province: Manitoba, Canada`,
      `Fiscal Year: January 1 – December 31, ${year}`,
      `Revenue Source: Stripe payment processing (USD, converted to CAD using Bank of Canada rates)`,
      `Expense Source: CIBC Mastercard business credit card statements (CSV import)`,
      `GST Rate Applied: 5% federal GST (Manitoba — no PST on digital services)`,
      `GST on Revenue: Currently $0 (Stripe Tax not yet enabled — see GST section)`,
      `GST ITCs: Calculated as 5/105 of each GST-eligible expense`,
      `Exchange Rate: USD/CAD rates sourced from Bank of Canada Valet API at time of sync`,
    ];

    for (const note of notes) {
      y = checkPageBreak(doc, y, 16);
      doc.font("Helvetica").fontSize(8.5).fillColor("#333333")
        .text(`• ${note}`, MARGIN + 8, y, { width: CONTENT_WIDTH - 16 });
      y += 14;
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const totalPages = (doc as any).bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - 30;
      drawHRule(doc, footerY - 4);
      doc.font("Helvetica").fontSize(7.5).fillColor("#666666")
        .text(
          `YFIT AI — Confidential Annual Statement ${year}  |  Page ${i + 1} of ${totalPages}`,
          MARGIN, footerY, { width: CONTENT_WIDTH, align: "center" }
        );
    }

    doc.end();
  });
}
