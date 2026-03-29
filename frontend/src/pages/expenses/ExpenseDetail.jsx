import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, XCircle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";

// Mock Expense Data
const expenseData = {
  id: "EXP-101",
  title: "Client Dinner - Q3 Kickoff",
  amount: 450.00,
  currency: "USD",
  category: "Food",
  status: "PENDING",
  date: "2026-03-24T18:30:00Z",
  description: "Hosted 5 clients from Acme Corp at Prime Steakhouse.",
  receiptUrl: "https://images.unsplash.com/photo-1554672408-72b2172782c5?auto=format&fit=crop&q=80&w=600&h=800",
  employee: {
    name: "Emily Davis",
    email: "emily@acme.com",
    role: "EMPLOYEE"
  },
  timeline: [
    {
      id: "t1",
      step: "Submitted",
      user: { name: "Emily Davis", role: "EMPLOYEE" },
      status: "COMPLETED",
      date: "2026-03-25T09:00:00Z",
      comment: ""
    },
    {
      id: "t2",
      step: "Manager Review",
      user: { name: "John Smith", role: "MANAGER" },
      status: "COMPLETED",
      date: "2026-03-25T14:30:00Z",
      comment: "Looks good, approved."
    },
    {
      id: "t3",
      step: "Final Admin Approval",
      user: { name: "Sarah Connor", role: "ADMIN" },
      status: "PENDING",
      date: null,
      comment: ""
    }
  ]
};

export default function ExpenseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [timeline, setTimeline] = useState(expenseData.timeline);
  const [status, setStatus] = useState(expenseData.status);

  // Check if current user is the next pending approver
  const currentPendingStep = timeline.find(t => t.status === "PENDING");
  const canApprove = currentPendingStep && currentPendingStep.user.role === user?.role;

  const handleAction = (action) => {
    const updated = timeline.map(t => {
      if (t.id === currentPendingStep.id) {
        return {
          ...t,
          status: action,
          date: new Date().toISOString(),
          comment: comment || (action === "REJECTED" ? "Rejected automatically" : "Approved")
        };
      }
      return t;
    });
    setTimeline(updated);
    setStatus(action === "REJECTED" ? "REJECTED" : "APPROVED");
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <Button variant="ghost" className="mb-6 -ml-4 text-white/50 hover:text-white" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-5 h-5 mr-2" /> Back
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading font-bold text-white">{expenseData.title}</h1>
            <Badge className={
              status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
              status === 'REJECTED' ? 'bg-red-500/20 text-red-500' :
              'bg-yellow-500/20 text-yellow-500'
            }>{status}</Badge>
          </div>
          <p className="text-white/50 flex items-center gap-2">
            Requested by <span className="font-medium text-white/80">{expenseData.employee.name}</span> • {new Date(expenseData.date).toLocaleDateString()}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">Total Amount</p>
          <div className="text-4xl font-extrabold text-primary drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            ${expenseData.amount.toFixed(2)} <span className="text-xl text-white/30">{expenseData.currency}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Timeline */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass-panel border-white/5">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-white mb-6 border-b border-white/5 pb-4">Expense Details</h3>
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <p className="text-sm text-white/40 mb-1">Category</p>
                  <p className="font-medium text-white">{expenseData.category}</p>
                </div>
                <div>
                  <p className="text-sm text-white/40 mb-1">Transaction ID</p>
                  <p className="font-medium text-white">{id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-white/40 mb-1">Description</p>
                  <p className="text-white/80 leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5">{expenseData.description}</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-6 border-b border-white/5 pb-4 mt-8">Approval History</h3>
              
              {/* Vertical Timeline Stepper */}
              <div className="relative pl-6 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                <div className="absolute left-[11px] top-4 bottom-4 w-px bg-white/10" />
                
                {timeline.map((step, idx) => (
                  <div key={step.id} className="relative z-10">
                    <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#14161f] ${
                      step.status === 'COMPLETED' ? 'bg-green-500' :
                      step.status === 'REJECTED' ? 'bg-red-500' :
                      'bg-yellow-500 animate-pulse'
                    }`}>
                      {step.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4 text-[#14161f]" /> :
                       step.status === 'REJECTED' ? <XCircle className="w-4 h-4 text-[#14161f]" /> :
                       <Clock className="w-4 h-4 text-[#14161f]" />}
                    </div>

                    <div className="glass p-5 rounded-xl border border-white/10 relative transition-transform hover:-translate-y-1 hover:shadow-xl hover:border-primary/30">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className={`font-semibold ${
                            step.status === 'COMPLETED' ? 'text-green-400' :
                            step.status === 'REJECTED' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>{step.step}</p>
                          <p className="text-sm text-white/70">by {step.user.name}</p>
                        </div>
                        {step.date && <p className="text-xs text-white/40">{new Date(step.date).toLocaleString([], {hour: '2-digit', minute:'2-digit', month:'short', day:'numeric'})}</p>}
                      </div>
                      {step.comment && (
                        <div className="mt-3 text-sm text-white/60 bg-black/30 p-3 rounded border border-white/5 italic flex gap-2">
                          <span className="text-primary opacity-50 block mt-1">"</span>
                          {step.comment}
                          <span className="text-primary opacity-50 block mt-auto">"</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Panel for Approver */}
          {canApprove && (
            <Card className="glass-panel border-primary/30 shadow-[0_0_30px_rgba(99,102,241,0.15)] overflow-hidden">
              <div className="bg-primary/20 p-4 border-b border-primary/30">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Your Approval Required
                </h3>
              </div>
              <CardContent className="p-6">
                <Textarea 
                  placeholder="Leave a comment (mandatory for rejection)..." 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="bg-black/30 border-white/10 text-white min-h-[100px] mb-6 focus-visible:ring-primary/50"
                  autoFocus
                />
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 bg-transparent hover:bg-destructive/10 text-destructive border-destructive/30 hover:border-destructive"
                    onClick={() => handleAction("REJECTED")}
                  >
                    Reject Expense
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg"
                    onClick={() => handleAction("COMPLETED")}
                  >
                    Approve Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Receipt */}
        <div className="space-y-6">
          <Card className="glass-panel border-white/5 sticky top-24">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Receipt Document
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white bg-white/5 hover:bg-white/10">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 min-h-[300px] flex items-center justify-center group relative cursor-pointer">
                {expenseData.receiptUrl ? (
                  <>
                    <img 
                      src={expenseData.receiptUrl} 
                      alt="Receipt" 
                      className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">Enlarge Image</Button>
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
