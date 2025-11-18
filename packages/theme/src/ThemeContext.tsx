import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { ThemeDefinition, ThemeName, darkTheme, lightTheme } from './themes';

interface ThemeContextValue {
  theme: ThemeName;
  toggleTheme: () => void;
  setTheme: (theme: ThemeName) => void;
}

const THEMES: Record<ThemeName, ThemeDefinition> = {
  light: lightTheme,
  dark: darkTheme
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const applyTheme = (theme: ThemeDefinition) => {
  if (typeof document === 'undefined') {
    return;
  }
  Object.entries(theme.values).forEach(([variable, value]) => {
    document.documentElement.style.setProperty(variable, value);
  });
  document.documentElement.dataset.theme = theme.name;
};

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setTheme] = useState<ThemeName>('light');

  useEffect(() => {
    applyTheme(THEMES[theme]);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme,
      setTheme
    }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { lightTheme, darkTheme } from './themes';

