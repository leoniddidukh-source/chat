# Modular ERP Platform

This repository hosts the core "Host App" for a modular ERP platform plus shared packages and placeholder modules. It is organized as an npm workspace:

- `apps/host` – React + TypeScript application that authenticates users, loads modules, handles routing, and surfaces layout/theme providers.
- `packages/shared` – shared types (e.g., module contracts).
- `packages/theme` – global ThemeProvider with light/dark palettes.
- `modules/default-module` – example module used for local development.

## Getting Started

### Prerequisites
- Node.js 18+ and npm installed

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development servers:**
   
   **Important:** Modules are now separate applications that must be running simultaneously.
   
   Open multiple terminals:
   
   ```bash
   # Terminal 1 - Host App (main application)
   npm run dev:host
   
   # Terminal 2 - Default Module
   npm run dev:default-module
   
   # Terminal 3 - Chat Module
   npm run dev:chat-module
   ```

3. **Open your browser:**
   - Host App will be available at `http://localhost:3000`
   - Default Module at `http://localhost:3001`
   - Chat Module at `http://localhost:3002`
   
   **Note:** Modules are loaded dynamically via Webpack Module Federation, so all three servers must be running.

### Quick Demo

Once the app is running:

1. **Login as Admin:**
   - Click "Login as Admin" in the header
   - You'll see all modules in the sidebar (including "Demo Module")
   - Admin has `["*"]` permissions (access to everything)

2. **Login as User:**
   - Click "Logout" then "Login as User"
   - You'll see only modules you have permission for
   - Regular user has `["dashboard.view"]` permissions (limited access)

3. **Toggle Theme:**
   - Click "Toggle Theme" button in the header to switch between light/dark modes

4. **Navigate:**
   - Use the sidebar to navigate between Dashboard, Modules, and registered module routes
   - Try accessing `/modules/demo` as admin vs user to see permission gates in action

### Other Commands

- `npm run build` - Build Host App for production
- `npm run build:host` - Build Host App
- `npm run build:default-module` - Build Default Module
- `npm run build:chat-module` - Build Chat Module
- `npm run lint` - Run ESLint

### Architecture

This project uses **Webpack Module Federation** for dynamic module loading. Each module is a separate application that is built independently and loaded at runtime.

For more details, see `docs/webpack-module-federation.md`

### Documentation

Further documentation is available in the `docs/` directory:
- `architecture.md` - System architecture overview
- `module-contract.md` - How modules work
- `security.md` - Permission system
- `how-to-create-module.md` - Guide to creating new modules

