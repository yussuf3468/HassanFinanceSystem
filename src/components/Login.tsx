import { useState } from "react";
import { Eye, EyeOff, BookOpen, Lock, User } from "lucide-react";
import { supabase } from "../lib/supabase";

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError(
            "Magaca isticmaalaha ama furaha sirta ah ayaa qaldan - Invalid email or password",
          );
        } else {
          setError("Khalad ayaa dhacay - An error occurred: " + error.message);
        }
        return;
      }

      if (data.user) {
        onLogin(data.user);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Khalad ayaa dhacay - Network error occurred");
    } finally {
      setLoading(false);
    }
  }

  //   const staffAccounts = [
  //     { name: "Hassan (Owner)", role: "Manager", email: "hassan@bookshop.ke" },
  //     { name: "Zakaria", role: "Staff", email: "zakaria@bookshop.ke" },
  //     { name: "Khaled", role: "Staff", email: "khaled@bookshop.ke" },
  //   ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-3 sm:p-4 transition-colors duration-200">
      {/* Floating Background Elements - Hidden on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hidden sm:block absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-amber-200 dark:bg-amber-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-50 animate-float"></div>
        <div
          className="hidden sm:block absolute top-3/4 right-1/4 w-36 sm:w-72 h-36 sm:h-72 bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-50 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="hidden sm:block absolute bottom-1/4 left-1/3 w-40 sm:w-80 h-40 sm:h-80 bg-slate-200 dark:bg-slate-700/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-50 animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Main Login Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-8 animate-scaleIn transition-colors duration-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-2xl blur opacity-50"></div>
              <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 border-2 border-amber-400 dark:border-amber-500 rounded-2xl p-4 shadow-lg">
                <BookOpen className="w-12 h-12 text-white mx-auto" />
              </div>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              HORUMAR
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium mt-2">
              Gal Nidaamka - Staff Login System
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-rose-800 dark:text-red-400 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                📧 Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
                <input
                  type="email"
                  required
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials({ ...credentials, email: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-amber-500/25 focus:border-amber-500 dark:focus:border-amber-600 transition-all duration-300 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Enter your email..."
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                🔒 Password - Furaha Sirta ah
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-600 dark:text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-amber-500/25 focus:border-amber-500 dark:focus:border-amber-600 transition-all duration-300 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Enter your password..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 border-2 border-amber-400 text-white font-bold py-4 rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Ku soo galaya - Logging in...</span>
                </div>
              ) : (
                "Gal - Login"
              )}
            </button>
          </form>

          {/* Staff Access Notice */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300/70 dark:border-amber-700/50 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-1">
                    🔐 Staff Access Only
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Contact administrator if you need access
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold mt-1 italic">
                    La xiriir maamulaha haddii aad u baahato gelitaan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Credit Footer */}
        <div className="mt-8 pt-6 border-t-2 border-slate-200 dark:border-slate-700 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Powered by</span>
            <a
              href="https://horumarin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-stone-100 dark:from-amber-900/30 dark:to-stone-900/30 hover:from-amber-200 hover:to-stone-200 dark:hover:from-amber-900/50 dark:hover:to-stone-900/50 border border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600 rounded-md transition-all hover:scale-105 font-bold text-amber-800 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400"
            >
              <span>⚡</span>
              <span>Horumar</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
