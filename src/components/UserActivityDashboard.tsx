import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Clock,
  Calendar,
  Activity,
  UserCheck,
  UserX,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../utils/dateFormatter";

interface UserActivity {
  id: string;
  email: string;
  name: string;
  role: string;
  last_sign_in: string | null;
  created_at: string;
  is_online: boolean;
}

export default function UserActivityDashboard() {
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Check if current user is admin
  const isAdmin =
    user?.email?.includes("admin") || user?.email?.includes("yussuf");

  const fetchUserActivities = useCallback(async () => {
    if (!isAdmin) {
      console.log("User is not admin, skipping fetch");
      return;
    }

    if (loading) {
      console.log("Already loading, skipping fetch");
      return;
    }

    console.log("Starting to fetch user activities...");

    try {
      setLoading(true);
      setError(null);

      // Test connection first
      const { error: testError } = await supabase
        .from("profiles")
        .select("count", { count: "exact", head: true });

      if (testError) {
        console.error("Database connection test failed:", testError);
        setError(`Database connection failed: ${testError.message}`);
        return;
      }

      console.log("Database connection successful, fetching profiles...");

      // Simplified query with specific fields only
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, last_login, created_at")
        .limit(10); // Limit to prevent large data loads

      if (error) {
        console.error("Error fetching profiles:", error);
        setError(`Failed to fetch profiles: ${error.message}`);
        setUserActivities([]);
        return;
      }

      console.log(
        "Profiles fetched successfully:",
        profiles?.length || 0,
        "records"
      );

      // Type-safe mapping with fallbacks
      const activities: UserActivity[] = (profiles || []).map(
        (profile: any) => {
          const lastLogin = profile.last_login;
          const isOnline = lastLogin
            ? Date.now() - new Date(lastLogin).getTime() < 30 * 60 * 1000
            : false;

          return {
            id: profile.id || "",
            email: profile.email || "Unknown",
            name:
              profile.full_name ||
              profile.email?.split("@")[0] ||
              "Unknown User",
            role: profile.role || "staff",
            last_sign_in: lastLogin,
            created_at: profile.created_at || new Date().toISOString(),
            is_online: isOnline,
          };
        }
      );

      setUserActivities(activities);
      console.log("User activities updated successfully");
    } catch (error) {
      console.error("Error in fetchUserActivities:", error);
      setError(
        `Unexpected error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setUserActivities([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]); // Removed loading dependency

  // Reduced frequency and better cleanup
  useEffect(() => {
    console.log("UserActivityDashboard useEffect triggered, isAdmin:", isAdmin);

    if (!isAdmin) {
      console.log("User is not admin, skipping initial fetch");
      return;
    }

    // Initial fetch
    console.log("Starting initial fetch...");
    fetchUserActivities();

    // ❌ DISABLED auto-polling to save egress - user can manually refresh if needed
    // Less frequent updates to reduce performance impact
    // console.log("Setting up interval for every 30 minutes...");
    // const intervalId = setInterval(() => {
    //   console.log("Interval triggered, fetching activities...");
    //   fetchUserActivities();
    // }, 30 * 60 * 1000); // Every 30 minutes (REDUCED from 5 min to save egress)

    return () => {
      console.log("Cleaning up interval...");
      // No interval to clean up - polling disabled
    };
  }, [isAdmin, fetchUserActivities]);

  function formatLastSeen(lastSignIn: string | null) {
    if (!lastSignIn) return "Weligiiba ma gelin - Never logged in";

    try {
      const diffInMinutes = Math.floor(
        (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60)
      );

      if (diffInMinutes < 1) return "Hadda - Just now";
      if (diffInMinutes < 60)
        return `${diffInMinutes} daqiiqo ka hor - ${diffInMinutes} minutes ago`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24)
        return `${diffInHours} saac ka hor - ${diffInHours} hours ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7)
        return `${diffInDays} maalmood ka hor - ${diffInDays} days ago`;

      return new Date(lastSignIn).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  }

  function getRoleColor(role: string) {
    switch (role) {
      case "admin":
        return "bg-gradient-to-r from-purple-500 to-blue-600";
      case "owner":
        return "bg-gradient-to-r from-purple-500 to-blue-600";
      case "staff":
        return "bg-gradient-to-r from-green-500 to-teal-600";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-600";
    }
  }

  if (!isAdmin) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="text-center">
          <UserX className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Fasax La'aan - Access Denied
          </h3>
          <p className="text-slate-600">
            Kaliya admin ayaa arki kara faallooyinka isticmaalayaasha - Only
            admin can view user activities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Panel (remove in production) */}
      {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-yellow-800 mb-2">Debug Info:</h4>
        <div className="space-y-1 text-yellow-700">
          <p>User: {user?.email || "Not logged in"}</p>
          <p>Is Admin: {isAdmin ? "Yes" : "No"}</p>
          <p>Loading: {loading ? "Yes" : "No"}</p>
          <p>Error: {error || "None"}</p>
          <p>Activities Count: {userActivities.length}</p>
          <p>Last Check: {new Date().toLocaleTimeString()}</p>
        </div>
      </div> */}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl blur opacity-75"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Staff Activity Dashboard
              </h2>
              <p className="text-slate-600 font-medium">
                Faallooyinka Isticmaalayaasha - Staff Login Activities
              </p>
            </div>
          </div>
          <button
            onClick={fetchUserActivities}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            <Activity className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* User Activities */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-800">
            Staff Members - Shaqaalaha ({userActivities.length})
          </h3>
        </div>

        {error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 text-red-400 mx-auto mb-4">
              <svg
                className="w-full h-full"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Error Loading Data
            </h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={fetchUserActivities}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading user activities...</p>
            <p className="text-xs text-slate-300 mt-2">
              This may take a few seconds...
            </p>
          </div>
        ) : userActivities.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No user data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className={`absolute inset-0 ${getRoleColor(
                        activity.role
                      )} rounded-full blur opacity-50`}
                    ></div>
                    <div
                      className={`relative ${getRoleColor(
                        activity.role
                      )} p-3 rounded-full`}
                    >
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* User Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-800">
                        {activity.name}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          activity.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {activity.role === "admin" ? "Admin" : "Staff"}
                      </span>
                      {activity.is_online && (
                        <span className="flex items-center space-x-1 px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Online</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 font-mono">
                      {activity.email}
                    </p>
                  </div>
                </div>

                {/* Activity Info */}
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm text-slate-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Last Login:</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatLastSeen(activity.last_sign_in)}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>Joined: {formatDate(activity.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Online Now</p>
              <p className="text-2xl font-bold text-slate-800">
                {userActivities.filter((u) => u.is_online).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Staff</p>
              <p className="text-2xl font-bold text-slate-800">
                {userActivities.filter((u) => u.role === "staff").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Active Today</p>
              <p className="text-2xl font-bold text-slate-800">
                {
                  userActivities.filter(
                    (u) =>
                      u.last_sign_in &&
                      Date.now() - new Date(u.last_sign_in).getTime() <
                        24 * 60 * 60 * 1000
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
