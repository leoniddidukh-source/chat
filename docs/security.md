# Security Model

## Roles & Users

| Role   | Permissions                 | Description                    |
|--------|-----------------------------|--------------------------------|
| admin  | `["*"]`                     | Superuser, full platform access|
| user   | `["dashboard.view"]`        | Can only view the dashboard    |

The fake authentication layer (`AuthContext`) exposes `loginAsAdmin`, `loginAsUser`, and `logout` helpers for demos. Real integrations can plug into the same context API later.

## Permission Checking

- `permissionUtils.hasPermission(user, requiredPermissions)` evaluates access with wildcard support.
- `<PermissionGate>` wraps sensitive routes/components and renders the 403 page when access is denied.
- `ModuleRegistryContext.getEnabledModules(userPermissions)` filters modules shown inside the sidebar.

## Navigation Rules

1. **Sidebar Filtering** – Users see only modules they have permission to access.
2. **Routing Guard** – Even if a user manually navigates to a module URL, `<PermissionGate>` enforces access and serves `/403` when needed.
3. **Extensible Permissions** – Modules declare `manifest.requiredPermissions`. Future modules should include granular permissions (e.g., `inventory.view`, `inventory.edit`).

## Future Enhancements

- Connect real identity provider (OAuth/OIDC) and map claims to the `User` shape.
- Persist sessions across reloads.
- Move permission constants into a shared package for reuse by modules.

