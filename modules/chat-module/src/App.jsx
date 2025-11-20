import ChatProvider from './components/ChatProvider';
import AppLayout from './components/AppLayout';

// The default export component: Wraps the layout in the Provider
const App = () => (
  <ChatProvider>
    <AppLayout />
  </ChatProvider>
);

export default App;