# Webpack Module Federation Setup

This project uses Webpack Module Federation for dynamically loading modules as separate applications.

## Architecture

- **Host App** (`apps/host`) - The main application that loads modules
- **Modules** (`modules/*`) - Separate applications that are exported via Module Federation

## Ports

- Host App: `http://localhost:3000`
- Default Module: `http://localhost:3001`
- Chat Module: `http://localhost:3002`

## Development Mode

### Option 1: Run all modules simultaneously (recommended)

Open multiple terminals and run:

```bash
# Terminal 1 - Host App
npm run dev:host

# Terminal 2 - Default Module
npm run dev:default-module

# Terminal 3 - Chat Module
npm run dev:chat-module
```

### Option 2: Run only Host App

If modules are already built and running separately, you can run only the Host App:

```bash
npm run dev
```

## Production Build

```bash
# Build all modules
npm run build:host
npm run build:default-module
npm run build:chat-module
```

## How It Works

1. Each module is built as a separate application with webpack
2. Module Federation exports the module via `remoteEntry.js`
3. Host App loads modules dynamically through `loadModule()`
4. Modules are registered in `ModuleRegistry` after loading

## Adding a New Module

1. Create a new folder in `modules/`
2. Configure `webpack.config.js` with Module Federation
3. Add the remote to `apps/host/webpack.config.js`
4. Add module loading to `apps/host/src/App.tsx`
5. Add types to `apps/host/src/types/module-federation.d.ts`

