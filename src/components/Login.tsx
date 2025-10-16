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
            "Magaca isticmaalaha ama furaha sirta ah ayaa qaldan - Invalid email or password"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-3 sm:p-4">
      {/* Floating Background Elements - Hidden on mobile for performance */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hidden sm:block absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div
          className="hidden sm:block absolute top-3/4 right-1/4 w-36 sm:w-72 h-36 sm:h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="hidden sm:block absolute bottom-1/4 left-1/3 w-40 sm:w-80 h-40 sm:h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Main Login Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 animate-scaleIn">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-75"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 shadow-lg">
                <BookOpen className="w-12 h-12 text-white mx-auto" />
              </div>
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Hassan Muse BookShop
            </h1>
            <p className="text-slate-600 font-medium mt-2">
              Gal Nidaamka - Staff Login System
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                📧 Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials({ ...credentials, email: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/25 focus:border-blue-500 transition-all duration-300 bg-white/50"
                  placeholder="Enter your email..."
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                🔒 Password - Furaha Sirta ah
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/25 focus:border-blue-500 transition-all duration-300 bg-white/50"
                  placeholder="Enter your password..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
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
        </div>

        {/* Staff Accounts Info */}
        {/* <div className="mt-6 bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 p-6 animate-fadeIn">
          <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">
            👥 Staff Accounts - Akoonada Shaqaalaha
          </h3>
          <div className="space-y-3">
            {staffAccounts.map((account, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white/40 rounded-lg border border-white/30"
              >
                <div>
                  <p className="font-semibold text-slate-800">{account.name}</p>
                  <p className="text-sm text-slate-600">{account.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-slate-700">
                    {account.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-sm text-slate-600">
            <p>📱 Contact Zakaria for password details</p>
            <p className="text-xs mt-1">
              La xiriir Zakaria si aad u hesho furaha sirta ah
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
