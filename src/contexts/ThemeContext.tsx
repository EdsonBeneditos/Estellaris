import { createContext, useContext, useEffect, useState } from "react";

type Theme = "default" | "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "app-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return saved === "light" || saved === "dark" || saved === "default" ? saved : "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("theme-default", "theme-light", "theme-dark", "light", "dark");
    if (theme === "light") {
      root.classList.add("theme-light");
    } else {
      root.classList.add("theme-dark", "dark");
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
