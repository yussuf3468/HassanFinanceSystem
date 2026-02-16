import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export default function Breadcrumbs({
  items,
  showHome = true,
}: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {showHome && (
        <>
          <button
            onClick={() => items[0]?.onClick?.()}
            className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className={`${
                  isLast
                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                } transition-colors`}
              >
                {item.label}
              </button>
            ) : (
              <span
                className={`${
                  isLast
                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {item.label}
              </span>
            )}

            {!isLast && <ChevronRight className="w-4 h-4 text-slate-400" />}
          </div>
        );
      })}
    </nav>
  );
}
