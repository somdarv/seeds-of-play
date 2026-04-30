"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "kalaanba-theme";
const CHANGE_EVENT = "kalaanba-theme-change";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialMode(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyMode(next: ThemeMode) {
  document.documentElement.classList.toggle("light", next === "light");
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function KxThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readInitialMode());

  // Stay in sync with any other toggle on the page (e.g. the legacy
  // ThemeToggle in components/ui) — both share the same storage key.
  useEffect(() => {
    const handler = () => setModeState(readInitialMode());
    window.addEventListener("storage", handler);
    window.addEventListener(CHANGE_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(CHANGE_EVENT, handler);
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    applyMode(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyMode(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useKxTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useKxTheme must be used within KxThemeProvider");
  return ctx;
}
