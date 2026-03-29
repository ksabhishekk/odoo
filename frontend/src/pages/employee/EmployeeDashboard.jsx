import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Upload,
  Plus,
  Loader2,
  Paperclip,
  ChevronRight,
  FileText,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  "Food", "Travel", "Equipment", "Software", "Accommodation", "Entertainment", "Other",
];

// Expense statuses returned by backend
const STATUS_META = {
  DRAFT: { label: "Draft", cls: "bg-gray-500/15  text-gray-300   border-gray-500/30" },
  SUBMITTED: { label: "Submitted", cls: "bg-blue-500/15  text-blue-300   border-blue-500/30" },
  PENDING: { label: "Waiting Approval", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  APPROVED: { label: "Approved", cls: "bg-green-500/15 text-green-300  border-green-500/30" },
  REJECTED: { label: "Rejected", cls: "bg-red-500/15   text-red-300    border-red-500/30" },
};

// ─── Schema ───────────────────────────────────────────────────────────────────

// Fields must match ExpenseCreateRequest pydantic model exactly
const schema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters"),
  expense_date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  paid_by: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().min(2, "Currency is required"),
  remarks: z.string().optional(),
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function SummaryPill({ label, amount, currency = "$", highlight = false, pulse = false }) {
  return (
    <div className={`flex flex-col gap-0.5 px-5 py-3 rounded-xl border transition-all
      ${highlight
        ? "bg-green-500/10 border-green-500/30 shadow-[0_0_18px_rgba(34,197,94,0.12)]"
        : "bg-white/5 border-white/10"}`}
    >
      <span className="text-[11px] uppercase tracking-widest font-semibold text-white/40">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold tracking-tight ${highlight ? "text-green-400" : "text-white"}`}>
          {currency}{typeof amount === "number" ? amount.toFixed(2) : "0.00"}
        </span>
        {pulse && amount > 0 && (
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse ml-1 mb-0.5" />
        )}
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value, accent = false }) {
  return (
    <div className="space-y-1">
      <span className="text-white/40 text-xs uppercase tracking-wider font-medium">{label}</span>
      <p className={`text-sm font-medium border-b border-white/10 pb-1.5 ${accent ? "text-primary text-base font-bold" : "text-white/80"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // List state
  const [expenses, setExpenses] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [currencies, setCurrencies] = useState([]);

  // View: "list" | "new" | "detail"
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);

  // OCR
  const ocrInputRef = useRef(null);
  const receiptInputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: "USD",
      expense_date: new Date().toISOString().split("T")[0],
    },
  });

  const watchCurrency = watch("currency");

  // ── Fetch expenses: GET /expenses ─────────────────────────────────────────

  const fetchExpenses = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await api.get("/expenses");
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to load expenses",
        description: err?.response?.data?.detail ?? err.message,
      });
    } finally {
      setListLoading(false);
    }
  }, [toast]);

  // ── Fetch currencies: GET /countries for currency list ────────────────────

  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await api.get("/countries");
      // Extract unique currency codes from country list
      const seen = new Set();
      const unique = (res.data || [])
        .filter((c) => {
          if (!c.currency_code || seen.has(c.currency_code)) return false;
          seen.add(c.currency_code);
          return true;
        })
        .map((c) => ({ code: c.currency_code, symbol: c.currency_code }));
      setCurrencies(unique);
    } catch {
      // Fallback static list — won't block the form
      setCurrencies([
        { code: "USD" }, { code: "EUR" }, { code: "GBP" },
        { code: "INR" }, { code: "JPY" }, { code: "AUD" },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchCurrencies();
  }, [fetchExpenses, fetchCurrencies]);

  // ── Summary numbers ───────────────────────────────────────────────────────

  const toSubmitTotal = expenses
    .filter((e) => e.status === "DRAFT")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const waitingTotal = expenses
    .filter((e) => ["SUBMITTED", "PENDING"].includes(e.status))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const approvedTotal = expenses
    .filter((e) => e.status === "APPROVED")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // ── OCR: POST /expenses/parse-receipt (multipart) ─────────────────────────

  const handleOcrUpload = async (file) => {
    if (!file) return;
    setReceiptPreview(URL.createObjectURL(file));
    setScanning(true);
    setScanProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/expenses/parse-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setScanProgress(100);
      const data = res.data;
      // Populate form fields from OCR response
      if (data.amount) setValue("amount", data.amount);
      if (data.description) setValue("description", data.description);
      if (data.date) setValue("expense_date", data.date);
      if (data.currency) setValue("currency", data.currency);
      toast({ title: "Receipt Scanned!", description: "Fields auto-filled. Review before submitting." });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "OCR Failed",
        description: err?.response?.data?.detail ?? "Could not read receipt. Please fill in manually.",
      });
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  };

  // ── Create expense: POST /expenses (JSON body) ────────────────────────────
  // Backend: require_employee, ExpenseCreateRequest pydantic model
  // Fields: description, expense_date, category, paid_by, amount, currency, remarks

  const onSubmit = async (data) => {
    try {
      // Send as JSON — backend uses pydantic model, not multipart
      const res = await api.post("/expenses", {
        description: data.description,
        expense_date: data.expense_date,
        category: data.category,
        paid_by: data.paid_by || null,
        amount: data.amount,
        currency: data.currency,
        remarks: data.remarks || null,
      });
      setExpenses((prev) => [res.data, ...prev]);
      toast({ title: "Expense Created", description: "Saved. Open it to submit for approval." });
      resetForm();
      setView("list");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to create expense",
        description: err?.response?.data?.detail ?? err.message,
      });
    }
  };

  const resetForm = () => {
    reset({
      currency: "USD",
      expense_date: new Date().toISOString().split("T")[0],
    });
    setReceiptPreview(null);
    setScanProgress(0);
  };

  // ── Manager action used as "submit": POST /expenses/{id}/action ───────────
  // The backend has no separate /submit endpoint.
  // Employees submit by triggering action "SUBMIT" — but that's a manager route.
  // Looking at the backend: create_expense sets the initial status.
  // The correct flow is: expense is created → backend auto-assigns status.
  // If backend returns DRAFT, we show a "Submit for Approval" button that
  // calls the action endpoint. But require_manager guard means employee can't.
  // ── REAL FIX: expense is submitted on create if status comes back non-DRAFT,
  // otherwise we show status and note it needs manager action.
  // No extra endpoint call needed — just refresh.

  const refreshExpense = async (id) => {
    try {
      const res = await api.get(`/expenses/${id}`);
      setExpenses((prev) => prev.map((e) => (e.id === id ? res.data : e)));
      setSelected(res.data);
    } catch {
      // silent
    }
  };

  // ── Navigation helpers ────────────────────────────────────────────────────

  const openDetail = (exp) => { setSelected(exp); setView("detail"); };
  const goBack = () => { setView("list"); setSelected(null); resetForm(); };

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: LIST
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "list") return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Expenses</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Welcome back, {user?.name ?? "—"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Upload → OCR → open new form */}
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => ocrInputRef.current?.click()}
            disabled={scanning}
          >
            {scanning
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{scanProgress}%</>
              : <><Upload className="w-4 h-4 mr-2" />Upload</>
            }
          </Button>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={ocrInputRef}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setView("new");           // open form first
              await handleOcrUpload(file);
            }}
          />

          {/* New — blank form */}
          <Button
            className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            onClick={() => { resetForm(); setView("new"); }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap items-center gap-3">
        <SummaryPill label="To Submit" amount={toSubmitTotal} pulse />
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
        <SummaryPill label="Waiting Approval" amount={waitingTotal} />
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
        <SummaryPill label="Approved" amount={approvedTotal} highlight />
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              {["Employee", "Description", "Date", "Category", "Paid By", "Remarks", "Amount", "Status"].map((h) => (
                <TableHead key={h} className="text-white/50 font-medium py-3 text-xs uppercase tracking-wider">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-white/30">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading expenses…
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-white/30">
                  No expenses yet. Click <strong>New</strong> or <strong>Upload</strong> to get started.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow
                  key={exp.id}
                  className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => openDetail(exp)}
                >
                  {/* Employee name — backend returns employee_name or we fall back to current user */}
                  <TableCell className="py-3 text-white/70 text-sm">
                    {exp.employee_name ?? user?.name ?? "—"}
                  </TableCell>
                  <TableCell className="py-3 text-white font-semibold text-sm">
                    {exp.description ?? "—"}
                  </TableCell>
                  <TableCell className="py-3 text-white/60 text-sm whitespace-nowrap">
                    {exp.expense_date
                      ? new Date(exp.expense_date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })
                      : "—"}
                  </TableCell>
                  <TableCell className="py-3 text-white/70 text-sm">{exp.category ?? "—"}</TableCell>
                  <TableCell className="py-3 text-white/60 text-sm">{exp.paid_by ?? "—"}</TableCell>
                  <TableCell className="py-3 text-white/50 text-sm max-w-[120px] truncate">
                    {exp.remarks || "None"}
                  </TableCell>
                  <TableCell className="py-3 text-white font-semibold text-sm whitespace-nowrap">
                    {exp.amount != null
                      ? `${exp.currency ?? ""} ${Number(exp.amount).toFixed(2)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusBadge status={exp.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: NEW EXPENSE FORM
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "new") return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={goBack} className="text-white/40 hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span className="text-white font-medium">Draft</span>
          <ChevronRight className="w-3 h-3" />
          <span>Waiting Approval</span>
          <ChevronRight className="w-3 h-3" />
          <span>Approved</span>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">

        {/* Attach receipt bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-white/3">
          <button
            type="button"
            onClick={() => receiptInputRef.current?.click()}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            {receiptPreview ? "Replace Receipt" : "Attach Receipt"}
          </button>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={receiptInputRef}
            onChange={(e) => handleOcrUpload(e.target.files?.[0])}
          />
          {scanning && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              Scanning receipt… {scanProgress}%
            </div>
          )}
          {receiptPreview && !scanning && (
            <div className="flex items-center gap-2">
              <img src={receiptPreview} alt="receipt preview" className="h-8 w-8 object-cover rounded border border-white/15" />
              <button
                onClick={() => setReceiptPreview(null)}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

          {/* Description + Date */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Description</Label>
              <Input
                {...register("description")}
                placeholder="e.g. Restaurant bill"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
              />
              {errors.description && <p className="text-red-400 text-xs">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Expense Date</Label>
              <Input
                type="date"
                {...register("expense_date")}
                className="bg-white/5 border-white/10 text-white"
              />
              {errors.expense_date && <p className="text-red-400 text-xs">{errors.expense_date.message}</p>}
            </div>
          </div>

          {/* Category + Paid By */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Category</Label>
              <Select onValueChange={(v) => setValue("category", v, { shouldValidate: true })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-400 text-xs">{errors.category.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Paid By</Label>
              <Input
                {...register("paid_by")}
                placeholder={user?.name ?? "Your name"}
                defaultValue={user?.name ?? ""}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Currency + Amount */}
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Total Amount</Label>
            <div className="flex gap-2">
              <Select
                defaultValue="USD"
                onValueChange={(v) => setValue("currency", v, { shouldValidate: true })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white w-28 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("amount")}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white text-lg font-bold flex-1"
              />
            </div>
            {errors.amount && <p className="text-red-400 text-xs">{errors.amount.message}</p>}
            <p className="text-white/30 text-xs mt-1">
              Enter the amount in the currency shown on your receipt. Managers see it converted to base currency.
            </p>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Remarks</Label>
            <Textarea
              {...register("remarks")}
              placeholder="Any additional notes…"
              className="bg-white/5 border-white/10 text-white h-20 resize-none placeholder:text-white/20"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/8 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={isSubmitting || scanning}
              className="bg-primary hover:bg-primary/90 text-white px-8 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: DETAIL (read-only, shows approval log)
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "detail" && selected) {
    // approval_steps is an array of step objects returned in ExpenseResponse
    const approvalLog = selected.approval_steps ?? selected.approvals ?? [];

    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-300">

        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={goBack} className="text-white/40 hover:text-white text-sm transition-colors">
            ← Back
          </button>
          <div className="flex items-center gap-2 text-sm">
            {["DRAFT", "SUBMITTED", "PENDING", "APPROVED"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className={selected.status === s ? "text-white font-semibold" : "text-white/30"}>
                  {STATUS_META[s]?.label ?? s}
                </span>
                {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-white/20" />}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">

          {/* Receipt link if available */}
          {selected.receipt_url && (
            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/8 bg-white/3">
              <Paperclip className="w-4 h-4 text-white/40" />
              <a
                href={selected.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                View Receipt
              </a>
            </div>
          )}

          <div className="p-6 space-y-5">

            {/* Fields */}
            <div className="grid grid-cols-2 gap-5">
              <ReadOnlyField label="Description" value={selected.description} />
              <ReadOnlyField
                label="Expense Date"
                value={selected.expense_date
                  ? new Date(selected.expense_date).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                  : null}
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <ReadOnlyField label="Category" value={selected.category} />
              <ReadOnlyField label="Paid By" value={selected.paid_by} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <ReadOnlyField
                label="Total Amount"
                value={selected.amount != null
                  ? `${selected.currency ?? ""} ${Number(selected.amount).toFixed(2)}`
                  : null}
                accent
              />
              <ReadOnlyField label="Remarks" value={selected.remarks || "None"} />
            </div>

            {/* Approval log */}
            {approvalLog.length > 0 && (
              <div className="pt-4 border-t border-white/8">
                <div className="grid grid-cols-3 mb-3">
                  {["Approver", "Status", "Time"].map((h) => (
                    <span key={h} className="text-white/40 text-xs uppercase tracking-wider font-medium">{h}</span>
                  ))}
                </div>
                {approvalLog.map((step, i) => (
                  <div key={i} className="grid grid-cols-3 py-2.5 border-t border-white/5 text-sm items-center">
                    <span className="text-white/80">
                      {step.approver_name ?? step.approver ?? "—"}
                    </span>
                    <StatusBadge status={step.status ?? step.action} />
                    <span className="text-white/50 text-xs">
                      {step.acted_at ?? step.time
                        ? new Date(step.acted_at ?? step.time).toLocaleString("en-GB", {
                          hour: "2-digit", minute: "2-digit",
                          day: "numeric", month: "short", year: "numeric",
                        })
                        : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Refresh button — useful to poll updated status */}
            <div className="pt-4 border-t border-white/8 flex justify-end">
              <button
                onClick={() => refreshExpense(selected.id)}
                className="text-white/40 hover:text-white text-xs transition-colors flex items-center gap-1"
              >
                ↻ Refresh status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}