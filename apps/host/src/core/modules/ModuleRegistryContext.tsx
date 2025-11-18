import { Module } from '@erp/shared';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';

interface ModuleRegistryContextValue {
  modules: Module[];
  registerModule: (module: Module) => void;
  unregisterModule: (moduleId: string) => void;
  enableModule: (moduleId: string) => void;
  disableModule: (moduleId: string) => void;
  getEnabledModules: (permissions: string[]) => Module[];
  getModule: (moduleId: string) => Module | undefined;
}

const ModuleRegistryContext = createContext<ModuleRegistryContextValue | undefined>(undefined);

export const ModuleRegistryProvider = ({ children }: PropsWithChildren<unknown>) => {
  const [modules, setModules] = useState<Module[]>([]);

  const registerModule = useCallback((module: Module) => {
    setModules((prev) => {
      const exists = prev.some((item) => item.manifest.id === module.manifest.id);
      if (exists) {
        return prev;
      }
      // Ensure module is enabled by default
      const moduleToRegister: Module = {
        ...module,
        manifest: {
          ...module.manifest,
          enabled: module.manifest.enabled !== false
        }
      };
      return [...prev, moduleToRegister];
    });
  }, []);

  const unregisterModule = useCallback((moduleId: string) => {
    setModules((prev) => prev.filter((module) => module.manifest.id !== moduleId));
  }, []);

  const enableModule = useCallback((moduleId: string) => {
    setModules((prev) =>
      prev.map((module) =>
        module.manifest.id === moduleId
          ? { ...module, manifest: { ...module.manifest, enabled: true } }
          : module
      )
    );
  }, []);

  const disableModule = useCallback((moduleId: string) => {
    setModules((prev) =>
      prev.map((module) =>
        module.manifest.id === moduleId
          ? { ...module, manifest: { ...module.manifest, enabled: false } }
          : module
      )
    );
  }, []);

  const getModule = useCallback(
    (moduleId: string) => {
      return modules.find((module) => module.manifest.id === moduleId);
    },
    [modules]
  );

  const getEnabledModules = useCallback(
    (permissions: string[]) => {
      // First filter by enabled status
      const enabledModules = modules.filter(
        (module) => module.manifest.enabled !== false
      );

      if (!permissions || permissions.length === 0) {
        return enabledModules.filter((module) => module.manifest.requiredPermissions.length === 0);
      }

      const hasWildcard = permissions.includes('*');
      if (hasWildcard) {
        return enabledModules;
      }

      return enabledModules.filter((module) =>
        module.manifest.requiredPermissions.every((permission) => permissions.includes(permission))
      );
    },
    [modules]
  );

  const value = useMemo(
    () => ({
      modules,
      registerModule,
      unregisterModule,
      enableModule,
      disableModule,
      getEnabledModules,
      getModule
    }),
    [modules, registerModule, unregisterModule, enableModule, disableModule, getEnabledModules, getModule]
  );

  return <ModuleRegistryContext.Provider value={value}>{children}</ModuleRegistryContext.Provider>;
};

export const useModuleRegistry = (): ModuleRegistryContextValue => {
  const context = useContext(ModuleRegistryContext);
  if (!context) {
    throw new Error('useModuleRegistry must be used within a ModuleRegistryProvider');
  }
  return context;
};

