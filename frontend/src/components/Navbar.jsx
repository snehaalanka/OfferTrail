import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

const Navbar = () => {
  const navItems = [
    { name: 'Home', path: '/home' },
    { name: 'Companies', path: '/companies' },
    { name: 'Workspace', path: '/workspace' },
    { name: 'Insights', path: '/insights' },
  ];

  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ['userProfile'],
    queryFn: api.getProfile,
  });

  const initials = user?.name 
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US';

  return (
    <header className="h-14 border-b border-notion-border bg-white px-8 flex items-center justify-between z-40 select-none relative">
      {/* Left section: Logo */}
      <div className="flex items-center flex-1">
        <Link to="/" className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity no-underline">
          <span className="w-4.5 h-4.5 rounded-full border-2 border-notion-text-main flex items-center justify-center"></span>
          <span className="font-sans font-semibold text-sm tracking-wide text-notion-text-main">
            OfferTrail
          </span>
        </Link>
      </div>

      {/* Center section: Navigation Tabs */}
      <div className="absolute left-1/2 -translate-x-1/2 h-full flex items-center">
        <nav className="flex items-center h-full">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `h-full flex items-center px-4 text-[14px] font-sans transition-all relative ${
                  isActive
                    ? 'text-[#3d8438] font-medium border-b-2 border-[#3d8438]'
                    : 'text-notion-text-sub hover:text-notion-text-main'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Right section: Profile Avatar */}
      <div className="flex items-center flex-1 justify-end">
        <div 
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-[#e3e8e5] hover:bg-[#d5ded8] text-[#556b5c] flex items-center justify-center font-sans font-medium text-[13px] cursor-pointer transition-colors border border-notion-border/40"
        >
          {initials}
        </div>
      </div>
    </header>
  );
};

export default Navbar;