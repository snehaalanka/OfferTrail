import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { LogOut } from 'lucide-react';
import Loader from "../components/Loader";

const Profile = () => {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: api.getProfile,
  });

  const handleLogout = () => {
    api.logout();
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-8 flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  // Fallbacks if user data isn't perfectly loaded
  const name = user?.name || 'User';
  const email = user?.email || 'user@example.com';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  
  const memberSince = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Unknown';

  return (
    <div className="max-w-3xl mx-auto py-12 px-8 select-none animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[28px] text-notion-text-main font-serif tracking-tight mb-8">
          Profile
        </h1>

        {/* User Card */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#e3e8e5] text-[#415b33] flex items-center justify-center font-sans font-medium text-[20px] tracking-wide shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-[16px] font-medium text-notion-text-main mb-0.5">
              {name}
            </h2>
            <p className="text-[13.5px] text-notion-text-sub font-light">
              {email} · Member since {memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-0">
        {/* Full name */}
        <div className="flex items-center justify-between py-4 border-t border-slate-200">
          <span className="text-[14px] text-notion-text-sub font-normal">Full name</span>
          <span className="text-[14px] text-notion-text-main">{name}</span>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between py-4 border-t border-slate-200">
          <span className="text-[14px] text-notion-text-sub font-normal">Notifications</span>
          <span className="text-[14px] text-notion-text-main">Daily, 8:00 pm</span>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between py-4 border-t border-slate-200">
          <span className="text-[14px] text-notion-text-sub font-normal">Theme</span>
          <span className="text-[14px] text-notion-text-main">Light</span>
        </div>

        {/* Export data */}
        <div className="flex items-center justify-between py-4 border-t border-slate-200">
          <span className="text-[14px] text-notion-text-sub font-normal">Export data</span>
          <button className="text-[14px] text-[#415b33] hover:underline cursor-pointer font-medium">
            Download
          </button>
        </div>

        {/* Log out */}
        <div className="flex items-center justify-between py-4 border-t border-b border-slate-200">
          <button 
            onClick={handleLogout}
            className="text-[14px] text-red-600 hover:text-red-700 hover:underline cursor-pointer font-medium flex items-center gap-2"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
