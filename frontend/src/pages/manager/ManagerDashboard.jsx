import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, X, FileText, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Status keys lowercase to match DB
const STATUS_META = {
  draft: { label: "Draft", cls: "bg-gray-500/15   text-gray-300   border-gray-500/30" },
  pending: { label: "Pending", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  approved: { label: "Approved", cls: "bg-green-500/15  text-green-300  border-green-500/30" },
  rejected: { label: "Rejected", cls: "bg-red-500/15    text-red-300    border-red-500/30" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status?.toLowerCase()] ?? STATUS_META.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({}); // { [id]: "approve"|"reject" }
  const [comments, setComments] = useState({}); // { [id]: string }

  // ── GET /expenses/pending-approvals ───────────────────────────────────────

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/expenses/pending-approvals");
      setPending(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast({
        variant: "destructive", title: "Failed to load approvals",
        description: err?.response?.data?.detail ?? err.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // ── POST /expenses/{id}/action ────────────────────────────────────────────
  // ExpenseActionRequest: { action: "approve" | "reject", comment?: string }
  // action values are lowercase — matching what the backend expects

  const handleAction = async (expenseId, action) => {
    setActing((prev) => ({ ...prev, [expenseId]: action }));
    try {
      const res = await api.post(`/expenses/${expenseId}/action`, {
        action,                              // "approve" or "reject" — lowercase
        comment: comments[expenseId] ?? "",
      });
      const updated = res.data;
      setPending((prev) => prev.filter((e) => e.id !== expenseId));
      setHistory((prev) => [updated, ...prev]);
      toast({
        title: action === "approve" ? "Expense Approved ✓" : "Expense Rejected",
        description: `Expense #${expenseId} ${action}d.`,
        variant: action === "approve" ? "default" : "destructive",
      });
    } catch (err) {
      toast({
        variant: "destructive", title: "Action failed",
        description: err?.response?.data?.detail ?? err.message
      });
    } finally {
      setActing((prev) => { const n = { ...prev }; delete n[expenseId]; return n; });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Approval Queue</h1>
          <p className="text-white/50">Review and manage pending employee reimbursements.</p>
        </div>
        <Button variant="outline" size="sm"
          className="border-white/15 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
          onClick={fetchPending} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-black/20 border border-white/10 p-1 mb-6">
          <TabsTrigger value="pending"
            className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/60">
            Pending {!loading && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="history"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
            Reviewed ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* ── PENDING ── */}
        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="glass-panel p-12 text-center rounded-2xl border-white/5 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-white/40">Loading pending approvals…</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border-white/5 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">All caught up!</h3>
              <p className="text-white/50">No pending expenses to review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {pending.map((expense) => {
                const isActing = !!acting[expense.id];
                // ExpenseResponse has user_id, not employee_name — show user_id as fallback
                const employeeLabel = `Employee #${expense.user_id}`;

                return (
                  <Card key={expense.id}
                    className="glass-panel border-white/5 overflow-hidden group transition-all hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)]">

                    {/* Receipt preview */}
                    <CardHeader className="p-0 relative h-32 w-full overflow-hidden bg-white/5 flex items-center justify-center border-b border-white/5">
                      {expense.receipt_url ? (
                        <img src={expense.receipt_url} alt="receipt"
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                      ) : (
                        <FileText className="w-10 h-10 text-white/20" />
                      )}
                      <Badge className="absolute top-3 right-3 bg-yellow-500/80 text-white hover:bg-yellow-500/80 shadow-lg backdrop-blur-md">
                        Pending
                      </Badge>
                    </CardHeader>

                    <CardContent className="p-5">
                      {/* Employee */}
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {initials(employeeLabel)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white">{employeeLabel}</p>
                          <p className="text-xs text-white/40">{formatDate(expense.expense_date)}</p>
                        </div>
                      </div>

                      {/* Expense info */}
                      <h3 className="font-bold text-lg text-white truncate">
                        {expense.description ?? "—"}
                      </h3>

                      <div className="flex justify-between items-end mt-2">
                        <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5">
                          {expense.category ?? "—"}
                        </Badge>
                        {/* Show converted amount (company base currency) to manager */}
                        <div className="text-right">
                          <span className="text-xl font-black text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                            {expense.currency_converted} {Number(expense.amount_converted ?? 0).toFixed(2)}
                          </span>
                          {/* Original amount if different currency */}
                          {expense.currency_original !== expense.currency_converted && (
                            <p className="text-xs text-white/30">
                              {expense.currency_original} {Number(expense.amount_original).toFixed(2)} orig.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Step indicator */}
                      <p className="text-xs text-white/30 mt-2">Step {expense.current_step}</p>

                      {/* Comment box */}
                      <div className="mt-4">
                        <Textarea
                          placeholder="Add a comment… (optional)"
                          className="text-xs min-h-[60px] bg-black/40 border-white/10 resize-none text-white placeholder:text-white/30"
                          value={comments[expense.id] ?? ""}
                          onChange={(e) => setComments((prev) => ({ ...prev, [expense.id]: e.target.value }))}
                          disabled={isActing}
                        />
                      </div>
                    </CardContent>

                    <CardFooter className="p-5 pt-0 flex gap-3">
                      <Button variant="outline"
                        className="flex-1 border-white/10 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50 text-white/70 bg-black/40"
                        onClick={() => handleAction(expense.id, "reject")}
                        disabled={isActing}>
                        {acting[expense.id] === "reject"
                          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          : <X className="w-4 h-4 mr-2" />}
                        Reject
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white border-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        onClick={() => handleAction(expense.id, "approve")}
                        disabled={isActing}>
                        {acting[expense.id] === "approve"
                          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          : <Check className="w-4 h-4 mr-2" />}
                        Approve
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── HISTORY ── */}
        <TabsContent value="history" className="glass-panel rounded-2xl border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 grid grid-cols-4 text-xs font-semibold text-white/50 uppercase tracking-wider px-6">
            <div className="col-span-2">Expense</div>
            <div>Decision</div>
            <div className="text-right">Amount</div>
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-sm">
              No history yet. Actions taken this session appear here.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.map((expense) => (
                <div key={expense.id}
                  className="grid grid-cols-4 items-center p-4 px-6 hover:bg-white/5 transition-colors group">
                  <div className="col-span-2">
                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">
                      {expense.description ?? "—"}
                    </h4>
                    <p className="text-xs text-white/40">
                      #{expense.id} · {formatDate(expense.expense_date)}
                    </p>
                    {comments[expense.id] && (
                      <p className="text-xs text-white/50 mt-1 italic border-l-2 border-white/10 pl-2">
                        "{comments[expense.id]}"
                      </p>
                    )}
                  </div>
                  <div>
                    <StatusBadge status={expense.status} />
                  </div>
                  <div className="text-right font-medium text-white text-sm">
                    {expense.currency_converted} {Number(expense.amount_converted ?? 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}