"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

type ThemeToggleProps = {
  className?: string;
  iconClassName?: string;
};

export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const { isDark, ready, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={ready && isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={className ?? "rounded-full border border-border bg-card p-2 text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"}
    >
      {ready && isDark ? <Sun className={iconClassName ?? "h-5 w-5"} /> : <Moon className={iconClassName ?? "h-5 w-5"} />}
    </button>
  );
}
