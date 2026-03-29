import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, XCircle, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/services/api";

// Status keys lowercase — matches DB values
const STATUS_META = {
  draft: { label: "Draft", badgeCls: "bg-gray-500/20  text-gray-300" },
  pending: { label: "Pending", badgeCls: "bg-yellow-500/20 text-yellow-400" },
  approved: { label: "Approved", badgeCls: "bg-green-500/20  text-green-400" },
  rejected: { label: "Rejected", badgeCls: "bg-red-500/20    text-red-400" },
};

function stepIcon(status) {
  const s = status?.toLowerCase();
  if (s === "approved") return <CheckCircle2 className="w-4 h-4 text-[#14161f]" />;
  if (s === "rejected") return <XCircle className="w-4 h-4 text-[#14161f]" />;
  return <Clock className="w-4 h-4 text-[#14161f]" />;
}

function stepDotClass(status) {
  const s = status?.toLowerCase();
  if (s === "approved") return "bg-green-500";
  if (s === "rejected") return "bg-red-500";
  return "bg-yellow-500 animate-pulse";
}

export default function ExpenseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [acting, setActing] = useState(null); // "approve" | "reject"

  // ── GET /expenses/{id} ────────────────────────────────────────────────────

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/expenses/${id}`);
        setExpense(res.data);
      } catch (err) {
        toast({
          variant: "destructive", title: "Could not load expense",
          description: err?.response?.data?.detail ?? err.message
        });
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate, toast]);

  // ── POST /expenses/{id}/action ────────────────────────────────────────────
  // ExpenseActionRequest: { action: "approve" | "reject", comment?: string }
  // Only managers can call this — the UI hides the panel for non-managers,
  // but the route guard (require_manager) on the backend is the real protection.

  const handleAction = async (action) => {
    setActing(action);
    try {
      const res = await api.post(`/expenses/${id}/action`, {
        action,
        comment: comment || null,
      });
      setExpense(res.data);
      toast({
        title: action === "approve" ? "Expense Approved ✓" : "Expense Rejected",
        variant: action === "approve" ? "default" : "destructive",
      });
    } catch (err) {
      toast({
        variant: "destructive", title: "Action failed",
        description: err?.response?.data?.detail ?? err.message
      });
    } finally {
      setActing(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (!expense) return null;

  const statusMeta = STATUS_META[expense.status?.toLowerCase()] ?? STATUS_META.pending;

  // approval_steps: [{id, approver_id, step_order, status, comment, action_time}]
  const steps = [...(expense.approval_steps ?? [])].sort((a, b) => a.step_order - b.step_order);

  // Show action panel only for managers, and only when expense is pending
  const canApprove = user?.role?.toUpperCase() === "MANAGER" && expense.status?.toLowerCase() === "pending";

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <Button variant="ghost" className="mb-6 -ml-4 text-white/50 hover:text-white" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-5 h-5 mr-2" /> Back
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading font-bold text-white">
              {expense.description ?? `Expense #${expense.id}`}
            </h1>
            <Badge className={`${statusMeta.badgeCls} pointer-events-none`}>
              {statusMeta.label}
            </Badge>
          </div>
          <p className="text-white/50">
            Submitted by <span className="text-white/80">User #{expense.user_id}</span>
            {expense.expense_date && (
              <> · {new Date(expense.expense_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</>
            )}
          </p>
        </div>

        {/* Amount — show converted (base currency) prominently */}
        <div className="text-right">
          <p className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">Amount</p>
          <div className="text-4xl font-extrabold text-primary drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            {expense.currency_converted}{" "}
            {Number(expense.amount_converted).toFixed(2)}
          </div>
          {expense.currency_original !== expense.currency_converted && (
            <p className="text-sm text-white/30 mt-1">
              {expense.currency_original} {Number(expense.amount_original).toFixed(2)} original
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Details + Timeline */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass-panel border-white/5">
            <CardContent className="p-8">

              {/* Expense details */}
              <h3 className="text-xl font-semibold text-white mb-6 border-b border-white/5 pb-4">
                Expense Details
              </h3>
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <p className="text-sm text-white/40 mb-1">Category</p>
                  <p className="font-medium text-white">{expense.category ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-white/40 mb-1">Expense ID</p>
                  <p className="font-medium text-white">#{expense.id}</p>
                </div>
                <div>
                  <p className="text-sm text-white/40 mb-1">Original Amount</p>
                  <p className="font-medium text-white">
                    {expense.currency_original} {Number(expense.amount_original).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/40 mb-1">Converted Amount</p>
                  <p className="font-medium text-white">
                    {expense.currency_converted} {Number(expense.amount_converted).toFixed(2)}
                  </p>
                </div>
                {expense.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-white/40 mb-1">Description</p>
                    <p className="text-white/80 leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5">
                      {expense.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Approval timeline */}
              {steps.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold text-white mb-6 border-b border-white/5 pb-4 mt-8">
                    Approval History
                  </h3>
                  <div className="relative pl-6 space-y-8">
                    <div className="absolute left-[11px] top-4 bottom-4 w-px bg-white/10" />
                    {steps.map((step) => (
                      <div key={step.id} className="relative z-10">
                        <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#14161f] ${stepDotClass(step.status)}`}>
                          {stepIcon(step.status)}
                        </div>
                        <div className="glass p-5 rounded-xl border border-white/10 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30 transition-transform">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className={`font-semibold ${step.status?.toLowerCase() === "approved" ? "text-green-400" :
                                  step.status?.toLowerCase() === "rejected" ? "text-red-400" :
                                    "text-yellow-400"
                                }`}>
                                Step {step.step_order}
                              </p>
                              {/* approver_id is all we have — no name in schema */}
                              <p className="text-sm text-white/50">Approver #{step.approver_id}</p>
                            </div>
                            {step.action_time && (
                              <p className="text-xs text-white/40">
                                {new Date(step.action_time).toLocaleString([], {
                                  hour: "2-digit", minute: "2-digit", month: "short", day: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                          {step.comment && (
                            <div className="mt-3 text-sm text-white/60 bg-black/30 p-3 rounded border border-white/5 italic flex gap-2">
                              <span className="text-primary opacity-50">"</span>
                              {step.comment}
                              <span className="text-primary opacity-50">"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action panel — only shown to managers when expense is pending */}
          {canApprove && (
            <Card className="glass-panel border-primary/30 shadow-[0_0_30px_rgba(99,102,241,0.15)] overflow-hidden">
              <div className="bg-primary/20 p-4 border-b border-primary/30">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Your Approval Required
                </h3>
              </div>
              <CardContent className="p-6">
                <Textarea
                  placeholder="Leave a comment (recommended for rejection)…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="bg-black/30 border-white/10 text-white min-h-[100px] mb-6 focus-visible:ring-primary/50"
                  autoFocus
                  disabled={!!acting}
                />
                <div className="flex gap-4">
                  <Button variant="outline"
                    className="flex-1 bg-transparent hover:bg-destructive/10 text-destructive border-destructive/30 hover:border-destructive"
                    onClick={() => handleAction("reject")}
                    disabled={!!acting}>
                    {acting === "reject"
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <XCircle className="w-4 h-4 mr-2" />}
                    Reject Expense
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg"
                    onClick={() => handleAction("approve")}
                    disabled={!!acting}>
                    {acting === "approve"
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Approve Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Receipt */}
        <div className="space-y-6">
          <Card className="glass-panel border-white/5 sticky top-24">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" /> Receipt
              </h3>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 min-h-[300px] flex items-center justify-center group relative cursor-pointer">
                {expense.receipt_url ? (
                  <>
                    <img src={expense.receipt_url} alt="Receipt"
                      className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
                          Open Full Size
                        </Button>
                      </a>
                    </div>
                  </>
                ) : (
                  <p className="text-white/30 text-sm">No receipt attached.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}