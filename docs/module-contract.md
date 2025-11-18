# Module Contract

Modules must export an object that satisfies the `Module` interface from `@erp/shared`:

```ts
export interface ModuleManifest {
  id: string;                // Unique slug (used for deduplication)
  title: string;             // Sidebar label
  icon?: string;             // Optional emoji / icon string
  basePath: string;          // e.g. "/modules/inventory"
  requiredPermissions: string[]; // All permissions required to access routes/UI
}

export interface RouteConfig {
  path: string;              // Relative path ("/", "settings", ":id")
  element: React.ReactNode;  // Already-instantiated React node
}

export interface Module {
  manifest: ModuleManifest;
  routes: RouteConfig[];
}
```

### Rules
1. **Unique IDs** – `manifest.id` must be globally unique.
2. **Base Path Ownership** – Modules control everything under `manifest.basePath`. Route paths are resolved as `basePath + route.path`.
3. **Permissions** – `requiredPermissions` must list every permission needed to reveal the module. The host enforces it in navigation and routing.
4. **Pure Exports** – Export a plain object (no side-effects). Registration is handled inside the Host via `registerModule(module)`.
5. **Styling** – Prefer CSS variables defined by the theme package for colors/spacing.
6. **Shared Types Only** – Modules may depend on `@erp/shared` (types) and other shared packages, but should avoid importing Host internals directly.

