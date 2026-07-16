import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Layout = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-notion-text-main">
      {/* Top horizontal navigation bar */}
      <Navbar />

      {/* Main content viewport */}
      <main className="flex-1 overflow-y-auto bg-white">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
