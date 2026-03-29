import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR" },
  { code: "EU", name: "European Union", flag: "🇪🇺", currency: "EUR" },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY" },
];

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  country: z.string().min(2, "Please select a country"),
});

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { country: "" },
  });

  // Register the Select manually since it's a controlled Shadcn component
  useEffect(() => {
    register("country");
  }, [register]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/signup", data);
      const { user, token } = res.data;
      login(user, token);
      
      toast({
        title: "Account Created!",
        description: `Welcome aboard, ${user.name}`,
      });
      
      navigate("/admin");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: err.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden py-12">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg p-8 relative z-10">
        <div className="text-center mb-10">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] mb-6">
            <span className="text-white font-bold text-xl font-heading">R</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Create an Account</h1>
          <p className="text-white/50 text-base">Setup your company workspace & administrator profile.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-panel p-8 rounded-2xl flex flex-col gap-6 w-full relative">
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-white/80">Full Name</Label>
            <Input
              id="name"
              placeholder="Jane Doe"
              className={`bg-black/20 border-white/5 text-white placeholder:text-white/20 focus-visible:ring-primary ${
                errors.name ? "border-destructive/50 focus-visible:ring-destructive" : ""
              }`}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-destructive text-xs font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-white/80">Work Email Address</Label>
            <Input
              id="email"
              placeholder="jane@company.com"
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
            <Label htmlFor="password" className="text-white/80">Password</Label>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="country" className="text-white/80">Company Headquarters</Label>
            <Select onValueChange={(val) => setValue("country", val)}>
              <SelectTrigger className={`bg-black/20 border-white/5 w-full text-white placeholder:text-white/20 focus-visible:ring-primary ${errors.country ? "border-destructive/50" : ""}`}>
                <SelectValue placeholder="Select a location..." />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 text-white">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="hover:bg-white/5 focus:bg-white/10 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.flag}</span>
                      <span>{c.name}</span>
                      <span className="text-white/40 ml-2">({c.currency})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-destructive text-xs font-medium">{errors.country.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full mt-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold py-6 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] border-t border-white/20"
            disabled={loading}
          >
            {loading ? "Creating workspace..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-white/50 mt-4">
            Already have an workspace?{" "}
            <Link to="/login" className="text-accent hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
