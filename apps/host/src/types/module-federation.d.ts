// Type declarations for Module Federation remotes
// Module Federation may wrap exports differently, so we use a flexible type
declare module 'default-module/Module' {
  import type { Module } from '@erp/shared';
  const module: any; // Module Federation structure varies, handle at runtime
  export = module;
}

declare module 'chat-module/Module' {
  import type { Module } from '@erp/shared';
  const module: any; // Module Federation structure varies, handle at runtime
  export = module;
}

