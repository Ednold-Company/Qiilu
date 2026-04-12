"use client";

import { useEffect, useState } from "react";

const themeStorageKey = "qiilu-theme";
const themeCookieKey = "qiilu-theme";

type ThemeMode = "light" | "dark";

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.dataset.theme = mode;
}

function persistTheme(mode: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(themeStorageKey, mode);
  document.cookie = `${themeCookieKey}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(themeStorageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function initializeTheme() {
  const mode = getPreferredTheme();
  applyTheme(mode);
  persistTheme(mode);
  return mode;
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mode = initializeTheme();
    setTheme(mode);
    setReady(true);
  }, []);

  const updateTheme = (nextTheme: ThemeMode | ((current: ThemeMode) => ThemeMode)) => {
    setTheme((current) => {
      const resolved = typeof nextTheme === "function" ? nextTheme(current) : nextTheme;
      applyTheme(resolved);
      persistTheme(resolved);
      return resolved;
    });
  };

  return {
    theme,
    isDark: theme === "dark",
    ready,
    setTheme: updateTheme,
    toggleTheme: () => updateTheme((current) => (current === "dark" ? "light" : "dark"))
  };
}
