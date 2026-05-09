import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallback?: string;
  status?: "online" | "offline" | "busy";
}

export default function Avatar({
  src,
  alt = "Avatar",
  size = "md",
  fallback,
  status,
}: AvatarProps) {
  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
  };

  const statusSizes = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  const statusColors = {
    online: "bg-emerald-500",
    offline: "bg-slate-400",
    busy: "bg-red-500",
  };

  return (
    <div className="relative inline-block">
      <div
        className={`${sizes[size]} rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white font-semibold ring-2 ring-white dark:ring-slate-800`}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : fallback ? (
          <span>{fallback.charAt(0).toUpperCase()}</span>
        ) : (
          <User className="w-1/2 h-1/2" />
        )}
      </div>
      {status && (
        <div
          className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} rounded-full ring-2 ring-white dark:ring-slate-800`}
        />
      )}
    </div>
  );
}
