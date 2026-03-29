import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  company_name: z.string().min(2, "Company name is required"),
  country: z.string().min(2, "Please select a country"),
  default_currency: z.string().min(1, "Currency is required"),
});

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      company_name: "",
      country: "",
      default_currency: "",
    },
  });

  const selectedCountry = watch("country");
  const selectedCurrency = watch("default_currency");

  // Register controlled fields manually for Shadcn Select
  useEffect(() => {
    register("country");
    register("default_currency");
  }, [register]);

  // Fetch countries from backend
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await api.get("/countries");
        setCountries(res.data || []);
      } catch (err) {
        console.error("Failed to load countries:", err);
        toast({
          variant: "destructive",
          title: "Failed to load countries",
          description: "Could not fetch country list from backend.",
        });
      }
    };

    fetchCountries();
  }, [toast]);

  // Remove duplicate countries
  const uniqueCountries = useMemo(() => {
    const seen = new Set();
    return countries.filter((c) => {
      if (!c.country || seen.has(c.country)) return false;
      seen.add(c.country);
      return true;
    });
  }, [countries]);

  // Auto-set currency when country changes
  useEffect(() => {
    if (!selectedCountry) return;

    const found = uniqueCountries.find((c) => c.country === selectedCountry);
    if (found) {
      setValue("default_currency", found.currency_code, {
        shouldValidate: true,
      });
    }
  }, [selectedCountry, uniqueCountries, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      // 1) Signup
      const signupRes = await api.post("/auth/signup", data);
      const token = signupRes.data.access_token;

      localStorage.setItem("token", token);

      // 2) Fetch current user
      const meRes = await api.get("/users/me");
      localStorage.setItem("user", JSON.stringify(meRes.data));

      toast({
        title: "Account Created!",
        description: `Welcome aboard, ${meRes.data.full_name}`,
      });

      // 3) Redirect by role
      if (meRes.data.role === "admin") navigate("/admin");
      else if (meRes.data.role === "manager") navigate("/manager");
      else navigate("/employee");

    } catch (err) {
      console.error("Signup error:", err);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description:
          err.response?.data?.detail ||
          "Something went wrong. Please try again.",
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
          <h1 className="text-4xl font-heading font-bold text-white mb-2">
            Create an Account
          </h1>
          <p className="text-white/50 text-base">
            Setup your company workspace & administrator profile.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="glass-panel p-8 rounded-2xl flex flex-col gap-6 w-full relative"
        >
          {/* Full Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name" className="text-white/80">
              Full Name
            </Label>
            <Input
              id="full_name"
              placeholder="Jane Doe"
              className={`bg-black/20 border-white/5 text-white placeholder:text-white/20 focus-visible:ring-primary ${
                errors.full_name
                  ? "border-destructive/50 focus-visible:ring-destructive"
                  : ""
              }`}
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-destructive text-xs font-medium">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-white/80">
              Work Email Address
            </Label>
            <Input
              id="email"
              placeholder="jane@company.com"
              className={`bg-black/20 border-white/5 text-white placeholder:text-white/20 focus-visible:ring-primary ${
                errors.email
                  ? "border-destructive/50 focus-visible:ring-destructive"
                  : ""
              }`}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-destructive text-xs font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-white/80">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className={`bg-black/20 border-white/5 text-white placeholder:text-white/20 focus-visible:ring-primary ${
                errors.password
                  ? "border-destructive/50 focus-visible:ring-destructive"
                  : ""
              }`}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-xs font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Company Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="company_name" className="text-white/80">
              Company Name
            </Label>
            <Input
              id="company_name"
              placeholder="ABC Corp"
              className={`bg-black/20 border-white/5 text-white placeholder:text-white/20 focus-visible:ring-primary ${
                errors.company_name
                  ? "border-destructive/50 focus-visible:ring-destructive"
                  : ""
              }`}
              {...register("company_name")}
            />
            {errors.company_name && (
              <p className="text-destructive text-xs font-medium">
                {errors.company_name.message}
              </p>
            )}
          </div>

          {/* Company Country */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="country" className="text-white/80">
              Company Country
            </Label>
            <Select
              value={selectedCountry}
              onValueChange={(val) =>
                setValue("country", val, { shouldValidate: true })
              }
            >
              <SelectTrigger
                className={`bg-black/20 border-white/5 w-full text-white placeholder:text-white/20 focus-visible:ring-primary ${
                  errors.country ? "border-destructive/50" : ""
                }`}
              >
                <SelectValue placeholder="Select a location..." />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 text-white max-h-64 overflow-y-auto">
                {uniqueCountries.map((c, index) => (
                  <SelectItem
                    key={index}
                    value={c.country}
                    className="hover:bg-white/5 focus:bg-white/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>{c.country}</span>
                      <span className="text-white/40 ml-2">
                        ({c.currency_code})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-destructive text-xs font-medium">
                {errors.country.message}
              </p>
            )}
          </div>

          {/* Default Currency */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="default_currency" className="text-white/80">
              Default Currency
            </Label>
            <Input
              id="default_currency"
              value={selectedCurrency || ""}
              readOnly
              placeholder="Auto-filled from country"
              className={`bg-black/20 border-white/5 text-white placeholder:text-white/20 focus-visible:ring-primary ${
                errors.default_currency
                  ? "border-destructive/50 focus-visible:ring-destructive"
                  : ""
              }`}
            />
            {errors.default_currency && (
              <p className="text-destructive text-xs font-medium">
                {errors.default_currency.message}
              </p>
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