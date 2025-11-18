# Architecture Overview

## Host App (`apps/host`)
The Host App is a React + TypeScript + Vite SPA. It is responsible for:
- Handling authentication via `AuthContext` (fake users for now).
- Owning the global layout (`MainLayout`: `Header`, `Sidebar`, content).
- Bootstrapping the router and mounting module routes.
- Providing the `ModuleRegistryContext` so modules can be registered dynamically.
- Applying theming (light/dark) through the `@erp/theme` package.

Directory highlights:
- `core/auth`: strongly typed auth context with mock login helpers.
- `core/modules`: module registry context + hook.
- `core/security`: permission helpers + `<PermissionGate>`.
- `components/layout`: header, sidebar, layout shell consuming contexts.
- `pages`: built-in routes (Dashboard, Modules placeholder).
- `styles`: global + layout CSS using CSS variables from the theme provider.

## Modules (`modules/*`)
Modules are standalone workspaces (e.g., `modules/default-module`). Each module exports a `Module` object that contains:
- `manifest`: metadata (`id`, `title`, `basePath`, `requiredPermissions`, optional icon).
- `routes`: array of `{ path, element }` pairs the host router mounts under `basePath`.

Modules can depend on shared types (`@erp/shared`) and should only expose React nodes via the module interface, keeping their internal state encapsulated.

## Module Registry
`ModuleRegistryContext` maintains an in-memory list of registered modules. It exposes:
- `modules`: raw list of registered modules.
- `registerModule`: idempotent function to add modules.
- `getEnabledModules`: filters modules by a caller’s permission list (with wildcard `*` support).

The Host App bootstraps initial modules (currently `default-module`) and can later register modules dynamically (e.g., remote loading or federation).

## Router
The Host App uses `react-router-dom`. Base routes:
- `/` → `DashboardPage`
- `/modules` → `ModulesPlaceholderPage`
- `/403` → `ForbiddenPage`

For each registered module, the host maps `manifest.basePath` + `route.path` into concrete routes. Elements are wrapped in `<PermissionGate>` so forbidden access renders the 403 page.

## Theme System (`packages/theme`)
Provides `ThemeProvider` and `useTheme()` plus `lightTheme` and `darkTheme` definitions. The provider writes CSS variables to `:root` so the Host App (and modules) can rely on semantic tokens (`--color-bg`, `--color-primary`, etc.). The Header exposes a “Toggle Theme” button.

## Auth & Security
`AuthContext` simulates admin and regular users. Permissions:
- Admin: `["*"]`
- User: `["dashboard.view"]`

`permissionUtils.hasPermission` and `<PermissionGate>` enforce access across layout and routes. The sidebar queries the module registry with the active user’s permissions to hide inaccessible modules by default.

