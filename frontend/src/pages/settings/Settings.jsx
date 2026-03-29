import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Save, Key, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = (e) => {
    e.preventDefault();
    toast({
      title: "Settings Saved",
      description: "Your profile information has been updated successfully.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Account Settings</h1>
        <p className="text-white/50">Manage your profile and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="glass-panel border-white/5 bg-gradient-to-br from-primary/10 to-accent/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Building2 className="w-24 h-24 text-primary" />
            </div>
            <CardHeader>
              <CardTitle className="text-white text-lg">Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1">Organization</p>
                <p className="font-medium text-white">Acme Corp</p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1">Role</p>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                  {user?.role || "Employee"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel border-white/5 shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription className="text-white/50">Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center gap-6 mb-8">
                  <Avatar className="h-20 w-20 border-2 border-primary/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <AvatarFallback className="bg-primary/20 text-xl font-bold text-primary">
                      {user?.name?.split(' ').map(n=>n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" type="button" className="bg-white/5 border-white/10 hover:bg-white/10 text-white">
                    Change Avatar
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white/80">Full Name</Label>
                    <Input defaultValue={user?.name || ""} className="bg-black/20 border-white/10 text-white focus-visible:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Email Address</Label>
                    <Input defaultValue={user?.email || ""} disabled className="bg-black/40 border-white/5 text-white/50 cursor-not-allowed" />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" /> Change Password
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white/80">Current Password</Label>
                      <Input type="password" placeholder="••••••••" className="bg-black/20 border-white/10 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-white/80">New Password</Label>
                        <Input type="password" placeholder="••••••••" className="bg-black/20 border-white/10 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/80">Confirm New Password</Label>
                        <Input type="password" placeholder="••••••••" className="bg-black/20 border-white/10 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-white shadow-lg">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
