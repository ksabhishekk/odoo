import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, Plus, Loader2, Paperclip, ChevronRight, X } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Status meta — keys are lowercase to match DB default values ──────────────
const STATUS_META = {
  draft: { label: "Draft", cls: "bg-gray-500/15   text-gray-300   border-gray-500/30" },
  pending: { label: "Waiting Approval", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  approved: { label: "Approved", cls: "bg-green-500/15  text-green-300  border-green-500/30" },
  rejected: { label: "Rejected", cls: "bg-red-500/15    text-red-300    border-red-500/30" },
};

const CATEGORIES = ["Food", "Travel", "Equipment", "Software", "Accommodation", "Entertainment", "Other"];

// Schema fields match ExpenseCreateRequest exactly:
// amount_original, currency_original, category, description, expense_date
const schema = z.object({
  description: z.string().min(3, "At least 3 characters"),
  expense_date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  amount_original: z.coerce.number().positive("Must be positive"),
  currency_original: z.string().min(2, "Currency is required"),
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const meta = STATUS_META[status?.toLowerCase()] ?? STATUS_META.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function SummaryPill({ label, amount, highlight = false, pulse = false }) {
  return (
    <div className={`flex flex-col gap-0.5 px-5 py-3 rounded-xl border
      ${highlight ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10"}`}>
      <span className="text-[11px] uppercase tracking-widest font-semibold text-white/40">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold tracking-tight ${highlight ? "text-green-400" : "text-white"}`}>
          {Number(amount || 0).toFixed(2)}
        </span>
        {pulse && amount > 0 && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse ml-1 mb-0.5" />}
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value, accent = false }) {
  return (
    <div className="space-y-1">
      <span className="text-white/40 text-xs uppercase tracking-wider font-medium">{label}</span>
      <p className={`text-sm font-medium border-b border-white/10 pb-1.5
        ${accent ? "text-primary text-base font-bold" : "text-white/80"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [view, setView] = useState("list"); // "list" | "new" | "detail"
  const [selected, setSelected] = useState(null);

  const ocrInputRef = useRef(null);
  const receiptInputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currency_original: "USD",
      expense_date: new Date().toISOString().split("T")[0],
    },
  });

  // ── GET /expenses ─────────────────────────────────────────────────────────

  const fetchExpenses = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await api.get("/expenses");
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast({
        variant: "destructive", title: "Failed to load expenses",
        description: err?.response?.data?.detail ?? err.message
      });
    } finally {
      setListLoading(false);
    }
  }, [toast]);

  // ── GET /countries → extract unique currency codes ────────────────────────

  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await api.get("/countries");
      const seen = new Set();
      const codes = (res.data || [])
        .filter((c) => c.currency_code && !seen.has(c.currency_code) && seen.add(c.currency_code))
        .map((c) => c.currency_code);
      setCurrencies(codes);
    } catch {
      setCurrencies(["USD", "EUR", "GBP", "INR", "JPY", "AUD"]);
    }
  }, []);

  useEffect(() => { fetchExpenses(); fetchCurrencies(); }, [fetchExpenses, fetchCurrencies]);

  // ── Summary totals — status values are lowercase from DB ──────────────────

  const toSubmitTotal = expenses
    .filter((e) => e.status === "draft")
    .reduce((s, e) => s + (Number(e.amount_original) || 0), 0);

  const waitingTotal = expenses
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + (Number(e.amount_original) || 0), 0);

  // Approved shows converted amount (company base currency)
  const approvedTotal = expenses
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + (Number(e.amount_converted) || 0), 0);

  // ── POST /expenses/parse-receipt (multipart) ──────────────────────────────

  const handleOcrUpload = async (file) => {
    if (!file) return;
    setReceiptPreview(URL.createObjectURL(file));
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/expenses/parse-receipt", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const d = res.data;
      if (d.amount) setValue("amount_original", d.amount);
      if (d.currency) setValue("currency_original", d.currency);
      if (d.description) setValue("description", d.description);
      if (d.date) setValue("expense_date", d.date);
      toast({ title: "Receipt Scanned!", description: "Review fields before submitting." });
    } catch {
      toast({ variant: "destructive", title: "OCR Failed", description: "Please fill in manually." });
    } finally {
      setScanning(false);
    }
  };

  // ── POST /expenses — body matches ExpenseCreateRequest exactly ────────────

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/expenses", {
        amount_original: data.amount_original,
        currency_original: data.currency_original,
        category: data.category,
        description: data.description || null,
        expense_date: data.expense_date,
      });
      setExpenses((prev) => [res.data, ...prev]);
      toast({ title: "Expense Submitted" });
      resetForm();
      setView("list");
    } catch (err) {
      toast({
        variant: "destructive", title: "Failed to create",
        description: err?.response?.data?.detail ?? err.message
      });
    }
  };

  const resetForm = () => {
    reset({ currency_original: "USD", expense_date: new Date().toISOString().split("T")[0] });
    setReceiptPreview(null);
  };

  // ── GET /expenses/{id} — refresh single expense ───────────────────────────

  const refreshExpense = async (id) => {
    try {
      const res = await api.get(`/expenses/${id}`);
      setExpenses((prev) => prev.map((e) => (e.id === id ? res.data : e)));
      setSelected(res.data);
    } catch { /* silent */ }
  };

  const openDetail = (exp) => { setSelected(exp); setView("detail"); };
  const goBack = () => { setView("list"); setSelected(null); resetForm(); };

  // ─────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "list") return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Expenses</h1>
          <p className="text-white/40 text-sm mt-0.5">Welcome back, {user?.name ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => ocrInputRef.current?.click()}
            disabled={scanning}>
            {scanning
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning…</>
              : <><Upload className="w-4 h-4 mr-2" />Upload</>}
          </Button>
          <input type="file" accept="image/*" className="hidden" ref={ocrInputRef}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setView("new");
              await handleOcrUpload(file);
            }} />
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            onClick={() => { resetForm(); setView("new"); }}>
            <Plus className="w-4 h-4 mr-2" />New
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
              {["Description", "Date", "Category", "Original", "Converted", "Status"].map((h) => (
                <TableHead key={h} className="text-white/50 font-medium py-3 text-xs uppercase tracking-wider">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-white/30">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading…
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-white/30">
                  No expenses yet. Click <strong>New</strong> or <strong>Upload</strong>.
                </TableCell>
              </TableRow>
            ) : expenses.map((exp) => (
              <TableRow key={exp.id}
                className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => openDetail(exp)}>
                <TableCell className="py-3 text-white font-semibold text-sm">
                  <div>{exp.description ?? "—"}</div>
                  <div className="text-xs text-white/30">#{exp.id}</div>
                </TableCell>
                <TableCell className="py-3 text-white/60 text-sm whitespace-nowrap">
                  {exp.expense_date
                    ? new Date(exp.expense_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </TableCell>
                <TableCell className="py-3 text-white/70 text-sm">{exp.category ?? "—"}</TableCell>
                {/* amount_original + currency_original — what employee entered */}
                <TableCell className="py-3 text-white font-semibold text-sm whitespace-nowrap">
                  {exp.currency_original} {Number(exp.amount_original).toFixed(2)}
                </TableCell>
                {/* amount_converted + currency_converted — backend-converted to company base currency */}
                <TableCell className="py-3 text-white/60 text-sm whitespace-nowrap">
                  {exp.currency_converted} {Number(exp.amount_converted).toFixed(2)}
                </TableCell>
                <TableCell className="py-3">
                  <StatusBadge status={exp.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // NEW EXPENSE FORM
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "new") return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <button onClick={goBack} className="text-white/40 hover:text-white text-sm transition-colors">← Back</button>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span className="text-white font-medium">New Expense</span>
          <ChevronRight className="w-3 h-3" /><span>Pending</span>
          <ChevronRight className="w-3 h-3" /><span>Approved</span>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">

        {/* Attach receipt */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-white/3">
          <button type="button" onClick={() => receiptInputRef.current?.click()}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <Paperclip className="w-4 h-4" />
            {receiptPreview ? "Replace Receipt" : "Attach Receipt"}
          </button>
          <input type="file" accept="image/*" className="hidden" ref={receiptInputRef}
            onChange={(e) => handleOcrUpload(e.target.files?.[0])} />
          {scanning && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />Scanning receipt…
            </div>
          )}
          {receiptPreview && !scanning && (
            <div className="flex items-center gap-2">
              <img src={receiptPreview} alt="receipt" className="h-8 w-8 object-cover rounded border border-white/15" />
              <button onClick={() => setReceiptPreview(null)} className="text-white/30 hover:text-white/70">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

          {/* Description + Date */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Description</Label>
              <Input {...register("description")} placeholder="e.g. Restaurant bill"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
              {errors.description && <p className="text-red-400 text-xs">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Expense Date</Label>
              <Input type="date" {...register("expense_date")}
                className="bg-white/5 border-white/10 text-white" />
              {errors.expense_date && <p className="text-red-400 text-xs">{errors.expense_date.message}</p>}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Category</Label>
            <Select onValueChange={(v) => setValue("category", v, { shouldValidate: true })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-400 text-xs">{errors.category.message}</p>}
          </div>

          {/* Currency + Amount — field names match ExpenseCreateRequest */}
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs uppercase tracking-wider">Amount</Label>
            <div className="flex gap-2">
              <Select defaultValue="USD"
                onValueChange={(v) => setValue("currency_original", v, { shouldValidate: true })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white w-28 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                  {currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" min="0"
                {...register("amount_original")}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white text-lg font-bold flex-1" />
            </div>
            {errors.amount_original && <p className="text-red-400 text-xs">{errors.amount_original.message}</p>}
            <p className="text-white/30 text-xs mt-1">
              Enter the amount in the currency on your receipt. It will be converted to company base currency.
            </p>
          </div>

          <div className="pt-4 border-t border-white/8 flex items-center justify-between">
            <button type="button" onClick={goBack}
              className="text-white/40 hover:text-white text-sm transition-colors">Cancel</button>
            <Button type="submit" disabled={isSubmitting || scanning}
              className="bg-primary hover:bg-primary/90 text-white px-8 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW — read-only, shows approval_steps from ExpenseResponse
  // ─────────────────────────────────────────────────────────────────────────

  if (view === "detail" && selected) {
    // ApprovalStepResponse: {id, approver_id, step_order, status, comment, action_time}
    const steps = selected.approval_steps ?? [];

    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <button onClick={goBack} className="text-white/40 hover:text-white text-sm transition-colors">← Back</button>
          <StatusBadge status={selected.status} />
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 space-y-5">

            <div className="grid grid-cols-2 gap-5">
              <ReadOnlyField label="Description" value={selected.description} />
              <ReadOnlyField label="Expense Date"
                value={selected.expense_date
                  ? new Date(selected.expense_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                  : null} />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <ReadOnlyField label="Category" value={selected.category} />
              <ReadOnlyField label="Original Amount"
                value={`${selected.currency_original} ${Number(selected.amount_original).toFixed(2)}`}
                accent />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <ReadOnlyField label="Converted Amount"
                value={`${selected.currency_converted} ${Number(selected.amount_converted).toFixed(2)}`} />
              <ReadOnlyField label="Approval Step" value={`Step ${selected.current_step}`} />
            </div>

            {/* Approval steps */}
            {steps.length > 0 && (
              <div className="pt-4 border-t border-white/8">
                <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-3">Approval History</p>
                <div className="grid grid-cols-3 mb-2">
                  {["Step", "Status", "Time"].map((h) => (
                    <span key={h} className="text-white/30 text-xs uppercase tracking-wider">{h}</span>
                  ))}
                </div>
                {steps
                  .sort((a, b) => a.step_order - b.step_order)
                  .map((step) => (
                    <div key={step.id} className="grid grid-cols-3 py-2.5 border-t border-white/5 text-sm items-start">
                      <div>
                        <span className="text-white/70">Step {step.step_order}</span>
                        {step.comment && (
                          <p className="text-white/40 text-xs italic mt-1">"{step.comment}"</p>
                        )}
                      </div>
                      <StatusBadge status={step.status} />
                      <span className="text-white/40 text-xs">
                        {step.action_time
                          ? new Date(step.action_time).toLocaleString("en-GB", {
                            hour: "2-digit", minute: "2-digit", day: "numeric", month: "short",
                          })
                          : "Pending"}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            <div className="pt-3 border-t border-white/8 flex justify-end">
              <button onClick={() => refreshExpense(selected.id)}
                className="text-white/30 hover:text-white text-xs transition-colors">
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