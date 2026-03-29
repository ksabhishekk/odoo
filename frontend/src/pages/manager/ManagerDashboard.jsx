import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, X, FileText, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const initialQueue = [
  { id: "EXP-201", employee: { name: "Alice Smith", avatar: "" }, title: "Client Dinner", category: "Food", amount: 320.50, currency: "USD", submissionDate: "2026-03-27T10:00:00Z", receiptUrl: "https://images.unsplash.com/photo-1554672408-72b2172782c5?auto=format&fit=crop&q=80&w=200&h=200", status: "PENDING" },
  { id: "EXP-202", employee: { name: "Bob Johnson", avatar: "" }, title: "AWS Hosting", category: "Software", amount: 1540.00, currency: "USD", submissionDate: "2026-03-26T14:30:00Z", receiptUrl: "https://images.unsplash.com/photo-1554672408-72b2172782c5?auto=format&fit=crop&q=80&w=200&h=200", status: "PENDING" },
  { id: "EXP-203", employee: { name: "Charlie Davis", avatar: "" }, title: "New Desk Chair", category: "Equipment", amount: 499.99, currency: "USD", submissionDate: "2026-03-25T09:15:00Z", receiptUrl: "https://images.unsplash.com/photo-1554672408-72b2172782c5?auto=format&fit=crop&q=80&w=200&h=200", status: "PENDING" },
];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [queue, setQueue] = useState(initialQueue);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState({});

  const handleAction = (id, action) => {
    const item = queue.find(q => q.id === id);
    if (!item) return;

    const comment = comments[id] || "";
    
    // Move to history
    setQueue(queue.filter(q => q.id !== id));
    setHistory([{ ...item, status: action, reviewComment: comment, reviewedAt: new Date().toISOString() }, ...history]);
    
    const isApprove = action === "APPROVED";
    toast({
      title: isApprove ? "Expense Approved" : "Expense Rejected",
      description: `${item.id} has been ${action.toLowerCase()}.`,
      variant: isApprove ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Approval Queue</h1>
          <p className="text-white/50">Review and manage pending employee reimbursements.</p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-white/40" />
          <Input placeholder="Search expenses..." className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-white/30" />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-black/20 border border-white/10 p-1 mb-6">
          <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-white text-white/60">
            Pending Approvals ({queue.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
            Reviewed History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {queue.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border-white/5 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-white/20">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">All caught up!</h3>
              <p className="text-white/50">You have zero pending expenses to review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {queue.map(expense => (
                <Card key={expense.id} className="glass-panel border-white/5 overflow-hidden group transition-all hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)]">
                  <CardHeader className="p-0 relative h-32 w-full overflow-hidden bg-white/5 flex items-center justify-center border-b border-white/5">
                    {expense.receiptUrl ? (
                      <div 
                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105 opacity-60 mix-blend-screen"
                        style={{ backgroundImage: `url(${expense.receiptUrl})` }}
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-white/20" />
                    )}
                    <Badge className="absolute top-3 right-3 bg-yellow-500/80 text-white pointer-events-none hover:bg-yellow-500/80 shadow-lg backdrop-blur-md">
                      Pending
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarImage src={expense.employee.avatar} />
                          <AvatarFallback className="bg-primary/20 text-primary">{expense.employee.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white">{expense.employee.name}</p>
                          <p className="text-xs text-white/40">{new Date(expense.submissionDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg text-white truncate">{expense.title}</h3>
                    <div className="flex justify-between items-end mt-2">
                      <Badge variant="outline" className="border-white/10 text-white/60 bg-white/5">{expense.category}</Badge>
                      <span className="text-xl font-black text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                        ${expense.amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2">
                      <Textarea 
                        placeholder="Add a comment... (optional)" 
                        className="text-xs min-h-[60px] bg-black/40 border-white/10 resize-none text-white placeholder:text-white/30"
                        value={comments[expense.id] || ""}
                        onChange={(e) => setComments({...comments, [expense.id]: e.target.value})}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="p-5 pt-0 flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-white/10 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50 text-white/70 bg-black/40"
                      onClick={() => handleAction(expense.id, "REJECTED")}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white border-0 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                      onClick={() => handleAction(expense.id, "APPROVED")}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="glass-panel rounded-2xl border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 grid grid-cols-5 text-sm font-semibold text-white/50 px-6">
            <div className="col-span-2">Expense Details</div>
            <div>Employee</div>
            <div>Action</div>
            <div className="text-right">Amount</div>
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-white/40 text-sm">No history available yet.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.map(expense => (
                <div key={expense.id} className="grid grid-cols-5 items-center p-4 px-6 hover:bg-white/5 transition-colors group">
                  <div className="col-span-2">
                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">{expense.title}</h4>
                    <p className="text-xs text-white/40">{expense.id} • {new Date(expense.reviewedAt).toLocaleDateString()}</p>
                    {expense.reviewComment && (
                      <p className="text-xs text-white/60 mt-1 italic border-l-2 border-white/10 pl-2 ml-1">"{expense.reviewComment}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border-none">
                      <AvatarImage src={expense.employee.avatar} />
                      <AvatarFallback className="bg-primary/20 text-xs text-primary">{expense.employee.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white/80">{expense.employee.name}</span>
                  </div>
                  <div>
                    <Badge className={
                      expense.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      'bg-red-500/10 text-red-500 border border-red-500/20'
                    }>
                      {expense.status}
                    </Badge>
                  </div>
                  <div className="text-right font-medium text-white">
                    ${expense.amount.toFixed(2)}
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
