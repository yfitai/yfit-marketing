/**
 * YFIT AI Accounting Dashboard
 *
 * Owner-only page for managing the monthly P&L / GST accounting system.
 * Authentication: PIN-based (no Manus OAuth required).
 * Features:
 *  - Stripe income sync
 *  - CIBC CSV upload
 *  - Expense review table with category editing
 *  - Monthly report summary with GST remittance
 *  - Report generation and email delivery
 */

import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Upload,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  BarChart3,
  Calendar,
  Lock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  { value: "gas_fuel", label: "Gas & Fuel" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "software_subscription", label: "Software Subscriptions" },
  { value: "stripe_fees", label: "Stripe Processing Fees" },
  { value: "advertising", label: "Advertising" },
  { value: "professional_services", label: "Professional Services" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
] as const;

function centsToCAD(cents: number): string {
  return `$${(cents / 100).toFixed(2)} CAD`;
}

function getPreviousMonth(): { year: number; month: number } {
  const now = new Date();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return { year, month };
}

// ─── PIN Login Screen ─────────────────────────────────────────────────────────

function PinLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.accounting.login.useMutation({
    onSuccess: () => {
      setError("");
      onSuccess();
    },
    onError: (err) => {
      setError(err.message === "Incorrect PIN" ? "Incorrect PIN. Please try again." : err.message);
      setPin("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    loginMutation.mutate({ pin });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-[#1B4F72] rounded-full flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-xl">Accounting Dashboard</CardTitle>
          <CardDescription>Enter your admin PIN to access YFIT accounting</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Admin PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(""); }}
                autoFocus
                autoComplete="current-password"
              />
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {error}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#1B4F72] hover:bg-[#154060] text-white"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
              ) : (
                "Access Dashboard"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Back to YFIT
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "positive" | "negative" | "warning";
  subtitle?: string;
}) {
  const colors = {
    default: "text-blue-700 bg-blue-50 border-blue-200",
    positive: "text-green-700 bg-green-50 border-green-200",
    negative: "text-red-700 bg-red-50 border-red-200",
    warning: "text-amber-700 bg-amber-50 border-amber-200",
  };
  const iconColors = {
    default: "text-blue-500",
    positive: "text-green-500",
    negative: "text-red-500",
    warning: "text-amber-500",
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
        </div>
        <Icon className={`w-6 h-6 mt-1 ${iconColors[variant]}`} />
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function AccountingDashboard({ onLogout }: { onLogout: () => void }) {
  const prev = getPreviousMonth();
  const [selectedYear, setSelectedYear] = useState(prev.year);
  const [selectedMonth, setSelectedMonth] = useState(prev.month);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const statementMonth = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  const reportQuery = trpc.accounting.getMonthlyReport.useQuery(
    { year: selectedYear, month: selectedMonth },
    { retry: false }
  );

  const expensesQuery = trpc.accounting.listExpenses.useQuery(
    { year: selectedYear, month: selectedMonth },
    { retry: false }
  );

  const reportsListQuery = trpc.accounting.listReports.useQuery(undefined, { retry: false });

  const logoutMutation = trpc.accounting.logout.useMutation({
    onSuccess: () => onLogout(),
  });

  const syncStripeMutation = trpc.accounting.syncStripe.useMutation({
    onSuccess: (data) => {
      toast.success(`Stripe sync complete: ${data.synced} new transactions, ${data.skipped} skipped`);
      reportQuery.refetch();
      expensesQuery.refetch();
    },
    onError: (err) => toast.error(`Stripe sync failed: ${err.message}`),
  });

  const uploadCsvMutation = trpc.accounting.uploadCsv.useMutation({
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} transactions.${data.errors.length > 0 ? ` ${data.errors.length} warnings.` : ""}`);
      setCsvFile(null);
      reportQuery.refetch();
      expensesQuery.refetch();
    },
    onError: (err) => toast.error(`CSV import failed: ${err.message}`),
  });

  const updateExpenseMutation = trpc.accounting.updateExpense.useMutation({
    onSuccess: () => {
      expensesQuery.refetch();
      reportQuery.refetch();
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`),
  });

  const deleteExpenseMutation = trpc.accounting.deleteExpense.useMutation({
    onSuccess: () => {
      toast.success("Expense deleted");
      expensesQuery.refetch();
      reportQuery.refetch();
    },
    onError: (err) => toast.error(`Delete failed: ${err.message}`),
  });

  const handleCsvUpload = useCallback(async () => {
    if (!csvFile) return;
    const text = await csvFile.text();
    uploadCsvMutation.mutate({ fileName: csvFile.name, csvContent: text, statementMonth });
  }, [csvFile, statementMonth, uploadCsvMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) setCsvFile(file);
    else toast.error("Please drop a .csv file");
  }, []);

  const report = reportQuery.data;
  const expenses = expensesQuery.data;

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B4F72] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">YFIT AI — Accounting Dashboard</h1>
            <p className="text-blue-200 text-sm mt-1">Manitoba, Canada · 5% Federal GST · Fiscal Year: Jan 1 – Dec 31</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-blue-200 hover:text-white text-sm transition-colors">
              ← Back to Site
            </a>
            <Button
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/10 bg-transparent"
              onClick={() => logoutMutation.mutate()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white border-b px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">Period:</span>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-28 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-sm"
            onClick={() => syncStripeMutation.mutate({ year: selectedYear, month: selectedMonth })}
            disabled={syncStripeMutation.isPending}
          >
            {syncStripeMutation.isPending ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Sync Stripe
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <TrendingDown className="w-4 h-4 mr-1" /> Expenses
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="w-4 h-4 mr-1" /> Import CSV
            </TabsTrigger>
            <TabsTrigger value="history">
              <Calendar className="w-4 h-4 mr-1" /> History
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview">
            {reportQuery.isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : report ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SummaryCard
                    title="Gross Revenue"
                    value={centsToCAD(report.grossRevenueCadCents)}
                    icon={TrendingUp}
                    variant="positive"
                    subtitle="Stripe charges (CAD)"
                  />
                  <SummaryCard
                    title="Net Revenue"
                    value={centsToCAD(report.netRevenueCadCents)}
                    icon={DollarSign}
                    variant="positive"
                    subtitle="After refunds & fees"
                  />
                  <SummaryCard
                    title="Total Expenses"
                    value={centsToCAD(report.totalExpensesCadCents)}
                    icon={TrendingDown}
                    variant="negative"
                    subtitle="CIBC transactions"
                  />
                  <SummaryCard
                    title="Net Profit"
                    value={centsToCAD(report.netProfitCadCents)}
                    icon={BarChart3}
                    variant={report.netProfitCadCents >= 0 ? "positive" : "negative"}
                    subtitle="Revenue minus expenses"
                  />
                </div>

                {/* GST Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">GST Remittance Summary</CardTitle>
                    <CardDescription>5% Federal GST — Manitoba, Canada</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium uppercase">GST Collected</p>
                        <p className="text-xl font-bold text-blue-800 mt-1">{centsToCAD(report.gstCollectedCadCents)}</p>
                        <p className="text-xs text-blue-500 mt-1">From Canadian customers</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 font-medium uppercase">GST ITCs</p>
                        <p className="text-xl font-bold text-green-800 mt-1">{centsToCAD(report.totalGstItcCadCents)}</p>
                        <p className="text-xs text-green-500 mt-1">Input tax credits</p>
                      </div>
                      <div className={`text-center p-4 rounded-lg ${report.netGstRemittableCadCents >= 0 ? "bg-amber-50" : "bg-green-50"}`}>
                        <p className={`text-xs font-medium uppercase ${report.netGstRemittableCadCents >= 0 ? "text-amber-600" : "text-green-600"}`}>
                          Net GST Owing
                        </p>
                        <p className={`text-xl font-bold mt-1 ${report.netGstRemittableCadCents >= 0 ? "text-amber-800" : "text-green-800"}`}>
                          {centsToCAD(Math.abs(report.netGstRemittableCadCents))}
                        </p>
                        <p className={`text-xs mt-1 ${report.netGstRemittableCadCents >= 0 ? "text-amber-500" : "text-green-500"}`}>
                          {report.netGstRemittableCadCents >= 0 ? "Remit to CRA" : "Refund owing"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Send Report Button */}
                <div className="flex justify-end">
                  <Button
                    className="bg-[#1B4F72] hover:bg-[#154060] text-white"
                    onClick={async () => {
                      try {
                        const resp = await fetch("/api/send-monthly-report", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ year: selectedYear, month: selectedMonth }),
                          credentials: "include",
                        });
                        if (resp.ok) toast.success("Monthly report emailed to support@yfitai.com");
                        else toast.error("Failed to send report");
                      } catch {
                        toast.error("Failed to send report");
                      }
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Email Monthly Report PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No data for this period. Sync Stripe or import a CSV to get started.</p>
              </div>
            )}
          </TabsContent>

          {/* ── Expenses Tab ── */}
          <TabsContent value="expenses">
            {expensesQuery.isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : expenses && expenses.rows.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Expenses — {monthNames[selectedMonth - 1]} {selectedYear}
                  </CardTitle>
                  <CardDescription>
                    {expenses.rows.length} transactions · Total: {centsToCAD(expenses.totalExpensesCadCents)} · GST ITCs: {centsToCAD(expenses.totalGstItcCadCents)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>GST ITC</TableHead>
                        <TableHead>Reviewed</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.rows.map((exp) => (
                        <TableRow key={exp.id}>
                          <TableCell className="text-xs text-gray-500">{exp.transactionDate instanceof Date ? exp.transactionDate.toLocaleDateString() : String(exp.transactionDate)}</TableCell>
                          <TableCell className="text-sm max-w-48 truncate">{exp.notes ?? exp.merchantName}</TableCell>
                          <TableCell className="text-sm font-medium">{centsToCAD(exp.amountCadCents)}</TableCell>
                          <TableCell>
                            <Select
                              value={exp.category}
                              onValueChange={(val) =>
                                updateExpenseMutation.mutate({ id: exp.id, category: val as typeof exp.category })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-44">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {EXPENSE_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant={exp.gstEligible ? "default" : "secondary"} className="text-xs cursor-pointer"
                              onClick={() => updateExpenseMutation.mutate({ id: exp.id, gstEligible: !exp.gstEligible })}
                            >
                              {exp.gstEligible ? `${centsToCAD(exp.gstItcCadCents)} ITC` : "No ITC"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => updateExpenseMutation.mutate({ id: exp.id, reviewed: !exp.reviewed })}
                              className="text-gray-400 hover:text-green-600 transition-colors"
                            >
                              {exp.reviewed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => {
                                if (confirm("Delete this expense?")) {
                                  deleteExpenseMutation.mutate({ id: exp.id });
                                }
                              }}
                              className="text-gray-300 hover:text-red-500 transition-colors text-xs"
                            >
                              ✕
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No expenses for this period. Import a CIBC CSV to populate expenses.</p>
              </div>
            )}
          </TabsContent>

          {/* ── Import CSV Tab ── */}
          <TabsContent value="import">
            <div className="max-w-xl mx-auto space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import CIBC Mastercard CSV</CardTitle>
                  <CardDescription>
                    Download your statement from CIBC Online Banking and upload it here.
                    Transactions are auto-categorized and GST ITCs are calculated automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drop Zone */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("csv-file-input")?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    {csvFile ? (
                      <p className="text-sm font-medium text-green-700">{csvFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-600">Drop your CIBC CSV here</p>
                        <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                      </>
                    )}
                    <input
                      id="csv-file-input"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  <Button
                    className="w-full bg-[#1B4F72] hover:bg-[#154060] text-white"
                    disabled={!csvFile || uploadCsvMutation.isPending}
                    onClick={handleCsvUpload}
                  >
                    {uploadCsvMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Import CSV</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">How to download your CIBC CSV</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>1. Log in to <strong>CIBC Online Banking</strong></p>
                  <p>2. Go to your <strong>Mastercard account</strong></p>
                  <p>3. Click <strong>Download Transactions</strong></p>
                  <p>4. Select <strong>CSV format</strong> and the date range for the month</p>
                  <p>5. Upload the downloaded file here</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── History Tab ── */}
          <TabsContent value="history">
            {reportsListQuery.isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : reportsListQuery.data && reportsListQuery.data.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Report History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Gross Revenue</TableHead>
                        <TableHead>Net Revenue</TableHead>
                        <TableHead>Expenses</TableHead>
                        <TableHead>Net Profit</TableHead>
                        <TableHead>GST Owing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportsListQuery.data.map((r) => (
                        <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            const [y, m] = r.period.split("-").map(Number);
                            setSelectedYear(y);
                            setSelectedMonth(m);
                          }}
                        >
                          <TableCell className="font-medium">{r.period}</TableCell>
                          <TableCell>{centsToCAD(r.grossRevenueCadCents)}</TableCell>
                          <TableCell>{centsToCAD(r.netRevenueCadCents)}</TableCell>
                          <TableCell className="text-red-600">{centsToCAD(r.totalExpensesCadCents)}</TableCell>
                          <TableCell className={r.netProfitCadCents >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {centsToCAD(r.netProfitCadCents)}
                          </TableCell>
                          <TableCell className="text-amber-600">{centsToCAD(r.netGstRemittableCadCents)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No historical reports yet. Generate your first monthly report to see history here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Accounting() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const sessionQuery = trpc.accounting.checkSession.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (sessionQuery.data !== undefined) {
      setAuthenticated(sessionQuery.data.authenticated);
    }
  }, [sessionQuery.data]);

  if (authenticated === null || sessionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!authenticated) {
    return <PinLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return <AccountingDashboard onLogout={() => setAuthenticated(false)} />;
}
