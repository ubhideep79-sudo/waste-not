import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import {
  UtensilsCrossed,
  ShieldCheck,
  ChefHat,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  Mail,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState<string>("manager@wastenot.com");
  const [password, setPassword] = useState<string>("Manager@123");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    try {
      await login(email, password);
      toast.success("Login successful! Welcome to Waste Not, Want Not.");
    } catch (err: any) {
      setErrorMessage(
        err.message || "Invalid credentials. Please verify your email and password."
      );
    }
  };

  const handleDemoFill = (role: "manager" | "staff") => {
    if (role === "manager") {
      setEmail("manager@wastenot.com");
      setPassword("Manager@123");
    } else {
      setEmail("chef@wastenot.com");
      setPassword("Chef@123");
    }
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#12372A] text-[#F2C94C] shadow-lg mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#12372A] font-display tracking-tight">
          Waste Not, Want Not
        </h1>
        <p className="text-xs text-[#52796F] mt-1 font-medium">
          Food Waste Control & Cost-Saving System for Hotel Kitchens
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          BCA Final-Year Academic Project · Grand Horizon Palace
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-card rounded-2xl border border-[#D5DDD8]">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#12372A] mb-1">
                Hotel Staff Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@wastenot.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 pl-8 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-[#12372A] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 pl-8 pr-9 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-[#12372A] hover:bg-[#1E4D3A] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#2D6A4F] transition-colors disabled:opacity-60"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 text-[#F2C94C]" />
              )}
              <span>{isLoading ? "Authenticating..." : "Sign In to Kitchen"}</span>
            </button>
          </form>

          {/* 1-Click Evaluation Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-[#EAEFE9]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase font-bold text-[#52796F] tracking-wider">
                1-Click Evaluator Demo Logins
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#F2C94C]" />
            </div>

            <p className="text-[11px] text-[#637C71] mb-3 leading-relaxed">
              Use these seeded final-year demonstration accounts to test both manager & staff interfaces:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill("manager")}
                className="flex flex-col items-start p-2.5 rounded-lg border border-[#D5DDD8] bg-[#FAF9F5] hover:bg-[#EAEFE9] transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#12372A]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>Executive Chef</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 truncate w-full">
                  manager@wastenot.com
                </span>
                <span className="text-[9px] text-[#2D6A4F] font-semibold mt-1">
                  Manager Permissions
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill("staff")}
                className="flex flex-col items-start p-2.5 rounded-lg border border-[#D5DDD8] bg-[#FAF9F5] hover:bg-[#EAEFE9] transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#12372A]">
                  <ChefHat className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>Sous Chef Priya</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5 truncate w-full">
                  chef@wastenot.com
                </span>
                <span className="text-[9px] text-[#2D6A4F] font-semibold mt-1">
                  Kitchen Staff Role
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Deployment notice */}
        <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
          Production Security: Store real passwords as bcrypt hashes via backend seed. Set <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">SEED_DEMO=false</code> in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env</code> before public hosting.
        </p>
      </div>
    </div>
  );
};
