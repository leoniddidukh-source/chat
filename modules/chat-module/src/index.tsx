import type { Module } from '@erp/shared';
import ChatModuleShell from './module/ChatModuleShell';

const chatModule: Module = {
  manifest: {
    id: 'chat-module',
    title: 'Chat Module',
    icon: '💬',
    basePath: '/modules/chat',
    requiredPermissions: ['modules.chat.view'],
    description: 'Realtime chat experience with Firebase + Gemini AI',
    version: '1.0.0',
    dependencies: [],
    enabled: true
  },
  routes: [
    {
      path: '/',
      element: <ChatModuleShell />
    }
  ]
};

export default chatModule;

