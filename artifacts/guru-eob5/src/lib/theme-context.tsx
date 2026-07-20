import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  THEMES,
  FONTS,
  DEFAULT_THEME,
  DEFAULT_FONT,
  themeStorageKey,
  fontStorageKey,
  type ThemeId,
  type FontId,
} from "@/lib/theme";

interface ThemeContextValue {
  themeId: ThemeId;
  fontId: FontId;
  setTheme: (id: ThemeId) => void;
  setFont: (id: FontId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME,
  fontId: DEFAULT_FONT,
  setTheme: () => {},
  setFont: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(themeId: ThemeId) {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  // Toggle dark class for dark theme
  if (theme.dark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function applyFont(fontId: FontId) {
  const font = FONTS.find((f) => f.id === fontId);
  if (!font) return;
  const root = document.documentElement;
  root.style.setProperty("--app-font-sans", font.family);
  ensureFontLoaded(font.googleUrl, fontId);
}

const loadedFonts = new Set<string>();
function ensureFontLoaded(url: string, id: string) {
  if (loadedFonts.has(id)) return;
  loadedFonts.add(id);
  const existing = document.querySelector(`link[data-font-id="${id}"]`);
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute("data-font-id", id);
  document.head.appendChild(link);
}

export function ThemeProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const storageId = userId ?? "anonymous";

  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    try {
      return (localStorage.getItem(themeStorageKey(storageId)) as ThemeId) ?? DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const [fontId, setFontIdState] = useState<FontId>(() => {
    try {
      return (localStorage.getItem(fontStorageKey(storageId)) as FontId) ?? DEFAULT_FONT;
    } catch {
      return DEFAULT_FONT;
    }
  });

  // Re-read prefs when user changes (login/logout)
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem(themeStorageKey(storageId)) as ThemeId) ?? DEFAULT_THEME;
      const savedFont = (localStorage.getItem(fontStorageKey(storageId)) as FontId) ?? DEFAULT_FONT;
      setThemeIdState(savedTheme);
      setFontIdState(savedFont);
    } catch {
      // ignore
    }
  }, [storageId]);

  // Apply theme vars whenever themeId changes
  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  // Apply font vars whenever fontId changes
  useEffect(() => {
    applyFont(fontId);
  }, [fontId]);

  const setTheme = useCallback(
    (id: ThemeId) => {
      setThemeIdState(id);
      try {
        localStorage.setItem(themeStorageKey(storageId), id);
      } catch {
        // ignore
      }
    },
    [storageId],
  );

  const setFont = useCallback(
    (id: FontId) => {
      setFontIdState(id);
      try {
        localStorage.setItem(fontStorageKey(storageId), id);
      } catch {
        // ignore
      }
    },
    [storageId],
  );

  return (
    <ThemeContext.Provider value={{ themeId, fontId, setTheme, setFont }}>
      {children}
    </ThemeContext.Provider>
  );
}
