import { useState } from "react";
import { format } from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Users, TrendingUp, DollarSign, GripVertical, Plus, Check } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// --- DND Sortable Item Component ---
function SortableApproverItem({ id, approver, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 mb-2 bg-black/40 border border-white/10 rounded-lg group hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="text-white/30 hover:text-white cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5" />
        </button>
        <Avatar className="w-8 h-8 border border-white/10">
          <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">{approver.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-white">{approver.name}</p>
          <p className="text-xs text-white/40">{approver.role}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onRemove(id)} className="text-white/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
        Remove
      </Button>
    </div>
  );
}

// --- Main Admin Dashboard ---
export default function AdminDashboard() {
  const { toast } = useToast();
  
  // Mock Data
  const [users, setUsers] = useState([
    { id: "U-001", name: "Sarah Connor", email: "sarah@acme.com", role: "ADMIN", status: "Active", joined: "2026-01-15T00:00:00Z" },
    { id: "U-002", name: "John Smith", email: "john@acme.com", role: "MANAGER", status: "Active", joined: "2026-02-10T00:00:00Z" },
    { id: "U-003", name: "Emily Davis", email: "emily@acme.com", role: "EMPLOYEE", status: "Active", joined: "2026-03-05T00:00:00Z" },
  ]);

  // Approval Chain State
  const availableApprovers = users.filter(u => u.role === "MANAGER" || u.role === "ADMIN");
  const [approverChain, setApproverChain] = useState([{ id: "U-002", ...users[1] }]);
  const [hybridMode, setHybridMode] = useState(false);
  const [threshold, setThreshold] = useState("100");
  const [loading, setLoading] = useState(false);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setApproverChain((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addApprover = (userId) => {
    if (approverChain.find(a => a.id === userId)) {
      toast({ variant: "destructive", title: "Already in chain", description: "This approver is already in the sequence." });
      return;
    }
    const user = availableApprovers.find(a => a.id === userId);
    setApproverChain([...approverChain, user]);
  };

  const removeApprover = (userId) => {
    setApproverChain(approverChain.filter(a => a.id !== userId));
  };

  const saveRules = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API
    toast({
      title: "Approval Rules Updated",
      description: "New workflow logic is now active for all employees.",
    });
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Company Overview</h1>
        <p className="text-white/50">Manage users, view total spend, and configure approval workflows.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-primary" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">Total Spend</p>
            <h3 className="text-3xl font-bold text-white">$45,231.89</h3>
            <p className="text-xs font-medium text-green-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass border-white/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">Pending Requests</p>
            <h3 className="text-3xl font-bold text-yellow-400">14</h3>
            <p className="text-xs text-white/40 mt-2">Awaiting manager review</p>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">Approved (MTD)</p>
            <h3 className="text-3xl font-bold text-green-500">128</h3>
            <p className="text-xs text-white/40 mt-2">Processed this month</p>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">Total Users</p>
            <h3 className="text-3xl font-bold text-white">45</h3>
            <p className="text-xs text-white/40 mt-2">Active accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* User Management */}
        <div className="xl:col-span-2 glass-panel rounded-2xl border-white/5 p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> User Management
            </h2>
            <Button size="sm" className="bg-primary/20 text-primary hover:bg-primary/30 shadow-none border-0">
              <Plus className="w-4 h-4 mr-1" /> Invite User
            </Button>
          </div>

          <Table>
            <TableHeader className="bg-white/5 border-b border-white/5">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-white/60 py-3">User</TableHead>
                <TableHead className="text-white/60 py-3">Role</TableHead>
                <TableHead className="text-white/60 py-3">Status</TableHead>
                <TableHead className="text-white/60 py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border-none bg-primary/20">
                        <AvatarFallback className="text-primary text-xs font-bold">{u.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <p className="text-xs text-white/40">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className={`bg-transparent ${
                      u.role === 'ADMIN' ? 'border-primary/50 text-primary' : 
                      u.role === 'MANAGER' ? 'border-accent/50 text-accent' : 
                      'border-white/20 text-white/60'
                    }`}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 shadow-none border-0">
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/10">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Approval Rules Builder */}
        <div className="glass-panel rounded-2xl border-white/5 p-6 shadow-2xl flex flex-col h-full bg-gradient-to-b from-[#14161f]/80 to-[#1a1d27]/90">
          <div className="mb-6">
            <h2 className="text-xl font-heading font-bold text-white mb-1">Approval Workflow</h2>
            <p className="text-xs text-white/50">Configure how expenses get approved.</p>
          </div>

          <div className="space-y-6 flex-1">
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/5">
              <div>
                <Label className="text-white font-semibold mb-1 block">Hybrid Mode</Label>
                <p className="text-xs text-white/40">Require both sequential and threshold rules</p>
              </div>
              <Switch checked={hybridMode} onCheckedChange={setHybridMode} className="data-[state=checked]:bg-primary" />
            </div>

            {hybridMode && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label className="text-white/80">Approval Threshold (%)</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={threshold} 
                    onChange={(e) => setThreshold(e.target.value)}
                    className="flex-1 accent-primary bg-white/10" 
                  />
                  <span className="text-primary font-bold min-w-[3rem] text-right">{threshold}%</span>
                </div>
                <p className="text-xs text-white/40">Percentage of assigned managers needed.</p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-white/80 flex justify-between items-end">
                <span>Approver Sequence</span>
                <span className="text-xs text-primary/70 font-normal">Drag to reorder</span>
              </Label>
              
              <div className="bg-black/20 p-2 rounded-xl border border-white/5 min-h-[150px]">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={approverChain} strategy={verticalListSortingStrategy}>
                    {approverChain.length === 0 ? (
                      <div className="text-center p-6 text-white/30 text-sm">No approvers in chain.</div>
                    ) : (
                      approverChain.map((approver) => (
                        <SortableApproverItem key={approver.id} id={approver.id} approver={approver} onRemove={removeApprover} />
                      ))
                    )}
                  </SortableContext>
                </DndContext>
              </div>

              <div className="flex gap-2">
                <Select onValueChange={addApprover} value="">
                  <SelectTrigger className="bg-black/40 border-white/10 text-white flex-1 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Add approver..." />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white">
                    {availableApprovers.filter(a => !approverChain.find(ac => ac.id === a.id)).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name} ({a.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10">
            <Button 
              className="w-full bg-gradient-to-r from-primary to-accent text-white font-bold py-6 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:scale-[1.02]"
              onClick={saveRules}
              disabled={loading}
            >
              <Check className="w-5 h-5 mr-2" />
              {loading ? "Saving workflow..." : "Save Workflow Rules"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
