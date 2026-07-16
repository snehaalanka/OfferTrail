import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
import Loader from "../components/Loader";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Full name is required.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }

    if (email.includes(' ')) {
      setError('Email address cannot contain spaces.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

   setLoading(true);
try {
  await api.register(trimmedName, trimmedEmail, password);
  navigate('/home');
} catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-6 py-12 font-sans text-[#37352f] relative overflow-hidden select-none animate-fade-in">
      
      {/* Container holding form to center it with lots of whitespace */}
      <div className="w-full max-w-[360px] flex flex-col items-center">
        
        {/* Emblem circular logo */}
        <div className="mb-4 flex flex-col items-center">
          <div className="w-9 h-9 rounded-full border border-slate-400 flex items-center justify-center shrink-0 mb-2"></div>
          <span className="text-[11.5px] font-medium tracking-[0.2em] text-slate-500 uppercase">
            OfferTrail
          </span>
        </div>

        {/* Welcome titles */}
        <h2 className="font-serif text-[27px] font-normal tracking-tight text-center text-[#37352f] leading-tight mb-2">
          Start your journey
        </h2>
        <p className="text-[14px] text-slate-500 text-center font-light mb-8">
          Create your OfferTrail workspace
        </p>

        {/* Error alert banner */}
        {error && (
          <div className="w-full mb-5 p-3.5 bg-red-50 border border-red-100 rounded-lg text-[13px] text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-[13px] font-normal text-slate-600 mb-1.5 pl-0.5">
              Full name
            </label>
            <input
              type="text"
              placeholder="your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#e9e9e6] focus:border-slate-400 rounded-lg text-[14px] font-light placeholder-slate-400 focus:outline-hidden transition-all shadow-3xs"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-normal text-slate-600 mb-1.5 pl-0.5">
              Email
            </label>
            <input
              type="text"
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#e9e9e6] focus:border-slate-400 rounded-lg text-[14px] font-light placeholder-slate-400 focus:outline-hidden transition-all shadow-3xs"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-normal text-slate-600 mb-1.5 pl-0.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#e9e9e6] focus:border-slate-400 rounded-lg text-[14px] font-light placeholder-slate-400 focus:outline-hidden transition-all shadow-3xs"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-normal text-slate-600 mb-1.5 pl-0.5">
              Confirm password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#e9e9e6] focus:border-slate-400 rounded-lg text-[14px] font-light placeholder-slate-400 focus:outline-hidden transition-all shadow-3xs"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#415b33] hover:bg-[#2f4227] disabled:bg-[#415b33]/70 text-white text-[14.5px] font-normal rounded-lg transition-colors cursor-pointer text-center"
            >
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </div>
        </form>

        {/* Footnote Toggle */}
        <div className="text-[13.5px] text-slate-500 font-light text-center mt-6">
          Already have one?{' '}
          <Link to="/login" className="text-[#415b33] hover:underline font-medium">
            Log in
          </Link>
        </div>

      </div>

      {/* Mock bottom scroll down arrow matching register page mockup */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center">
        <div className="w-9 h-9 rounded-full bg-[#37352f] text-white flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors shadow-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </div>
      </div>

    </div>
  );
};

export default Register;
