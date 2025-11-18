# How to Create a Module

1. **Scaffold a package**
   ```bash
   mkdir -p modules/inventory/src
   cp modules/default-module/package.json modules/inventory/package.json
   # Update "name" and version as needed
   ```

2. **Add TypeScript config**
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": { "composite": true },
     "include": ["src"]
   }
   ```

3. **Implement the module**
   ```tsx
   // modules/inventory/src/index.tsx
   import type { Module } from '@erp/shared';

   const InventoryHome = () => <section className="card">Inventory!</section>;

   const inventoryModule: Module = {
     manifest: {
       id: 'inventory',
       title: 'Inventory',
       basePath: '/modules/inventory',
       requiredPermissions: ['inventory.view']
     },
     routes: [
       { path: '/', element: <InventoryHome /> }
     ]
   };

   export default inventoryModule;
   ```

4. **Register the module**
   - Import it inside `apps/host/src/App.tsx` (or a future dynamic loader) and call `registerModule(newModule)`.

5. **Permissions & UI**
   - Add new permission strings to your auth source of truth.
   - The sidebar and router will automatically respect the new permissions.

6. **Styling**
   - Use existing CSS variables (`--color-bg`, etc.) to ensure theme compatibility.

7. **Testing**
   - Login as admin to ensure the module appears.
   - Login as a limited user to confirm it is hidden (and guarded via direct URL access).

