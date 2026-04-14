/**
 * YFIT AI Accounting Dashboard
 *
 * Owner-only page for managing the monthly P&L / GST accounting system.
 * Features:
 *  - Stripe income sync
 *  - CIBC CSV upload
 *  - Expense review table with category editing
 *  - Monthly report summary with GST remittance
 *  - Report generation and email delivery
 */

import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { getLoginUrl } from "@/const";

// ─── Types ────────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  { value: "gas_fuel", label: "Gas & Fuel" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "software_subscription", label: "Software Subscriptions" },
  { value: "stripe_fees", label: "Stripe Processing Fees" },
  { value: "advertising", label: "Advertising" },
  { value: "professional_services", label: "Professional Services" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other / Uncategorized" },
] as const;

type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]["value"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cad(cents: number): string {
  const dollars = cents / 100;
  const sign = dollars < 0 ? "-" : "";
  return `${sign}$${Math.abs(dollars).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function getMonthName(month: number): string {
  return ["", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"][month];
}

function getPreviousMonth(): { year: number; month: number } {
  const now = new Date();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return { year, month };
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Accounting() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // Period selection
  const prev = getPreviousMonth();
  const [selectedYear, setSelectedYear] = useState(prev.year);
  const [selectedMonth, setSelectedMonth] = useState(prev.month);

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [statementMonth, setStatementMonth] = useState(
    `${prev.year}-${String(prev.month).padStart(2, "0")}`
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC queries
  const reportQuery = trpc.accounting.getMonthlyReport.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: isAuthenticated }
  );

  const expensesQuery = trpc.accounting.listExpenses.useQuery(
    { year: selectedYear, month: selectedMonth },
    { enabled: isAuthenticated }
  );

  const reportsListQuery = trpc.accounting.listReports.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
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
      toast.success(`Imported ${data.imported} transactions. ${data.errors.length > 0 ? `${data.errors.length} warnings.` : ""}`);
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

  // CSV upload handler
  const handleCsvUpload = useCallback(async () => {
    if (!csvFile) return;
    const text = await csvFile.text();
    uploadCsvMutation.mutate({
      fileName: csvFile.name,
      csvContent: text,
      statementMonth,
    });
  }, [csvFile, statementMonth, uploadCsvMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) {
      setCsvFile(file);
    } else {
      toast.error("Please upload a CSV file");
    }
  }, []);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the accounting dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => (window.location.href = getLoginUrl())}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is restricted to administrators only.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const report = reportQuery.data;
  const expenses = expensesQuery.data;

  // Year options (current year and previous 3)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B4F72] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">YFIT AI — Accounting Dashboard</h1>
            <p className="text-blue-200 text-sm mt-1">Manitoba, Canada · 5% Federal GST · Fiscal Year: Jan 1 – Dec 31</p>
          </div>
          <a href="/" className="text-blue-200 hover:text-white text-sm transition-colors">
            ← Back to Site
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Period Selector */}
        <div className="flex items-center gap-4 mb-8">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">Reporting Period:</span>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>{getMonthName(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-gray-500 text-sm">
            {getMonthName(selectedMonth)} {selectedYear}
          </span>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <DollarSign className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="w-4 h-4 mr-2" />
              Report History
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
          <TabsContent value="overview">
            {/* Sync Button */}
            <div className="flex items-center gap-3 mb-6">
              <Button
                onClick={() => syncStripeMutation.mutate({ year: selectedYear, month: selectedMonth })}
                disabled={syncStripeMutation.isPending}
                variant="outline"
                className="gap-2"
              >
                {syncStripeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sync Stripe Income
              </Button>
              <span className="text-sm text-gray-500">
                Pulls charges from Stripe API and converts USD → CAD
              </span>
            </div>

            {reportQuery.isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {/* Income Summary */}
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Income (Stripe)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <SummaryCard
                    title="Gross Revenue"
                    value={cad(report?.grossRevenueCadCents ?? 0)}
                    icon={TrendingUp}
                    variant="positive"
                    subtitle="USD converted to CAD"
                  />
                  <SummaryCard
                    title="Refunds"
                    value={cad(report?.totalRefundsCadCents ?? 0)}
                    icon={TrendingDown}
                    variant="negative"
                  />
                  <SummaryCard
                    title="Stripe Fees"
                    value={cad(report?.stripeFeesTotalCadCents ?? 0)}
                    icon={DollarSign}
                    variant="warning"
                    subtitle="2.9% + $0.30/transaction"
                  />
                  <SummaryCard
                    title="Net Revenue"
                    value={cad(report?.netRevenueCadCents ?? 0)}
                    icon={TrendingUp}
                    variant={(report?.netRevenueCadCents ?? 0) >= 0 ? "positive" : "negative"}
                  />
                </div>

                {/* Expenses Summary */}
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Expenses (CIBC)</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <SummaryCard
                    title="Total Expenses"
                    value={cad(report?.totalExpensesCadCents ?? 0)}
                    icon={TrendingDown}
                    variant="negative"
                  />
                  <SummaryCard
                    title="GST ITCs"
                    value={cad(report?.totalGstItcCadCents ?? 0)}
                    icon={CheckCircle}
                    variant="positive"
                    subtitle="Claimable input tax credits"
                  />
                  <SummaryCard
                    title="Net Profit / Loss"
                    value={cad(report?.netProfitCadCents ?? 0)}
                    icon={(report?.netProfitCadCents ?? 0) >= 0 ? TrendingUp : TrendingDown}
                    variant={(report?.netProfitCadCents ?? 0) >= 0 ? "positive" : "negative"}
                  />
                </div>

                {/* GST Remittance */}
                <h2 className="text-lg font-semibold text-gray-800 mb-3">GST Remittance Summary</h2>
                <Card className="mb-6 border-2 border-blue-200">
                  <CardContent className="pt-5">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">GST Collected</p>
                        <p className="text-2xl font-bold text-blue-700">{cad(report?.gstCollectedCadCents ?? 0)}</p>
                        <p className="text-xs text-gray-400 mt-1">From Canadian customers</p>
                      </div>
                      <div className="text-center border-x border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">GST ITCs</p>
                        <p className="text-2xl font-bold text-green-700">({cad(report?.totalGstItcCadCents ?? 0)})</p>
                        <p className="text-xs text-gray-400 mt-1">Input tax credits on expenses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          {(report?.netGstRemittableCadCents ?? 0) >= 0 ? "Net GST Owing" : "Net GST Refund"}
                        </p>
                        <p className={`text-2xl font-bold ${(report?.netGstRemittableCadCents ?? 0) > 0 ? "text-red-700" : "text-green-700"}`}>
                          {cad(Math.abs(report?.netGstRemittableCadCents ?? 0))}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(report?.netGstRemittableCadCents ?? 0) > 0 ? "Remit to CRA" : "Claim from CRA"}
                        </p>
                      </div>
                    </div>

                    {(report?.gstCollectedCadCents ?? 0) === 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                          <strong>GST Note:</strong> No GST was collected this month. If your annual revenue exceeds $30,000 CAD,
                          you must register for GST and collect 5% from Canadian customers. Consider enabling Stripe Tax.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Expense Breakdown by Category */}
                {report?.expensesByCategory && Object.keys(report.expensesByCategory).length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Expense Breakdown</h2>
                    <Card className="mb-6">
                      <CardContent className="pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Transactions</TableHead>
                              <TableHead className="text-right">Total (incl. GST)</TableHead>
                              <TableHead className="text-right">GST ITC (5%)</TableHead>
                              <TableHead className="text-right">Pre-tax Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(report.expensesByCategory).map(([cat, vals]) => {
                              const catLabel = EXPENSE_CATEGORIES.find(c => c.value === cat)?.label ?? cat;
                              const preTax = vals.totalCadCents - vals.gstItcCadCents;
                              return (
                                <TableRow key={cat}>
                                  <TableCell className="font-medium">{catLabel}</TableCell>
                                  <TableCell className="text-right">{vals.count}</TableCell>
                                  <TableCell className="text-right">{cad(vals.totalCadCents)}</TableCell>
                                  <TableCell className="text-right text-green-700">{cad(vals.gstItcCadCents)}</TableCell>
                                  <TableCell className="text-right text-gray-500">{cad(preTax)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Send Report Button */}
                <div className="flex justify-end">
                  <Button
                    className="gap-2 bg-[#1B4F72] hover:bg-[#154360]"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/send-monthly-report", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ year: selectedYear, month: selectedMonth }),
                        });
                        const result = await response.json() as { success: boolean; messageId?: string; error?: string };
                        if (result.success) {
                          toast.success(`Monthly report emailed to support@yfitai.com (ID: ${result.messageId})`);
                        } else {
                          toast.error(`Email failed: ${result.error}`);
                        }
                      } catch (err) {
                        toast.error("Failed to send report");
                      }
                    }}
                  >
                    <Send className="w-4 h-4" />
                    Email Report to support@yfitai.com
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── EXPENSES TAB ─────────────────────────────────────────────────── */}
          <TabsContent value="expenses">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Expenses — {getMonthName(selectedMonth)} {selectedYear}
              </h2>
              <Badge variant="outline">
                {expenses?.rows.length ?? 0} transactions
              </Badge>
            </div>

            {expensesQuery.isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : expenses?.rows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No expenses for this period.</p>
                  <p className="text-sm text-gray-400 mt-1">Upload your CIBC CSV statement in the Import CSV tab.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">GST ITC</TableHead>
                        <TableHead>GST?</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses?.rows.map((expense) => (
                        <TableRow key={expense.id} className={!expense.reviewed ? "bg-amber-50" : ""}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {new Date(expense.transactionDate).toLocaleDateString("en-CA")}
                          </TableCell>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">
                            {expense.merchantName}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={expense.category}
                              onValueChange={(value) =>
                                updateExpenseMutation.mutate({
                                  id: expense.id,
                                  category: value as ExpenseCategory,
                                  reviewed: true,
                                })
                              }
                            >
                              <SelectTrigger className="w-44 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {EXPENSE_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {cad(expense.amountCadCents)}
                          </TableCell>
                          <TableCell className="text-right text-green-700 text-sm">
                            {cad(expense.gstItcCadCents)}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() =>
                                updateExpenseMutation.mutate({
                                  id: expense.id,
                                  gstEligible: !expense.gstEligible,
                                })
                              }
                              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                expense.gstEligible
                                  ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                              }`}
                            >
                              {expense.gstEligible ? "Yes" : "No"}
                            </button>
                          </TableCell>
                          <TableCell>
                            {expense.reviewed ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <button
                                onClick={() =>
                                  updateExpenseMutation.mutate({ id: expense.id, reviewed: true })
                                }
                                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800"
                              >
                                <AlertCircle className="w-4 h-4" />
                                Review
                              </button>
                            )}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${expense.merchantName}"?`)) {
                                  deleteExpenseMutation.mutate({ id: expense.id });
                                }
                              }}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── CSV UPLOAD TAB ────────────────────────────────────────────────── */}
          <TabsContent value="upload">
            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Import CIBC Mastercard Statement</CardTitle>
                  <CardDescription>
                    Export your CIBC credit card statement as CSV and upload it here.
                    Transactions will be auto-categorized and GST ITCs calculated at 5%.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Statement Month */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Statement Month
                    </label>
                    <input
                      type="month"
                      value={statementMonth}
                      onChange={(e) => setStatementMonth(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? "border-blue-400 bg-blue-50"
                        : csvFile
                        ? "border-green-400 bg-green-50"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCsvFile(file);
                      }}
                    />
                    {csvFile ? (
                      <>
                        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                        <p className="font-medium text-green-700">{csvFile.name}</p>
                        <p className="text-sm text-green-600 mt-1">
                          {(csvFile.size / 1024).toFixed(1)} KB — ready to import
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="font-medium text-gray-600">Drop your CIBC CSV here</p>
                        <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                      </>
                    )}
                  </div>

                  {/* Import Button */}
                  <Button
                    onClick={handleCsvUpload}
                    disabled={!csvFile || uploadCsvMutation.isPending}
                    className="w-full gap-2 bg-[#1B4F72] hover:bg-[#154360]"
                  >
                    {uploadCsvMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import Transactions
                      </>
                    )}
                  </Button>

                  {/* Instructions */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                    <p className="font-medium text-gray-700">How to export from CIBC:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Log in to CIBC Online Banking</li>
                      <li>Go to your Mastercard account</li>
                      <li>Select "Download Transactions" or "Export"</li>
                      <li>Choose CSV format and the statement period</li>
                      <li>Save the file and upload it here</li>
                    </ol>
                    <p className="text-xs text-gray-400 mt-2">
                      Expected format: Date, Description, Debit, Credit
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── REPORT HISTORY TAB ────────────────────────────────────────────── */}
          <TabsContent value="history">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Report History</h2>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  const year = new Date().getFullYear();
                  try {
                    const response = await fetch("/api/send-year-end-report", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ year }),
                    });
                    const result = await response.json() as { success: boolean; messageId?: string; error?: string; monthsCovered?: number };
                    if (result.success) {
                      toast.success(`Year-end statement for ${year} emailed (${result.monthsCovered} months covered)`);
                    } else {
                      toast.error(`Year-end failed: ${result.error}`);
                    }
                  } catch (err) {
                    toast.error("Failed to generate year-end statement");
                  }
                }}
              >
                <FileText className="w-4 h-4" />
                Generate Year-End Statement
              </Button>
            </div>

            {reportsListQuery.isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (reportsListQuery.data?.length ?? 0) === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No reports generated yet.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Sync Stripe income and import expenses, then send a report.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Gross Revenue</TableHead>
                        <TableHead className="text-right">Net Revenue</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">GST Owing</TableHead>
                        <TableHead className="text-right">Net Profit</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportsListQuery.data?.map((r) => {
                        const [y, m] = r.period.split("-");
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              {getMonthName(parseInt(m))} {y}
                            </TableCell>
                            <TableCell className="text-right">{cad(r.grossRevenueCadCents)}</TableCell>
                            <TableCell className="text-right">{cad(r.netRevenueCadCents)}</TableCell>
                            <TableCell className="text-right">{cad(r.totalExpensesCadCents)}</TableCell>
                            <TableCell className={`text-right ${r.netGstRemittableCadCents > 0 ? "text-red-600" : "text-green-600"}`}>
                              {cad(r.netGstRemittableCadCents)}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${r.netProfitCadCents >= 0 ? "text-green-700" : "text-red-700"}`}>
                              {cad(r.netProfitCadCents)}
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch("/api/send-monthly-report", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ year: parseInt(y), month: parseInt(m) }),
                                    });
                                    const result = await response.json() as { success: boolean; messageId?: string; error?: string };
                                    if (result.success) {
                                      toast.success("Report emailed successfully");
                                    } else {
                                      toast.error(`Failed: ${result.error}`);
                                    }
                                  } catch {
                                    toast.error("Failed to send report");
                                  }
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                Resend
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
