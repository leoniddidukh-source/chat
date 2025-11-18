export type ThemeName = 'light' | 'dark';

export interface ThemeDefinition {
  name: ThemeName;
  values: Record<string, string>;
}

export const lightTheme: ThemeDefinition = {
  name: 'light',
  values: {
    '--color-bg': '#f5f5f5',
    '--color-surface': '#ffffff',
    '--color-text': '#0f172a',
    '--color-border': '#e2e8f0',
    '--color-primary': '#2563eb'
  }
};

export const darkTheme: ThemeDefinition = {
  name: 'dark',
  values: {
    '--color-bg': '#0f172a',
    '--color-surface': '#1e293b',
    '--color-text': '#f8fafc',
    '--color-border': '#1e293b',
    '--color-primary': '#38bdf8'
  }
};

