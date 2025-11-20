import type { Module } from '@erp/shared';

type RemoteDefinition = {
  scope: string;
  url: string;
  module: string;
};

type RemoteContainer = {
  init: (shareScope: unknown) => Promise<void>;
  get: (module: string) => Promise<() => unknown>;
  __initialized?: boolean;
};

type RemoteWindow = Window &
  typeof globalThis & {
    [scope: string]: RemoteContainer | undefined;
  };

const remoteDefinitions: Record<string, RemoteDefinition> = {
  'default-module': {
    scope: 'default_module',
    url: 'http://localhost:3001/remoteEntry.js',
    module: './Module'
  },
  'chat-module': {
    scope: 'chat_module',
    url: 'http://localhost:3002/remoteEntry.js',
    module: './Module'
  }
};

const remoteLoaders: Record<string, Promise<void>> = {};

const ensureShareScope = async () => {
  if (typeof __webpack_init_sharing__ === 'function') {
    await __webpack_init_sharing__('default');
  }
};

const loadRemoteContainer = async (remoteId: string): Promise<RemoteContainer> => {
  const remote = remoteDefinitions[remoteId];
  if (!remote) {
    throw new Error(`Module ${remoteId} is not configured as a remote`);
  }

  if (!remoteLoaders[remote.scope]) {
    remoteLoaders[remote.scope] = new Promise<void>((resolve, reject) => {
      if ((window as RemoteWindow)[remote.scope]) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = remote.url;
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load remote script: ${remote.url}`));
      document.head.appendChild(script);
    }).then(async () => {
      await ensureShareScope();
      const container = (window as RemoteWindow)[remote.scope];
      if (!container) {
        throw new Error(`Remote container ${remote.scope} not found after loading script`);
      }
      if (!container.__initialized) {
        await container.init(__webpack_share_scopes__.default);
        container.__initialized = true;
      }
    });
  }

  await remoteLoaders[remote.scope];
  await ensureShareScope();

  const container = (window as RemoteWindow)[remote.scope];
  if (!container) {
    throw new Error(`Remote container ${remote.scope} not found`);
  }

  return container;
};

/**
 * Dynamically loads a module using Module Federation
 */
export async function loadModule(moduleId: string): Promise<Module> {
  const remote = remoteDefinitions[moduleId];
  if (!remote) {
    throw new Error(`Module ${moduleId} is not configured as a remote`);
  }

  try {
    const container = await loadRemoteContainer(moduleId);
    const factory = await container.get(remote.module);
    const moduleOrWrapped = factory();
    const module = (moduleOrWrapped && (moduleOrWrapped as { default?: Module }).default) || moduleOrWrapped;

    if (!module || !module.manifest || !module.routes) {
      throw new Error(`Invalid module structure for ${moduleId}. Expected Module with manifest and routes.`);
    }

    return module;
  } catch (error) {
    console.error(`Failed to load module ${moduleId}:`, error);
    throw error;
  }
}

/**
 * Preloads all available modules
 */
export async function preloadModules(moduleIds: string[]): Promise<Map<string, Module>> {
  const loadedModules = new Map<string, Module>();

  const loadPromises = moduleIds.map(async (moduleId) => {
    try {
      const module = await loadModule(moduleId);
      loadedModules.set(moduleId, module);
    } catch (error) {
      console.warn(`Failed to preload module ${moduleId}:`, error);
    }
  });

  await Promise.allSettled(loadPromises);

  return loadedModules;
}

