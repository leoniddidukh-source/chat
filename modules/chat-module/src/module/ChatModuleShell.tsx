import { useEffect } from 'react';
import ChatProvider from '../components/ChatProvider';
import AppLayout from '../components/AppLayout';
import '../styles/chat.css';

const ensureExternalResource = (id: string, tag: 'script' | 'link', attributes: Record<string, string>) => {
  if (document.getElementById(id)) {
    return;
  }

  const element = document.createElement(tag);
  element.id = id;

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (tag === 'script') {
    element.async = true;
  }

  if (tag === 'link') {
    element.rel = attributes.rel ?? 'stylesheet';
  }

  document.head.appendChild(element);
};

const useExternalStyles = () => {
  useEffect(() => {
    ensureExternalResource('chat-module-tailwind', 'script', {
      src: 'https://cdn.tailwindcss.com',
      referrerpolicy: 'no-referrer'
    });

    ensureExternalResource('chat-module-material-icons', 'link', {
      href: 'https://fonts.googleapis.com/icon?family=Material+Icons',
      rel: 'stylesheet'
    });
  }, []);
};

const ChatModuleShell = () => {
  useExternalStyles();

  return (
    <div className="chat-module-root">
      <ChatProvider>
        <AppLayout />
      </ChatProvider>
    </div>
  );
};

export default ChatModuleShell;

