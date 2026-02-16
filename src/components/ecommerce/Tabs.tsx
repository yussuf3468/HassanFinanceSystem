import { ReactNode } from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  badge?: number | string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "default",
}: TabsProps) {
  const variantStyles = {
    default: {
      container: "border-b border-slate-200 dark:border-slate-700",
      tab: "px-4 py-3 font-medium transition-colors border-b-2",
      active: "text-amber-600 dark:text-amber-400 border-amber-600",
      inactive:
        "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300",
    },
    pills: {
      container: "bg-slate-100 dark:bg-slate-800 p-1 rounded-xl",
      tab: "px-4 py-2 font-medium rounded-lg transition-all",
      active:
        "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-md",
      inactive:
        "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50",
    },
    underline: {
      container: "gap-6",
      tab: "pb-3 font-medium transition-colors border-b-2",
      active: "text-amber-600 dark:text-amber-400 border-amber-600",
      inactive:
        "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div>
      <div className={`flex ${styles.container}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`${styles.tab} ${
              activeTab === tab.id ? styles.active : styles.inactive
            } flex items-center gap-2`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
