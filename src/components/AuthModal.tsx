import { useState, useCallback, memo } from "react";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = "signin" | "signup";

const AuthModal = memo(({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp } = useAuth();

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (mode === "signup" && !formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, mode]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      setLoading(true);

      try {
        if (mode === "signin") {
          await signIn(formData.email, formData.password);
        } else {
          await signUp(formData.email, formData.password, formData.fullName);
        }
        onClose();
        setFormData({ email: "", password: "", fullName: "" });
        setErrors({});
      } catch (error: any) {
        setErrors({
          submit:
            error.message ||
            `Failed to ${mode === "signin" ? "sign in" : "create account"}`,
        });
      } finally {
        setLoading(false);
      }
    },
    [formData, mode, validateForm, signIn, signUp, onClose]
  );

  const switchMode = useCallback(() => {
    setMode((prev) => (prev === "signin" ? "signup" : "signin"));
    setErrors({});
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setFormData({ email: "", password: "", fullName: "" });
    setErrors({});
    setMode("signin");
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/5 backdrop-blur-xl">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-slate-300 text-sm">
              {mode === "signin"
                ? "Sign in to your account"
                : "Join Zakaria's BookShop today"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 bg-white/5 backdrop-blur-xl"
        >
          {/* Full Name (Sign Up only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className={`w-full px-3 py-3 bg-white/10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-white placeholder-slate-400 ${
                  errors.fullName ? "border-red-500" : "border-white/20"
                }`}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.fullName && (
                <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full px-3 py-3 bg-white/10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-white placeholder-slate-400 ${
                errors.email ? "border-red-500" : "border-white/20"
              }`}
              placeholder="Enter your email"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`w-full px-3 py-3 bg-white/10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors pr-10 text-white placeholder-slate-400 ${
                  errors.password ? "border-red-500" : "border-white/20"
                }`}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {mode === "signin" ? "Signing In..." : "Creating Account..."}
                </span>
              </>
            ) : (
              <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
            )}
          </button>

          {/* Mode Switch */}
          <div className="text-center">
            <p className="text-slate-300 text-sm">
              {mode === "signin"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                className="text-purple-400 hover:text-purple-300 font-medium"
                disabled={loading}
              >
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>

          {/* Admin Note */}
          {mode === "signin" && (
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
              <p className="text-blue-300 text-sm text-center">
                <strong>Admin Access:</strong> Use your admin credentials to
                access the management panel
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
});

AuthModal.displayName = "AuthModal";

export default AuthModal;
