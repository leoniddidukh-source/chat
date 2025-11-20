import type { User } from './auth.types';

/**
 * Module API - Interface for modules to interact with the Host App
 * This ensures modules can access host features without tight coupling
 */
export interface ModuleAPI {
  /**
   * Get current authenticated user
   */
  getUser: () => User | null;

  /**
   * Check if user has specific permissions
   */
  hasPermission: (permissions: string[]) => boolean;

  /**
   * Get current theme name
   */
  getTheme: () => string;

  /**
   * Toggle theme between light and dark
   */
  toggleTheme: () => void;

  /**
   * Navigate to a route (programmatic navigation)
   */
  navigate: (path: string) => void;

  /**
   * Show a notification (to be implemented by host)
   */
  notify: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;

  /**
   * Log a message (for debugging/monitoring)
   */
  log: (level: 'info' | 'warn' | 'error', message: string, data?: unknown) => void;
}

