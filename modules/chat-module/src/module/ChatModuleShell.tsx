import { useEffect, useLayoutEffect } from 'react';
import ChatProvider from '../components/ChatProvider';
import AppLayout from '../components/AppLayout';
import '../index.css';
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

  // Apply styles synchronously before first paint using useLayoutEffect
  useLayoutEffect(() => {
    // Apply styles to document root immediately
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--primary', '#2D5BFF');
    rootStyle.setProperty('--primary-light', '#E9EEFF');
    rootStyle.setProperty('--secondary', '#6C7A89');
    rootStyle.setProperty('--light', '#F5F7FA');
    rootStyle.setProperty('--dark', '#2C3E50');
    rootStyle.setProperty('--success', '#27AE60');
    rootStyle.setProperty('--warning', '#F39C12');
    rootStyle.setProperty('--danger', '#E74C3C');
    rootStyle.setProperty('--border-radius', '10px');
    rootStyle.setProperty('--shadow', '0 4px 12px rgba(0, 0, 0, 0.08)');
    rootStyle.setProperty('--transition', 'all 0.3s ease');
    
    // Also apply to chat-module-root when it exists
    const root = document.querySelector('.chat-module-root') as HTMLElement;
    if (root) {
      root.style.setProperty('--primary', '#2D5BFF');
      root.style.setProperty('--primary-light', '#E9EEFF');
      root.style.setProperty('--secondary', '#6C7A89');
      root.style.setProperty('--light', '#F5F7FA');
      root.style.setProperty('--dark', '#2C3E50');
      root.style.setProperty('--success', '#27AE60');
      root.style.setProperty('--warning', '#F39C12');
      root.style.setProperty('--danger', '#E74C3C');
      root.style.setProperty('--border-radius', '10px');
      root.style.setProperty('--shadow', '0 4px 12px rgba(0, 0, 0, 0.08)');
      root.style.setProperty('--transition', 'all 0.3s ease');
    }
  }, []);

  return (
    <>
      {/* Ensure CSS variables are set immediately */}
      <style>{`
        .chat-module-root,
        .chat-module-root * {
          --primary: #2D5BFF !important;
          --primary-light: #E9EEFF !important;
          --secondary: #6C7A89 !important;
          --light: #F5F7FA !important;
          --dark: #2C3E50 !important;
          --success: #27AE60 !important;
          --warning: #F39C12 !important;
          --danger: #E74C3C !important;
          --border-radius: 10px !important;
          --shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
          --transition: all 0.3s ease !important;
        }
        .chat-module-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          color: var(--dark) !important;
          background-color: var(--light) !important;
        }
      `}</style>
      <div className="chat-module-root" style={{
        '--primary': '#2D5BFF',
        '--primary-light': '#E9EEFF',
        '--secondary': '#6C7A89',
        '--light': '#F5F7FA',
        '--dark': '#2C3E50',
        '--success': '#27AE60',
        '--warning': '#F39C12',
        '--danger': '#E74C3C',
        '--border-radius': '10px',
        '--shadow': '0 4px 12px rgba(0, 0, 0, 0.08)',
        '--transition': 'all 0.3s ease',
      } as React.CSSProperties}>
        <ChatProvider>
          <AppLayout />
        </ChatProvider>
      </div>
    </>
  );
};

export default ChatModuleShell;

