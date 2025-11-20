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
   - Navigate to `http://localhost:3000` - this is the main Host App
   - The Host App will automatically load modules from:
     - Default Module at `http://localhost:3001`
     - Chat Module at `http://localhost:3002`
   
   **Important:** All three servers must be running for the application to work properly. Modules are loaded dynamically via Webpack Module Federation.
   
   **Note:** You don't need to manually open `localhost:3001` or `localhost:3002` - they are accessed automatically by the Host App.

### Quick Demo

Once all three servers are running:

1. **Open the application:**
   - Navigate to `http://localhost:3000` in your browser
   - You'll see the login page

2. **Login with demo credentials:**
   
   **Admin User:**
   - Email: `admin@example.com`
   - Password: (any password works in demo mode)
   - Has `["*"]` permissions (access to everything)
   - Can see all modules in the sidebar

   **Regular User:**
   - Email: `user@example.com`
   - Password: (any password works in demo mode)
   - Has `["dashboard.view", "modules.chat.view"]` permissions
   - Can see limited modules

   **Manager User:**
   - Email: `manager@example.com`
   - Password: (any password works in demo mode)
   - Has `["dashboard.view", "modules.demo.view", "modules.chat.view"]` permissions

3. **Explore the application:**
   - **Toggle Theme:** Click "Toggle Theme" button in the header to switch between light/dark modes
   - **Navigate:** Use the sidebar to navigate between Dashboard, Modules, User Management, and module routes
   - **Try modules:** Access Demo Module (`/modules/demo`) and Chat Module (`/modules/chat`)
   - **Test permissions:** Logout and login as different users to see permission-based access control

### Available Commands

**Development:**
- `npm run dev:host` - Start Host App development server (port 3000)
- `npm run dev:default-module` - Start Default Module development server (port 3001)
- `npm run dev:chat-module` - Start Chat Module development server (port 3002)

**Production Build:**
- `npm run build` - Build Host App for production
- `npm run build:host` - Build Host App
- `npm run build:default-module` - Build Default Module
- `npm run build:chat-module` - Build Chat Module

**Code Quality:**
- `npm run lint` - Run ESLint on Host App

### Troubleshooting

**Modules not loading?**
- Make sure all three servers are running (host, default-module, chat-module)
- Check browser console for errors
- Verify that ports 3000, 3001, and 3002 are not blocked by firewall

**White screen or errors?**
- Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check that all dependencies are installed: `npm install`
- Restart all development servers

**TypeScript errors?**
- The project uses `transpileOnly: true` in webpack config for faster builds
- Type checking is disabled during development for performance
- For full type checking, modify `webpack.config.js` in each app/module

### Architecture

This project uses **Webpack Module Federation** for dynamic module loading. Each module is a separate application that is built independently and loaded at runtime.

For more details, see `docs/webpack-module-federation.md`

### Documentation

Further documentation is available in the `docs/` directory:
- `architecture.md` - System architecture overview
- `module-contract.md` - How modules work
- `security.md` - Permission system
- `how-to-create-module.md` - Guide to creating new modules

