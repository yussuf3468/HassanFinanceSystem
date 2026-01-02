import { useState, useCallback, memo } from "react";
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = memo(({ isOpen, onClose }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn } = useAuth();

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      setLoading(true);

      try {
        await signIn(formData.email, formData.password);
        onClose();
        setFormData({ email: "", password: "" });
        setErrors({});
      } catch (error: any) {
        setErrors({
          submit: error.message || "Failed to sign in",
        });
      } finally {
        setLoading(false);
      }
    },
    [formData, validateForm, signIn, onClose]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setFormData({ email: "", password: "" });
    setErrors({});
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-2 border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-slate-200 bg-amber-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Staff Access</h2>
            <p className="text-slate-600 text-sm">
              Administrator and staff login
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-amber-100 rounded-xl transition-colors text-slate-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full px-3 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-slate-900 placeholder-slate-400 ${
                errors.email ? "border-red-500" : "border-slate-200"
              }`}
              placeholder="Enter your email"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`w-full px-3 py-3 bg-white border-2 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors pr-10 text-slate-900 placeholder-slate-400 ${
                  errors.password ? "border-red-500" : "border-slate-200"
                }`}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 hover:text-slate-900"
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
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-3">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 border-2 border-amber-400 text-white py-3 px-4 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>

          {/* Staff Access Notice */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 mb-1">
                  🔐 Staff Access Only
                </h4>
                <p className="text-sm text-amber-800">
                  Contact administrator if you need access
                </p>
                <p className="text-xs text-amber-800 font-semibold mt-1 italic">
                  La xiriir maamulaha haddii aad u baahato gelitaan
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

AuthModal.displayName = "AuthModal";

export default AuthModal;
