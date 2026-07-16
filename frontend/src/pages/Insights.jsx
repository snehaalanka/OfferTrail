import React, { useState, useEffect } from 'react';
import toast from "react-hot-toast";
import { useConfirm } from "../context/ConfirmContext";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import Loader from "../components/Loader";

const Insights = () => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch companies data
  const { data: companies = [], isLoading: loadingCompanies, error: errorCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: api.getCompanies
  });



  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Sync default selected company once loaded
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0]._id);
    }
  }, [companies, selectedCompanyId]);

  // 3. Define Analysis Mutation
  const analyzeMutation = useMutation({
    mutationFn: (id) => api.generateCompanyAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] }); // refresh stats
    }
  });

  const handleCompanyChange = (e) => {
    setSelectedCompanyId(e.target.value);
  };

  const handleGenerateInsights = async () => {
    if (!selectedCompanyId) return;
    try {
      await analyzeMutation.mutateAsync(selectedCompanyId);
    } catch (err) {
      toast.error(err.message || 'Failed to generate insights');
    }
  };

  // Find currently selected company object
  const companyData = React.useMemo(() => {
    return companies.find(c => c._id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  // Check states
  const hasNoCompanies = companies.length === 0;
  const isJdEmpty = companyData && (!companyData.jd || companyData.jd.trim() === '');
  const hasNoCompanyResume = companyData && (!companyData.resume || !companyData.resume.content || companyData.resume.content.trim() === '');
  const hasNoAnalysis = companyData && (!companyData.resumeMatch || !companyData.resumeMatch.score || companyData.resumeMatch.score === 0);

  const loading = loadingCompanies || analyzeMutation.isPending;
  const error = errorCompanies;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center font-sans">
        <div className="w-6 h-6 border-2 border-[#415b33] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[14.5px] text-slate-500 font-light">
          {analyzeMutation.isPending ? 'Analyzing resume & job description...' : 'Loading insights dashboard...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center font-sans">
        <div className="text-red-600 font-semibold mb-2">Failed to load insights</div>
        <p className="text-slate-500 font-light mb-6">{error.message || 'Connection lost to the server.'}</p>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
          }}
          className="px-4 py-2 bg-[#415b33] hover:bg-[#2f4227] text-white text-[13.5px] font-medium rounded-lg transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (hasNoCompanies) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center font-sans px-8">
        <div className="border border-dashed border-slate-300 rounded-xl p-12 bg-white max-w-xl mx-auto">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-notion-text-main mb-1.5">No companies selected</h3>
          <p className="text-sm text-slate-400 font-light max-w-sm mx-auto mb-6">
            Select a company to view insights. Add companies to your list first.
          </p>
          <button
            onClick={() => navigate('/companies')}
            className="px-4 py-2 bg-[#415b33] text-white hover:bg-[#2f4227] rounded-lg text-[13.5px] font-medium transition-all cursor-pointer"
          >
            Go to Companies Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 font-sans select-none animate-fade-in text-notion-text-main">
      
      {/* Title */}
      <h1 className="font-serif text-[40px] font-normal tracking-tight mb-2">
        Insights
      </h1>

      {/* Selector dropdown */}
      <div className="flex items-center gap-2 text-[14.5px] font-light mb-8">
        <span className="text-notion-text-sub">Select company:</span>
        <select
          value={selectedCompanyId}
          onChange={handleCompanyChange}
          className="px-2 py-0.5 border border-notion-border rounded-md text-[13.5px] font-medium text-notion-text-main hover:bg-[#efefed] focus:outline-hidden cursor-pointer bg-white transition-colors"
        >
          <option value="" disabled>Select a company to view insights.</option>
          {companies.map(c => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedCompanyId ? (
        <div className="p-8 border border-notion-border rounded-xl bg-white text-center text-slate-400 font-light italic">
          Select a company to view insights.
        </div>
      ) : isJdEmpty ? (
        <div className="border border-dashed border-amber-200 rounded-xl p-12 text-center bg-amber-50/30 max-w-xl mx-auto">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">Upload a Job Description.</h3>
          <p className="text-sm text-slate-400 font-light mb-6">
            The workspace requires job requirements to extract targeted keywords and technologies.
          </p>
          <button
            onClick={() => navigate(`/companies/${selectedCompanyId}`)}
            className="px-4 py-2 bg-[#415b33] hover:bg-[#2f4227] text-white rounded-lg text-[13px] font-medium cursor-pointer inline-flex items-center gap-1"
          >
            <span>Edit Workspace JD</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : hasNoCompanyResume ? (
        <div className="border border-dashed border-slate-300 rounded-xl p-12 text-center bg-white max-w-xl mx-auto">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">Upload tailored resume.</h3>
          <p className="text-sm text-slate-400 font-light mb-6">
            Please upload the tailored resume you used/prepared for {companyData.name} to run ATS comparisons.
          </p>
          <button
            onClick={() => navigate(`/companies/${selectedCompanyId}`)}
            className="px-4 py-2 bg-[#415b33] hover:bg-[#2f4227] text-white rounded-lg text-[13px] font-medium cursor-pointer inline-flex items-center gap-1"
          >
            <span>Go to Company Workspace</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : hasNoAnalysis ? (
        <div className="border border-dashed border-slate-300 rounded-xl p-12 text-center bg-white max-w-xl mx-auto space-y-4">
          <Sparkles className="w-10 h-10 text-[#3d8438] mx-auto animate-pulse" />
          <h3 className="text-base font-semibold text-slate-800">Generate insights to begin.</h3>
          <p className="text-sm text-slate-400 font-light max-w-sm mx-auto">
            Extract skill maps and run ATS matching to check for missing skills and study checklists.
          </p>
          <button
            onClick={handleGenerateInsights}
            className="px-5 py-2.5 bg-[#3d8438] hover:bg-[#415b33] text-white rounded-lg text-[13.5px] font-medium cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Insights</span>
          </button>
        </div>
      ) : companyData ? (
        <div className="space-y-8 animate-fade-in">
          
          {/* SECTION 1: RESUME ANALYSIS */}
          <div className="border-t border-notion-border pt-6">
            <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase mb-3.5">
              Resume Analysis
            </h2>
            
            <div className="space-y-2.5">
              {/* Score (Only shown after analysis) */}
              <div className="text-[34px] font-normal font-sans tracking-tight">
                <span className="font-semibold text-notion-text-main">{companyData.resumeMatch?.score || 0}</span>
                <span className="text-notion-text-sub text-[22px] font-light">/100</span>
              </div>
              
              {/* Missing keywords */}
              <div className="text-[14.5px] font-light text-notion-text-sub leading-relaxed">
                Missing keywords:{' '}
                <span className="text-[#b45309] font-medium break-all">
                  {companyData.resumeMatch?.keywords || 'None'}
                </span>
              </div>
              
              {/* Suggestion */}
              <div className="text-[14.5px] font-light text-notion-text-sub leading-relaxed">
                Suggestion:{' '}
                <span className="text-notion-text-main font-normal break-all">
                  {companyData.resumeMatch?.suggestion || 'Resume keyword matches look good.'}
                </span>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={handleGenerateInsights}
                  className="px-3.5 py-1.5 border border-notion-border hover:border-slate-300 bg-white hover:bg-slate-50 text-[12.5px] text-slate-700 hover:text-slate-900 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-3xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#415b33]" />
                  <span>Re-Generate Analysis</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: JOB DESCRIPTION ANALYSIS */}
          <div className="border-t border-notion-border pt-6">
            <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase mb-3.5">
              Job Description Analysis
            </h2>
            
            <div className="space-y-2.5 text-[14.5px] font-light leading-relaxed text-notion-text-sub">
              <div>
                Skills:{' '}
                <span className="text-notion-text-main font-semibold break-all">
                  {companyData.requiredSkills && companyData.requiredSkills.length > 0 ? companyData.requiredSkills.join(', ') : 'None specified'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: SKILL GAP */}
          <div className="border-t border-notion-border pt-6">
            <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase mb-3.5">
              Skill Gap
            </h2>
            
            {(!companyData.missingSkills || companyData.missingSkills.length === 0) ? (
              <div className="p-6 border border-notion-border rounded-xl bg-white text-center text-notion-text-sub font-light italic">
                No skill gaps detected.
              </div>
            ) : (
              <div className="border border-notion-border rounded-xl bg-white shadow-3xs overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-notion-border bg-[#fafaf9] text-notion-text-sub select-none text-[12.5px]">
                      <th className="py-2.5 px-5 font-medium tracking-wide w-1/2">Job requirement</th>
                      <th className="py-2.5 px-5 font-medium tracking-wide w-1/2">Gap Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f1ef] text-[14px]">
                    {companyData.requiredSkills && companyData.requiredSkills.map((skill, idx) => {
                      const isMissing = companyData.missingSkills.includes(skill);
                      return (
                        <tr key={idx} className="hover:bg-[#fafaf9]/30">
                          <td className="py-3 px-5 font-medium text-notion-text-main break-all">
                            {skill}
                          </td>
                          <td className="py-3 px-5">
                            {isMissing ? (
                              <span className="text-[#b45309] font-medium">× missing</span>
                            ) : (
                              <span className="text-[#3d8438] font-medium">✓ matched</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 4: PREPARATION CHECKLIST */}
          <div className="border-t border-notion-border pt-6">
            <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase mb-3.5">
              Preparation Checklist
            </h2>
            
            {companyData.checklist && companyData.checklist.length > 0 ? (
              <div className="space-y-3 pl-1 text-[14.5px] font-normal">
                {companyData.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-400 bg-transparent inline-block shrink-0 relative -top-[0.5px]"></span>
                    <span className="font-light break-all">{item.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 border border-notion-border rounded-xl bg-white text-center text-notion-text-sub font-light italic">
                No preparation checklist available.
              </div>
            )}
          </div>

        </div>
      ) : null}

    </div>
  );
};

export default Insights;
