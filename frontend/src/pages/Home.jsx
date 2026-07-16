import React, { useState } from 'react';
import toast from "react-hot-toast";
import { useConfirm } from "../context/ConfirmContext";
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import Loader from "../components/Loader";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DotTracker = ({ activeCount, companyId, onUpdateProgress }) => {
  const confirm = useConfirm();
  return (
    <div className="flex gap-1 items-center">
      {[...Array(5)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Avoid triggering card navigation redirect links
            onUpdateProgress(companyId, i + 1);
          }}
          className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer border-0 outline-none ${
            i < activeCount
              ? 'bg-[#415b33] hover:bg-[#2f4227]' // Active
              : 'bg-[#f1f3f1] border border-[#d6ded9] hover:bg-[#e2e6e2]' // Empty
          }`}
          title={`Set progress step to ${i + 1}`}
        ></button>
      ))}
    </div>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const isDeadlineThisWeek = (deadlineStr) => {
  if (!deadlineStr) return false;
  let dateObj = new Date(deadlineStr);
  if (isNaN(dateObj.getTime())) {
    const currentYear = new Date().getFullYear();
    dateObj = new Date(`${deadlineStr}, ${currentYear}`);
  }
  if (isNaN(dateObj.getTime())) return false;

  const today = new Date();
  today.setHours(0,0,0,0);
  dateObj.setHours(0,0,0,0);

  const diffTime = dateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
};

const Home = () => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newGoalText, setNewGoalText] = useState('');

  // 1. Fetch user profile
  const { data: profile, isLoading: loadingProfile, error: errorProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
    retry: 1
  });

  // 2. Fetch companies data
  const { data: companies = [], isLoading: loadingCompanies, error: errorCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: api.getCompanies,
    retry: 1
  });

  // 3. Dynamic Activity Log Fetching Endpoint Configuration 
  const { data: serverActivities = [] } = useQuery({
    queryKey: ['dashboardActivities'],
    queryFn: async () => {
      // Accessing backend directly via matching pattern structure
      const response = await fetch(`${API_BASE}/companies/dashboard/activities`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
    retry: 1
  });

  // --- Mutations Hooks Logic Form Submissions ---
  
  // Progress Dots Mutation Handler
  const progressMutation = useMutation({
    mutationFn: async ({ companyId, rating }) => {
      const response = await fetch(`${API_BASE}/companies/${companyId}/progress-step`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rating })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      queryClient.invalidateQueries(['dashboardActivities']);
    }
  });

  // Checkbox Complete Strikethrough Status Mutation
  const toggleGoalMutation = useMutation({
    mutationFn: async ({ companyId, text, completed }) => {
      const response = await fetch(`${API_BASE}/companies/${companyId}/checklist-toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text, completed })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      queryClient.invalidateQueries(['dashboardActivities']);
    }
  });

  // Add Dynamic Dashboard Goal Form Mutation
  const addGoalMutation = useMutation({
    mutationFn: async (text) => {
      const response = await fetch(`${API_BASE}/companies/dashboard/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text })
      });
      return response.json();
    },
    onSuccess: () => {
      setNewGoalText('');
      queryClient.invalidateQueries(['companies']);
      queryClient.invalidateQueries(['dashboardActivities']);
    }
  });

  // Delete Dashboard Goal Mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async ({ companyId, text }) => {
      const response = await fetch(`${API_BASE}/companies/${companyId}/checklist-delete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      queryClient.invalidateQueries(['dashboardActivities']);
    }
  });

  // Compute metrics from fetched companies
  const inProgressCount = companies.filter(c => ['Applied', 'Prepping', 'Wishlist', 'Saved', 'Offered'].includes(c.status)).length;
  const deadlineCount = companies.filter(c => isDeadlineThisWeek(c.deadline) && c.status !== 'Rejected').length;

  // Aggregate checklist goals across all companies
  const goals = React.useMemo(() => {
    let list = [];
    companies.forEach(company => {
      if (company.checklist) {
        company.checklist.forEach(item => {
          list.push({
            rawText: item.text,
            text: item.text,
            completed: item.completed,
            companyId: company._id
          });
        });
      }
    });
    return list;
  }, [companies]);

  // Map recent companies
  const recentList = React.useMemo(() => {
    return companies.slice(0, 4).map(c => {
      const activeCount = c.progress ? c.progress.filter(p => p.completed).length : 0;
      return {
        name: c.name,
        activeCount,
        id: c._id
      };
    });
  }, [companies]);

  // Aggregate recent pages/notes automatically
  const recentPages = React.useMemo(() => {
    let list = [];
    companies.forEach(company => {
      if (company.notes) {
        company.notes.forEach(note => {
          list.push({
            title: `${note.title} — ${company.name}`,
            time: 'edited recently',
            companyId: company._id
          });
        });
      }
    });
    return list.slice(0, 3);
  }, [companies]);

  const handleUpdateProgress = (companyId, rating) => {
    progressMutation.mutate({ companyId, rating });
  };

  const handleAddGoalSubmit = (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    addGoalMutation.mutate(newGoalText);
  };

  const handleItemClick = (companyId) => {
    if (companyId) {
      navigate(`/companies/${companyId}`);
    } else {
      navigate('/companies');
    }
  };

  const loading = loadingProfile || loadingCompanies;
  const error = errorProfile || errorCompanies;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center font-sans">
        <div className="w-6 h-6 border-2 border-[#415b33] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[14.5px] text-slate-500 font-light">Loading workspace dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center font-sans text-[15px] pl-2">
        <div className="text-red-600 font-semibold mb-2">Failed to load workspace data</div>
        <p className="text-slate-500 font-light mb-6">{error.message || 'Connection lost to the server.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 font-sans select-none animate-fade-in text-notion-text-main">
      <div className="text-[12px] text-notion-text-sub font-normal mb-6">Home</div>

      {/* Welcome Section */}
      <div className="mb-10">
        <h1 className="font-serif text-[40px] font-normal tracking-tight leading-tight mb-2">
          {getGreeting()}, {profile?.name || 'Student'}
        </h1>
        <p className="text-[14px] text-notion-text-sub font-light">
          {inProgressCount} {inProgressCount === 1 ? 'company' : 'companies'} in progress · {deadlineCount} {deadlineCount === 1 ? 'deadline' : 'deadlines'} this week
        </p>
      </div>

      {/* Main Grid: Goals & Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 mb-10">
        
        {/* Today's Goals Column */}
        <div>
          <h2 className="text-[14px] font-medium text-notion-text-sub mb-4 tracking-wide">
            Today's goals
          </h2>
          
          {/* Add Goal Form Input Box Component Layout */}
          <form onSubmit={handleAddGoalSubmit} className="flex gap-2 mb-4 items-center">
            <input 
              type="text" 
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="Add new custom task item..."
              className="flex-1 px-3 py-1.5 text-[13.5px] border border-notion-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3d8438] bg-white font-sans text-notion-text-main"
            />
            <button 
              type="submit" 
              className="px-3 py-1.5 bg-[#415b33] text-white text-[13px] font-medium rounded-lg hover:bg-[#2f4227] transition-colors cursor-pointer shrink-0"
            >
              Add
            </button>
          </form>

          {goals.length > 0 ? (
            <div className="space-y-3.5">
              {goals.map((goal, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[15px] group py-0.5 select-none"
                >
                  <div
                    onClick={() => toggleGoalMutation.mutate({ companyId: goal.companyId, text: goal.rawText, completed: !goal.completed })}
                    className="flex items-center cursor-pointer flex-1"
                  >
                    {goal.completed ? (
                      /* Checked Custom Box */
                      <div className="w-4 h-4 rounded border border-[#415b33] bg-[#415b33] flex items-center justify-center mr-3 shrink-0 transition-all">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      /* Unchecked Custom Box */
                      <div className="w-4 h-4 rounded border border-slate-300 bg-transparent group-hover:border-[#3d8438] mr-3 shrink-0 transition-all"></div>
                    )}
                    
                    <span className={`break-all transition-all ${
                      goal.completed ? 'line-through text-black font-semibold' : 'text-notion-text-main hover:text-[#3d8438]'
                    }`}>
                      {goal.text}
                    </span>
                  </div>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (await confirm('Delete this goal?')) {
                        deleteGoalMutation.mutate({ companyId: goal.companyId, text: goal.rawText });
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14.5px] text-notion-text-sub font-light leading-relaxed italic bg-[#fafaf9] p-4 rounded-xl border border-notion-border/40 text-center">
              No goals for today.
            </p>
          )}
        </div>

        {/* Recent Companies Column with Interactive Dots */}
        <div>
          <h2 className="text-[14px] font-medium text-[#787774] mb-4 tracking-wide">
            Recent companies
          </h2>
          {recentList.length > 0 ? (
            <div className="space-y-4">
              {recentList.map((company, idx) => (
                <div
                  key={idx}
                  onClick={() => handleItemClick(company.id)}
                  className="flex items-center justify-between text-[15px] font-normal hover:text-[#3d8438] cursor-pointer transition-colors"
                >
                  <span className="break-all pr-2">{company.name}</span>
                  <DotTracker 
                    activeCount={company.activeCount} 
                    companyId={company.id} 
                    onUpdateProgress={handleUpdateProgress}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14.5px] text-notion-text-sub font-light leading-relaxed italic bg-[#fafaf9] p-4 rounded-xl border border-notion-border/40 text-center">
              No companies added yet.
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-t border-notion-border mb-8" />

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-[14px] font-medium text-notion-text-sub mb-4 tracking-wide">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => navigate('/companies')}
            className="px-4 py-2 bg-white border border-notion-border hover:border-slate-300 rounded-lg text-[13.5px] font-normal hover:bg-[#efefed] transition-all duration-150 shadow-xs cursor-pointer"
          >
            + Add company
          </button>
          <button
            onClick={() => navigate('/workspace')}
            className="px-4 py-2 bg-white border border-notion-border hover:border-slate-300 rounded-lg text-[13.5px] font-normal hover:bg-[#efefed] transition-all duration-150 shadow-xs cursor-pointer"
          >
            Manage workspace
          </button>
          <button
            onClick={() => navigate('/insights')}
            className="px-4 py-2 bg-white border border-notion-border hover:border-slate-300 rounded-lg text-[13.5px] font-normal hover:bg-[#efefed] transition-all duration-150 shadow-xs cursor-pointer"
          >
            Insights dashboard
          </button>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-t border-notion-border mb-8" />

      {/* Dynamic Recently Updated Pages */}
      <div className="mb-10">
        <h2 className="text-[14px] font-medium text-notion-text-sub mb-4 tracking-wide">
          Recently updated
        </h2>
        
        {serverActivities.length > 0 ? (
          <div className="space-y-2.5">
            {serverActivities.map((act, idx) => (
              <div
                key={idx}
                onClick={() => act.companyId ? navigate(`/companies/${act.companyId}`) : navigate('/workspace')}
                className="flex items-center text-[13.5px] font-light hover:text-[#3d8438] cursor-pointer transition-colors text-notion-text-main"
              >
                <span className="hover:underline mr-2 break-all">
                  {act.companyName ? `[${act.companyName}] ` : ''}{act.action}
                </span>
                <span className="text-[12px] text-notion-text-sub/60 shrink-0">
                  · {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : recentPages.length > 0 ? (
          <div className="space-y-2.5">
            {recentPages.map((page, idx) => (
              <div
                key={idx}
                onClick={() => handleItemClick(page.companyId)}
                className="flex items-center text-[13.5px] font-light hover:text-[#3d8438] cursor-pointer transition-colors text-notion-text-main"
              >
                <span className="hover:underline mr-2 break-all">{page.title}</span>
                <span className="text-[12px] text-notion-text-sub/60 shrink-0">
                  · {page.time}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13.5px] text-notion-text-sub font-light italic text-center">
            No recent activity.
          </p>
        )}
      </div>

    </div>
  );
};

export default Home;