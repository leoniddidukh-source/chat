# Team Onboarding Guide - Core ERP Platform

## 🎯 Overview

This Core ERP platform is a **frozen foundation** that provides:
- Host App infrastructure
- Module system architecture
- Security & permission framework
- Theme system
- Module API for host integration

**Teams will build their own modules** on top of this stable core.

## 📋 What Teams Need to Know

### 1. **Core is Frozen** 🔒
- The core (`apps/host`, `packages/*`) is **stable and should not be modified**
- All custom development happens in `modules/your-module-name`
- Core changes require platform team approval

### 2. **Module Structure**
Each module is a standalone workspace:
```
modules/your-module/
├── package.json
├── tsconfig.json
└── src/
    └── index.tsx  (exports Module object)
```

### 3. **Module Contract**

Your module must export a `Module` object:

```typescript
import type { Module } from '@erp/shared';

const yourModule: Module = {
  manifest: {
    id: 'your-module-id',           // Unique identifier
    title: 'Your Module Name',      // Display name
    icon: '🎯',                      // Optional icon
    basePath: '/modules/your-module', // URL base path
    requiredPermissions: ['your.module.view'], // Required permissions
    version: '1.0.0',                // Optional version
    description: 'Module description', // Optional
    dependencies: [],                // Optional: other module IDs
    enabled: true                    // Optional: default enabled
  },
  routes: [
    {
      path: '/',
      element: <YourMainPage />
    },
    {
      path: '/settings',
      element: <YourSettingsPage />
    }
  ]
};

export default yourModule;
```

### 4. **Module API - Accessing Host Features**

Modules can access host features through the Module API:

```typescript
// In your module code
import { useModuleAPI } from '@erp/shared'; // Note: This will be available via host injection

// Or create a hook in your module that uses React context
// The host provides ModuleAPI through context

const YourComponent = () => {
  const api = useModuleAPI(); // Access via context (host provides this)
  
  const user = api.getUser();
  const hasAccess = api.hasPermission(['your.module.edit']);
  const currentTheme = api.getTheme();
  
  api.navigate('/other-route');
  api.notify('Operation successful', 'success');
  api.log('info', 'User action', { action: 'click' });
  
  return <div>Your content</div>;
};
```

**Note:** Module API is injected by the host. See `apps/host/src/core/modules/ModuleAPIContext.tsx` for available methods.

### 5. **Permissions**

Define permissions for your module:
- Format: `your-module.action` (e.g., `inventory.view`, `inventory.edit`, `inventory.delete`)
- Wildcard `*` grants all permissions (admin only)
- Users must have all required permissions to access the module

Example:
```typescript
requiredPermissions: ['inventory.view', 'inventory.edit']
```

### 6. **Theming**

Modules automatically inherit theme CSS variables:
- `--color-bg` - Background color
- `--color-surface` - Card/surface color
- `--color-text` - Text color
- `--color-border` - Border color
- `--color-primary` - Primary accent color

Use these in your module styles:
```css
.my-component {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
```

### 7. **Error Handling**

- Modules are wrapped in Error Boundaries
- Module errors won't crash the entire app
- Always handle errors gracefully in your module code

### 8. **Module Lifecycle**

Modules can be:
- **Registered** - Added to the registry
- **Enabled/Disabled** - Toggle module availability
- **Unregistered** - Removed from the registry

The host manages this. Your module should handle being disabled gracefully.

## 🚀 Creating Your First Module

### Step 1: Create Module Directory
```bash
mkdir modules/your-module-name
cd modules/your-module-name
```

### Step 2: Setup package.json
```json
{
  "name": "@modules/your-module-name",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "react": "^19.0.0",
    "react-router-dom": "^7.0.2",
    "@erp/shared": "*",
    "@erp/theme": "*"
  },
  "exports": {
    ".": "./src/index.tsx"
  }
}
```

### Step 3: Create Module Structure
```
src/
├── index.tsx          # Module export
├── pages/
│   ├── HomePage.tsx
│   └── SettingsPage.tsx
└── components/
    └── YourComponent.tsx
```

### Step 4: Register Module

In `apps/host/src/App.tsx`, add your module to bootstrap:
```typescript
import yourModule from '@modules/your-module-name';

const bootstrapModules = useMemo(() => [defaultModule, yourModule], []);
```

## 📚 Available Packages

### `@erp/shared`
- Type definitions (`Module`, `ModuleManifest`, `User`, etc.)
- Module API types

### `@erp/theme`
- `useTheme()` hook
- Theme utilities
- Theme definitions

## 🔐 Security Best Practices

1. **Always check permissions** before showing sensitive data
2. **Use PermissionGate** for route-level protection (host handles this)
3. **Validate user permissions** in your module logic
4. **Never trust client-side permissions alone** - always validate on backend

## 🎨 Styling Guidelines

1. Use CSS variables from theme system
2. Follow the `.card` class pattern for containers
3. Use semantic button classes: `.primary-button`, `.secondary-button`, `.ghost-button`
4. Maintain consistent spacing and typography

## 🐛 Debugging

- Use `api.log()` for debugging (won't appear in production)
- Check browser console for module errors
- Error boundaries will catch and display module errors

## ❓ Common Questions

**Q: Can I modify the core?**
A: No, the core is frozen. All changes must be in your module.

**Q: How do I communicate between modules?**
A: Use the Module API event system (to be implemented) or shared state management.

**Q: Can I add new dependencies?**
A: Yes, in your module's `package.json`. Avoid adding dependencies that conflict with core.

**Q: How do I handle API calls?**
A: Use standard fetch or your preferred HTTP client. Consider creating a shared API utility in your module.

**Q: Can I create nested routes?**
A: Yes, define multiple routes in your module's routes array.

## 📞 Support

For questions or issues:
1. Check documentation in `docs/` folder
2. Review `modules/default-module` as a reference
3. Contact the platform team

## ✅ Checklist Before Starting

- [ ] Read this guide completely
- [ ] Review `modules/default-module` example
- [ ] Understand the Module contract
- [ ] Plan your module's permissions
- [ ] Design your module's routes
- [ ] Set up your module workspace
- [ ] Test module registration

---

**Remember:** The core is stable. Focus on building great modules! 🚀

