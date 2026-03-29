import { useEffect, useMemo, useState } from "react";
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
import {
  Users,
  TrendingUp,
  DollarSign,
  GripVertical,
  Plus,
  Check,
} from "lucide-react";

import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
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
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- DND Sortable Item Component ---
function SortableApproverItem({ id, approver, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 mb-2 bg-black/40 border border-white/10 rounded-lg group hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="text-white/30 hover:text-white cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <Avatar className="w-8 h-8 border border-white/10">
          <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
            {approver.full_name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>

        <div>
          <p className="text-sm font-semibold text-white">
            {approver.full_name}
          </p>
          <p className="text-xs text-white/40 uppercase">{approver.role}</p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(id)}
        className="text-white/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Remove
      </Button>
    </div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [approverChain, setApproverChain] = useState([]);
  const [hybridMode, setHybridMode] = useState(false);
  const [threshold, setThreshold] = useState("100");
  const [loading, setLoading] = useState(false);

  // Create/Edit Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [savingUser, setSavingUser] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "",
    manager_id: "",
    is_manager_approver: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.get("/users");
      const fetchedUsers = Array.isArray(res.data) ? res.data : [];
      setUsers(fetchedUsers);

      const initialApprovers = fetchedUsers.filter(
        (u) =>
          u.role?.toLowerCase() === "manager" ||
          u.role?.toLowerCase() === "admin"
      );

      if (initialApprovers.length > 0 && approverChain.length === 0) {
        setApproverChain([initialApprovers[0]]);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast({
        variant: "destructive",
        title: "Failed to load users",
        description: "Could not fetch user list from backend.",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const availableApprovers = useMemo(() => {
    return users.filter(
      (u) =>
        u.role?.toLowerCase() === "manager" ||
        u.role?.toLowerCase() === "admin"
    );
  }, [users]);

  const managers = useMemo(() => {
    return users.filter((u) => u.role?.toLowerCase() === "manager");
  }, [users]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setApproverChain((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addApprover = (userId) => {
    const parsedId = Number(userId);

    if (approverChain.find((a) => a.id === parsedId)) {
      toast({
        variant: "destructive",
        title: "Already in chain",
        description: "This approver is already in the sequence.",
      });
      return;
    }

    const user = availableApprovers.find((a) => a.id === parsedId);
    if (!user) return;

    setApproverChain([...approverChain, user]);
  };

  const removeApprover = (userId) => {
    setApproverChain(approverChain.filter((a) => a.id !== userId));
  };

  const saveRules = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    toast({
      title: "Approval Rules Updated",
      description: "Workflow UI updated successfully.",
    });

    setLoading(false);
  };

  // -------- USER CREATE / EDIT --------
  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({
      full_name: "",
      email: "",
      password: "",
      role: "",
      manager_id: "",
      is_manager_approver: false,
    });
    setOpenDialog(true);
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      password: "",
      role: user.role || "",
      manager_id: user.manager_id ? String(user.manager_id) : "",
      is_manager_approver: user.is_manager_approver || false,
    });
    setOpenDialog(true);
  };

  const handleSaveUser = async () => {
    if (!formData.full_name || !formData.role) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Full name and role are required.",
      });
      return;
    }

    if (!editingUser && (!formData.email || !formData.password)) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Email and password are required when creating a user.",
      });
      return;
    }

    try {
      setSavingUser(true);

      if (editingUser) {
        // PATCH /users/{id}
        await api.patch(`/users/${editingUser.id}`, {
          full_name: formData.full_name,
          role: formData.role,
          manager_id: formData.manager_id ? Number(formData.manager_id) : null,
          is_manager_approver: formData.is_manager_approver,
        });

        toast({
          title: "User updated",
          description: `${formData.full_name} was updated successfully.`,
        });
      } else {
        // POST /users
        await api.post("/users", {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          manager_id: formData.manager_id ? Number(formData.manager_id) : null,
          is_manager_approver: formData.is_manager_approver,
        });

        toast({
          title: "User created",
          description: `${formData.full_name} was added successfully.`,
        });
      }

      setOpenDialog(false);
      await fetchUsers();
    } catch (err) {
      console.error("Save user error:", err);
      toast({
        variant: "destructive",
        title: editingUser ? "Failed to update user" : "Failed to create user",
        description:
          err.response?.data?.detail ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">
          Company Overview
        </h1>
        <p className="text-white/50">
          Manage users, view total spend, and configure approval workflows.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-primary" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">
              Total Spend
            </p>
            <h3 className="text-3xl font-bold text-white">$45,231.89</h3>
            <p className="text-xs font-medium text-green-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">
              Pending Requests
            </p>
            <h3 className="text-3xl font-bold text-yellow-400">14</h3>
            <p className="text-xs text-white/40 mt-2">
              Awaiting manager review
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">
              Approved (MTD)
            </p>
            <h3 className="text-3xl font-bold text-green-500">128</h3>
            <p className="text-xs text-white/40 mt-2">Processed this month</p>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1">
              Total Users
            </p>
            <h3 className="text-3xl font-bold text-white">{users.length}</h3>
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
            <Button
              size="sm"
              className="bg-primary/20 text-primary hover:bg-primary/30 shadow-none border-0"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4 mr-1" /> Create User
            </Button>
          </div>

          <Table>
            <TableHeader className="bg-white/5 border-b border-white/5">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-white/60 py-3">User</TableHead>
                <TableHead className="text-white/60 py-3">Role</TableHead>
                <TableHead className="text-white/60 py-3">Status</TableHead>
                <TableHead className="text-white/60 py-3 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {usersLoading ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={4} className="py-8 text-center text-white/50">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={4} className="py-8 text-center text-white/40">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const initials = u.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2);

                  const role = u.role?.toLowerCase();

                  return (
                    <TableRow
                      key={u.id}
                      className="border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-none bg-primary/20">
                            <AvatarFallback className="text-primary text-xs font-bold">
                              {initials || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {u.full_name}
                            </p>
                            <p className="text-xs text-white/40">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <Badge
                          variant="outline"
                          className={`bg-transparent uppercase ${
                            role === "admin"
                              ? "border-primary/50 text-primary"
                              : role === "manager"
                              ? "border-accent/50 text-accent"
                              : "border-white/20 text-white/60"
                          }`}
                        >
                          {u.role}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-4">
                        <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 shadow-none border-0">
                          Active
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/40 hover:text-white hover:bg-white/10"
                          onClick={() => openEditDialog(u)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Approval Rules Builder */}
        <div className="glass-panel rounded-2xl border-white/5 p-6 shadow-2xl flex flex-col h-full bg-gradient-to-b from-[#14161f]/80 to-[#1a1d27]/90">
          <div className="mb-6">
            <h2 className="text-xl font-heading font-bold text-white mb-1">
              Approval Workflow
            </h2>
            <p className="text-xs text-white/50">
              Configure how expenses get approved.
            </p>
          </div>

          <div className="space-y-6 flex-1">
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/5">
              <div>
                <Label className="text-white font-semibold mb-1 block">
                  Hybrid Mode
                </Label>
                <p className="text-xs text-white/40">
                  Require both sequential and threshold rules
                </p>
              </div>
              <Switch
                checked={hybridMode}
                onCheckedChange={setHybridMode}
                className="data-[state=checked]:bg-primary"
              />
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
                  <span className="text-primary font-bold min-w-[3rem] text-right">
                    {threshold}%
                  </span>
                </div>
                <p className="text-xs text-white/40">
                  Percentage of assigned managers needed.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-white/80 flex justify-between items-end">
                <span>Approver Sequence</span>
                <span className="text-xs text-primary/70 font-normal">
                  Drag to reorder
                </span>
              </Label>

              <div className="bg-black/20 p-2 rounded-xl border border-white/5 min-h-[150px]">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={approverChain.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {approverChain.length === 0 ? (
                      <div className="text-center p-6 text-white/30 text-sm">
                        No approvers in chain.
                      </div>
                    ) : (
                      approverChain.map((approver) => (
                        <SortableApproverItem
                          key={approver.id}
                          id={approver.id}
                          approver={approver}
                          onRemove={removeApprover}
                        />
                      ))
                    )}
                  </SortableContext>
                </DndContext>
              </div>

              <div className="flex gap-2">
                <Select onValueChange={addApprover}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white flex-1 hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Add approver..." />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white">
                    {availableApprovers
                      .filter((a) => !approverChain.find((ac) => ac.id === a.id))
                      .map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.full_name} ({a.role})
                        </SelectItem>
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

      {/* Create / Edit User Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="glass-panel border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-white">
              {editingUser ? "Edit User" : "Create User"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-white/80">Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="bg-black/20 border-white/10 text-white"
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Email</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-black/20 border-white/10 text-white"
                placeholder="Enter email"
                disabled={!!editingUser}
              />
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label className="text-white/80">Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="bg-black/20 border-white/10 text-white"
                  placeholder="Enter password"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-white/80">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10 text-white">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === "employee" && (
              <div className="space-y-2">
                <Label className="text-white/80">Manager</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, manager_id: value })
                  }
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 text-white">
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4">
              <div>
                <Label className="text-white font-medium">
                  Is Manager Approver
                </Label>
                <p className="text-xs text-white/40 mt-1">
                  Whether this user's manager should approve their requests first
                </p>
              </div>
              <Switch
                checked={formData.is_manager_approver}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_manager_approver: checked })
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setOpenDialog(false)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveUser}
                disabled={savingUser}
                className="bg-gradient-to-r from-primary to-accent text-white"
              >
                {savingUser
                  ? editingUser
                    ? "Updating..."
                    : "Creating..."
                  : editingUser
                  ? "Update User"
                  : "Create User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}