// @ts-nocheck
export {};
import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const { user } = useAuth();

  // Check if current user is admin
  const isAdmin =
    user?.email?.includes("admin") || user?.email?.includes("yussuf");

  useEffect(() => {
    if (isAdmin) {
      fetchUserActivities();
      // Set up real-time updates
      const interval = setInterval(fetchUserActivities, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  async function fetchUserActivities() {
    try {
      setLoading(true);

      // Get user profiles with activity data
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("updated_at", { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      // Create activities from profiles data
      const activities: UserActivity[] =
        profiles?.map((profile) => ({
          id: profile.id,
          email: profile.email,
          name: profile.full_name || profile.email.split("@")[0],
          role: profile.role || "staff",
          last_sign_in: profile.last_login || null,
          created_at: profile.created_at,
          is_online: profile.last_login
            ? new Date().getTime() - new Date(profile.last_login).getTime() <
              30 * 60 * 1000
            : false, // Online if logged in within 30 minutes
        })) || [];

      setUserActivities(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatLastSeen(lastSignIn: string | null) {
    if (!lastSignIn) return "Weligiiba ma gelin - Never logged in";

    const now = new Date();
    const signInDate = new Date(lastSignIn);
    const diffInMinutes = Math.floor(
      (now.getTime() - signInDate.getTime()) / (1000 * 60)
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

    return signInDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl blur opacity-75"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              User Activity Dashboard
            </h2>
            <p className="text-slate-600 font-medium">
              Faallooyinka Isticmaalayaasha - Staff Login Activities
            </p>
          </div>
          <div className="ml-auto">
            <button
              onClick={fetchUserActivities}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              <Activity
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
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

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading user activities...</p>
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
                    <span>
                      Joined:{" "}
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
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
                      new Date().getTime() -
                        new Date(u.last_sign_in).getTime() <
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
