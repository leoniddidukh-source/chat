import { PropsWithChildren } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import '../../styles/layout.css';

const MainLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;

