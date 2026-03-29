import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // 1) Login → get JWT
      const loginRes = await api.post("/auth/login", data);
      const token = loginRes.data.access_token;
      if (!token) throw new Error("No access token received");

      // Temporarily store so /users/me interceptor picks it up
      localStorage.setItem("token", token);

      // 2) Fetch current user
      // /users/me returns: { id, name, email, role, company_id, manager_id, is_manager_approver }
      const meRes = await api.get("/users/me");
      const user = meRes.data;

      // 3) Persist auth state via zustand store
      login(user, token);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name || user.email}`,
      });

      // 4) Redirect by role (backend returns uppercase roles)
      const role = user.role?.toUpperCase();
      if (role === "ADMIN") navigate("/admin");
      else if (role === "MANAGER") navigate("/manager");
      else navigate("/employee");
    } catch (err) {
      console.error("Login error:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast({
        variant: "destructive",
        title: "Login Failed",
        description:
          err.response?.data?.detail || "Invalid credentials. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden py-12">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-10">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] mb-6">
            <span className="text-white font-bold text-xl font-heading">R</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/50 text-base">Sign in to manage your reimbursements.</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="glass-panel p-8 rounded-2xl flex flex-col gap-6 w-full relative"
        >
          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-white/80">Work Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@company.com"
              className={`bg-black/20 border-white/5 text-white placeholder:text-white/20 focus-visible:ring-primary ${errors.email ? "border-destructive/50" : ""}`}
              {...register("email")}
            />
            {errors.email && <p className="text-destructive text-xs font-medium">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <button type="button" className="text-xs text-accent hover:underline underline-offset-4">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`bg-black/20 border-white/5 text-white placeholder:text-white/20 focus-visible:ring-primary pr-10 ${errors.password ? "border-destructive/50" : ""}`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs font-medium">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold py-6 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] border-t border-white/20"
          >
            {loading ? "Signing in…" : "Sign In"}
          </Button>

          <p className="text-center text-sm text-white/50 mt-4">
            Don&apos;t have a workspace?{" "}
            <Link to="/signup" className="text-accent hover:underline underline-offset-4">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}