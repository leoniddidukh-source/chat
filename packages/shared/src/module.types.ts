import type { ReactNode } from 'react';

export interface RouteConfig {
  path: string;
  element: ReactNode;
}

export interface ModuleManifest {
  id: string;
  title: string;
  icon?: string;
  basePath: string;
  requiredPermissions: string[];
  version?: string;
  description?: string;
  dependencies?: string[]; // IDs of other modules this module depends on
  enabled?: boolean; // Whether module is enabled (default: true)
}

export interface Module {
  manifest: ModuleManifest;
  routes: RouteConfig[];
}

