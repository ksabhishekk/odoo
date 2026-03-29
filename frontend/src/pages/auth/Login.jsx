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

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Use our mock interceptor fallback if backend is down
      const res = await api.post("/auth/login", data);
      
      const { user, token } = res.data;
      login(user, token);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });
      
      // Role redirection
      navigate(user.role === "ADMIN" ? "/admin" : user.role === "MANAGER" ? "/manager" : "/employee");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.response?.data?.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-10">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 mb-6">
            <span className="text-white font-bold text-xl font-heading">R</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/50 text-sm">Sign in to manage your reimbursements.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-panel p-8 rounded-2xl flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-white/80">Email Address</Label>
            <Input
              id="email"
              placeholder="you@company.com"
              className={`bg-black/20 border-white/5 text-white placeholder:text-white/20 focus-visible:ring-primary ${
                errors.email ? "border-destructive/50 focus-visible:ring-destructive" : ""
              }`}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-destructive text-xs font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className={`bg-black/20 border-white/5 text-white placeholder:text-white/20 focus-visible:ring-primary ${
                errors.password ? "border-destructive/50 focus-visible:ring-destructive" : ""
              }`}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-xs font-medium">{errors.password.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <p className="text-center text-sm text-white/50 mt-2">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
