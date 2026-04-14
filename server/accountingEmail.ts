/**
 * Accounting Report Email Delivery
 *
 * Sends the monthly P&L / GST report PDF to support@yfitai.com via Resend.
 * Also handles year-end statement delivery.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = "reports@yfitai.com";
const TO_EMAIL = "support@yfitai.com";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function cad(cents: number): string {
  const dollars = cents / 100;
  const sign = dollars < 0 ? "-" : "";
  return `${sign}$${Math.abs(dollars).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export interface AccountingEmailSummary {
  grossRevenueCadCents: number;
  netRevenueCadCents: number;
  totalExpensesCadCents: number;
  netProfitCadCents: number;
  gstCollectedCadCents: number;
  totalGstItcCadCents: number;
  netGstRemittableCadCents: number;
}

/**
 * Send the monthly P&L report PDF via email.
 */
export async function sendMonthlyReport(
  pdfBuffer: Buffer,
  year: number,
  month: number,
  summary: AccountingEmailSummary
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const monthName = MONTH_NAMES[month];
  const period = `${monthName} ${year}`;
  const fileName = `YFIT-AI-Monthly-Report-${year}-${String(month).padStart(2, "0")}.pdf`;

  const profitLabel = summary.netProfitCadCents >= 0 ? "Net Profit" : "Net Loss";
  const gstLabel = summary.netGstRemittableCadCents > 0 ? "GST Owing to CRA" : "GST Refund from CRA";

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #1B4F72; color: white; padding: 28px 32px; }
    .header h1 { margin: 0 0 4px; font-size: 22px; }
    .header p { margin: 0; opacity: 0.85; font-size: 13px; }
    .body { padding: 28px 32px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
    .summary-card { background: #f8f9fa; border-radius: 8px; padding: 14px 16px; border-left: 4px solid #2E86C1; }
    .summary-card.profit { border-left-color: #27AE60; }
    .summary-card.loss { border-left-color: #E74C3C; }
    .summary-card.gst-owing { border-left-color: #E74C3C; }
    .summary-card.gst-refund { border-left-color: #27AE60; }
    .summary-card .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .summary-card .value { font-size: 20px; font-weight: 700; color: #1B4F72; }
    .summary-card.profit .value { color: #27AE60; }
    .summary-card.loss .value { color: #E74C3C; }
    .summary-card.gst-owing .value { color: #E74C3C; }
    .summary-card.gst-refund .value { color: #27AE60; }
    .divider { border: none; border-top: 1px solid #eee; margin: 20px 0; }
    .note { background: #FEF9E7; border: 1px solid #F9E79F; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #7D6608; margin: 16px 0; }
    .footer { background: #f5f5f5; padding: 16px 32px; font-size: 11px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>YFIT AI — Monthly Financial Report</h1>
      <p>${period} &nbsp;|&nbsp; Manitoba, Canada</p>
    </div>
    <div class="body">
      <p>Your monthly P&amp;L and GST remittance report for <strong>${period}</strong> is attached.</p>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">Gross Revenue</div>
          <div class="value">${cad(summary.grossRevenueCadCents)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Net Revenue</div>
          <div class="value">${cad(summary.netRevenueCadCents)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Total Expenses</div>
          <div class="value">${cad(summary.totalExpensesCadCents)}</div>
        </div>
        <div class="summary-card ${summary.netProfitCadCents >= 0 ? "profit" : "loss"}">
          <div class="label">${profitLabel}</div>
          <div class="value">${cad(summary.netProfitCadCents)}</div>
        </div>
        <div class="summary-card">
          <div class="label">GST Collected</div>
          <div class="value">${cad(summary.gstCollectedCadCents)}</div>
        </div>
        <div class="summary-card ${summary.netGstRemittableCadCents > 0 ? "gst-owing" : "gst-refund"}">
          <div class="label">${gstLabel}</div>
          <div class="value">${cad(Math.abs(summary.netGstRemittableCadCents))}</div>
        </div>
      </div>

      ${summary.gstCollectedCadCents === 0 ? `
      <div class="note">
        <strong>GST Reminder:</strong> No GST was collected this month. If your annual revenue exceeds $30,000 CAD,
        you are required to register for GST and collect 5% from Canadian customers.
        Consider enabling Stripe Tax to automate this.
      </div>
      ` : ""}

      <hr class="divider">
      <p style="font-size: 13px; color: #555;">
        The full PDF report with transaction details and expense breakdown is attached.
        Please review any expenses flagged for manual review in the accounting dashboard.
      </p>
    </div>
    <div class="footer">
      YFIT AI &nbsp;•&nbsp; Automated Monthly Report &nbsp;•&nbsp; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: `YFIT AI — Monthly Report: ${period}`,
        html: htmlBody,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer.toString("base64"),
          },
        ],
      }),
    });

    const result = await response.json() as { id?: string; name?: string; message?: string };

    if (!response.ok) {
      console.error("[AccountingEmail] Resend error:", result);
      return { success: false, error: result.message ?? "Email delivery failed" };
    }

    console.log(`[AccountingEmail] Monthly report sent for ${period}. Message ID: ${result.id}`);
    return { success: true, messageId: result.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AccountingEmail] Failed to send:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Send the year-end annual statement PDF via email.
 */
export async function sendYearEndStatement(
  pdfBuffer: Buffer,
  year: number,
  totals: AccountingEmailSummary
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const fileName = `YFIT-AI-Annual-Statement-${year}.pdf`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: #1B4F72; color: white; padding: 28px 32px; }
    .header h1 { margin: 0 0 4px; font-size: 22px; }
    .header p { margin: 0; opacity: 0.85; font-size: 13px; }
    .body { padding: 28px 32px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #2E86C1; color: white; padding: 8px 12px; font-size: 12px; text-align: left; }
    td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
    tr:last-child td { font-weight: bold; background: #EBF5FB; }
    .footer { background: #f5f5f5; padding: 16px 32px; font-size: 11px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>YFIT AI — Annual Financial Statement</h1>
      <p>Fiscal Year ${year} &nbsp;|&nbsp; Manitoba, Canada &nbsp;|&nbsp; For Your Accountant</p>
    </div>
    <div class="body">
      <p>Your annual financial statement for <strong>${year}</strong> is attached. Please forward this to your accountant for tax preparation.</p>

      <table>
        <tr><th>Summary</th><th>Amount (CAD)</th></tr>
        <tr><td>Gross Revenue</td><td>${cad(totals.grossRevenueCadCents)}</td></tr>
        <tr><td>Net Revenue (after refunds &amp; Stripe fees)</td><td>${cad(totals.netRevenueCadCents)}</td></tr>
        <tr><td>Total Expenses</td><td>${cad(totals.totalExpensesCadCents)}</td></tr>
        <tr><td>GST Collected</td><td>${cad(totals.gstCollectedCadCents)}</td></tr>
        <tr><td>Total GST ITCs</td><td>${cad(totals.totalGstItcCadCents)}</td></tr>
        <tr><td>Net GST ${totals.netGstRemittableCadCents > 0 ? "Owing" : "Refund"}</td><td>${cad(Math.abs(totals.netGstRemittableCadCents))}</td></tr>
        <tr><td>${totals.netProfitCadCents >= 0 ? "Net Profit" : "Net Loss"}</td><td>${cad(totals.netProfitCadCents)}</td></tr>
      </table>

      <p style="font-size: 13px; color: #555;">
        The full annual statement with monthly breakdown and accountant notes is attached as a PDF.
      </p>
    </div>
    <div class="footer">
      YFIT AI &nbsp;•&nbsp; Automated Year-End Statement &nbsp;•&nbsp; ${year}
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: `YFIT AI — Annual Statement ${year} (For Accountant)`,
        html: htmlBody,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer.toString("base64"),
          },
        ],
      }),
    });

    const result = await response.json() as { id?: string; name?: string; message?: string };

    if (!response.ok) {
      console.error("[AccountingEmail] Year-end Resend error:", result);
      return { success: false, error: result.message ?? "Email delivery failed" };
    }

    console.log(`[AccountingEmail] Year-end statement sent for ${year}. Message ID: ${result.id}`);
    return { success: true, messageId: result.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AccountingEmail] Failed to send year-end:", msg);
    return { success: false, error: msg };
  }
}
