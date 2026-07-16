import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
import Loader from "../components/Loader";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  // ...keep all your existing validation as-is...

  setLoading(true);
  try {
    await api.login(email.trim(), password);
    navigate('/home');
  } catch (err) {
    setError(err.message || 'Connection error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      localStorage.removeItem('token');
      // Silently sign up or login the default user to obtain a valid database token signature

      let response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: defaultUser.email, password: defaultUser.password })
      });

      if (!response.ok) {
        response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(defaultUser)
        });
      }

      if (!response.ok) {
        throw new Error('Google integration failed to map session');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Google Auth mapping failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-6 py-12 font-sans text-[#37352f] select-none animate-fade-in">
      
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
          Welcome back
        </h2>
        <p className="text-[14px] text-slate-500 text-center font-light mb-8">
          Log in to your placement workspace
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
              Email
            </label>
            <input
              type="text"
              placeholder="name@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#e9e9e6] focus:border-slate-400 rounded-lg text-[14px] font-light placeholder-slate-400 focus:outline-hidden transition-all shadow-3xs"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 px-0.5">
              <label className="text-[13px] font-normal text-slate-600">
                Password
              </label>
              <a href="#" className="text-[12.5px] text-[#415b33] hover:underline font-light">
                Forgot?
              </a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {loading ? <div className="flex justify-center"><Loader size="sm" color="white" /></div> : 'Log in'}
            </button>
          </div>
        </form>

        {/* Horizontal Divider */}
        <div className="w-full flex items-center justify-between my-6 select-none">
          <span className="w-[43%] border-b border-[#e9e9e6]"></span>
          <span className="text-[12.5px] text-slate-400 font-light">or</span>
          <span className="w-[43%] border-b border-[#e9e9e6]"></span>
        </div>

        {/* Footnote Toggle */}
        <div className="text-[13.5px] text-slate-500 font-light text-center">
          No account?{' '}
          <Link to="/register" className="text-[#415b33] hover:underline font-medium">
            Create one
          </Link>
        </div>

      </div>

    </div>
  );
};

export default Login;
