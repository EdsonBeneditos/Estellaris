import { createContext, useContext, useEffect, useState } from "react";

type Theme = "default" | "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("theme-default", "theme-light");
    root.classList.add("theme-dark", "dark");
  }, []);

  const setTheme = (_newTheme: Theme) => {
    // Dark mode is fixed — no-op
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
