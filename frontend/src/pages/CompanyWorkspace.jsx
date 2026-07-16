import React, { useState } from 'react';
import toast from "react-hot-toast";
import { useConfirm } from "../context/ConfirmContext";
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit2, Check, Plus, X, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import Loader from "../components/Loader";

const STATUS_OPTIONS = ['Wishlist', 'Applied', 'Prepping', 'Offered', 'Rejected', 'Saved'];

const CompanyWorkspace = () => {
  const confirm = useConfirm();
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  // Note form state
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  // Resume form state
  const [resumeForm, setResumeForm] = useState({
    name: '',
    version: 'v1.0',
    role: 'Software Engineer',
    notes: '',
    tags: '',
    content: '',
    size: '120 KB'
  });

  // Edit states for sections
  const [isEditingJD, setIsEditingJD] = useState(false);
  const [jdText, setJdText] = useState('');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);

  const [newSkillInput, setNewSkillInput] = useState('');
  const [newMissingSkillInput, setNewMissingSkillInput] = useState('');

  const [newMilestoneInput, setNewMilestoneInput] = useState('');
  const [newChecklistInput, setNewChecklistInput] = useState('');

  const [isEditingMatch, setIsEditingMatch] = useState(false);
  const [matchScore, setMatchScore] = useState(50);
  const [matchKeywords, setMatchKeywords] = useState('');
  const [matchSuggestion, setMatchSuggestion] = useState('');

  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [wentWellText, setWentWellText] = useState('');
  const [struggledText, setStruggledText] = useState('');
  const [reviseText, setReviseText] = useState('');

  // 1. Fetch company workspace using React Query
  const { data: companyData, isLoading: loading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: () => api.getCompany(id),
  });

  // 1.5 Fetch user's saved resumes database using React Query
  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: api.getResumes
  });

  // 2. Define Mutation for updating workspace sections
  const updateMutation = useMutation({
    mutationFn: (updatedData) => api.updateCompany(id, updatedData),
    // Optimistic UI updates
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: ['company', id] });
      const previousCompany = queryClient.getQueryData(['company', id]);
      queryClient.setQueryData(['company', id], updatedData);
      return { previousCompany };
    },
    onError: (err, updatedData, context) => {
      if (context?.previousCompany) {
        queryClient.setQueryData(['company', id], context.previousCompany);
      }
      toast.error('Failed to save workspace changes: ' + err.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] }); // refresh list caches
    }
  });

  // 2.5 Define AI analysis mutation inside the component
  const analyzeMutation = useMutation({
    mutationFn: () => api.generateCompanyAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
  });

  const triggerUpdate = (updatedFields) => {
    if (!companyData) return;
    updateMutation.mutate({
      ...companyData,
      ...updatedFields
    });
  };

  const handleUploadCompanyResume = (e) => {
    e.preventDefault();
    if (!resumeForm.name.trim() || !resumeForm.content.trim()) return;
    const name = resumeForm.name.endsWith('.pdf') ? resumeForm.name : `${resumeForm.name}.pdf`;
    
    updateMutation.mutate({
      ...companyData,
      resume: {
        name,
        version: resumeForm.version || 'v1.0',
        role: resumeForm.role || 'Software Engineer',
        size: resumeForm.size || '120 KB',
        notes: resumeForm.notes || 'Tailored resume for this application.',
        tags: resumeForm.tags ? resumeForm.tags.split(',').map(t => t.trim()) : ['General'],
        content: resumeForm.content
      }
    }, {
      onSuccess: (updatedCompany) => {
        if (updatedCompany.jd && updatedCompany.jd.trim() !== '') {
          analyzeMutation.mutate();
        }
      }
    });
    
    // Reset form
    setResumeForm({
      name: '',
      version: 'v1.0',
      role: 'Software Engineer',
      notes: '',
      tags: '',
      content: '',
      size: '120 KB'
    });
  };

  const handleDeleteCompanyResume = async () => {
    if (await confirm('Are you sure you want to remove the tailored resume for this company?')) {
      triggerUpdate({
        resume: {
          name: '',
          version: 'v1.0',
          role: '',
          size: '',
          notes: '',
          tags: [],
          content: ''
        },
        // Reset matching metrics
        resumeMatch: {
          score: 0,
          keywords: '',
          suggestion: ''
        }
      });
    }
  };

  const handleStatusChange = (e) => {
    triggerUpdate({ status: e.target.value });
  };

  // 01. JD Updates
  const startEditingJD = () => {
    setJdText(companyData?.jd || '');
    setIsEditingJD(true);
  };

  const saveJD = () => {
    updateMutation.mutate({
      ...companyData,
      jd: jdText
    }, {
      onSuccess: (updatedCompany) => {
        if (updatedCompany.resume?.content && updatedCompany.resume.content.trim() !== '') {
          analyzeMutation.mutate();
        }
      }
    });
    setIsEditingJD(false);
  };

  // 02. Required Skills Updates
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && newSkillInput.trim()) {
      e.preventDefault();
      const current = companyData?.requiredSkills || [];
      if (!current.includes(newSkillInput.trim())) {
        triggerUpdate({ requiredSkills: [...current, newSkillInput.trim()] });
      }
      setNewSkillInput('');
    }
  };

  const handleDeleteSkill = (skillToDelete) => {
    const current = companyData?.requiredSkills || [];
    triggerUpdate({ requiredSkills: current.filter(s => s !== skillToDelete) });
  };

  const handleSetHighlightSkill = (skill) => {
    triggerUpdate({ highlightedSkill: skill });
  };

  // 03. Progress Updates
  const toggleProgress = (index) => {
    if (!companyData) return;
    const progressCopy = [...companyData.progress];
    progressCopy[index] = { ...progressCopy[index], completed: !progressCopy[index].completed };
    triggerUpdate({ progress: progressCopy });
  };

  const handleAddMilestone = (e) => {
    if (e.key === 'Enter' && newMilestoneInput.trim()) {
      e.preventDefault();
      const current = companyData?.progress || [];
      triggerUpdate({
        progress: [...current, { name: newMilestoneInput.trim(), completed: false }]
      });
      setNewMilestoneInput('');
    }
  };

  const handleDeleteMilestone = (idxToDelete) => {
    const current = companyData?.progress || [];
    triggerUpdate({ progress: current.filter((_, idx) => idx !== idxToDelete) });
  };

  // 04. Missing Skills Updates
  const handleAddMissingSkill = (e) => {
    if (e.key === 'Enter' && newMissingSkillInput.trim()) {
      e.preventDefault();
      const current = companyData?.missingSkills || [];
      if (!current.includes(newMissingSkillInput.trim())) {
        triggerUpdate({ missingSkills: [...current, newMissingSkillInput.trim()] });
      }
      setNewMissingSkillInput('');
    }
  };

  const handleDeleteMissingSkill = (skillToDelete) => {
    const current = companyData?.missingSkills || [];
    triggerUpdate({ missingSkills: current.filter(s => s !== skillToDelete) });
  };

  // 05. Study Checklist Updates
  const toggleChecklist = (index) => {
    if (!companyData) return;
    const checklistCopy = [...companyData.checklist];
    checklistCopy[index] = { ...checklistCopy[index], completed: !checklistCopy[index].completed };
    triggerUpdate({ checklist: checklistCopy });
  };

  const handleAddChecklistItemSubmit = () => {
    if (!newChecklistInput.trim()) return;
    const current = companyData?.checklist || [];
    triggerUpdate({
      checklist: [...current, { text: newChecklistInput.trim(), completed: false }]
    });
    setNewChecklistInput('');
  };

  const handleAddChecklistItem = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChecklistItemSubmit();
    }
  };

  const handleDeleteChecklistItem = (idxToDelete) => {
    const current = companyData?.checklist || [];
    triggerUpdate({ checklist: current.filter((_, idx) => idx !== idxToDelete) });
  };

  // 06. Resume Match Updates
  const startEditingMatch = () => {
    setMatchScore(companyData?.resumeMatch?.score || 50);
    setMatchKeywords(companyData?.resumeMatch?.keywords || '');
    setMatchSuggestion(companyData?.resumeMatch?.suggestion || '');
    setIsEditingMatch(true);
  };

  const saveMatchData = () => {
    triggerUpdate({
      resumeMatch: {
        score: parseInt(matchScore, 10) || 50,
        keywords: matchKeywords,
        suggestion: matchSuggestion
      }
    });
    setIsEditingMatch(false);
  };

  // 07. Notes Updates
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!companyData || !newNoteTitle.trim()) return;
    const newNote = { title: newNoteTitle.trim(), content: newNoteContent.trim() };
    triggerUpdate({ notes: [...companyData.notes, newNote] });
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowNoteForm(false);
  };

  const handleDeleteNote = async (noteId) => {
    if (await confirm('Delete this interview note?')) {
      const current = companyData?.notes || [];
      triggerUpdate({ notes: current.filter(n => n._id !== noteId && n.id !== noteId) });
    }
  };

  // 08. Reflection Updates
  const startEditingReflection = () => {
    setWentWellText(companyData?.reflection?.wentWell || '');
    setStruggledText(companyData?.reflection?.struggled || '');
    setReviseText(companyData?.reflection?.revise || '');
    setIsEditingReflection(true);
  };

  const saveReflection = () => {
    triggerUpdate({
      reflection: {
        wentWell: wentWellText,
        struggled: struggledText,
        revise: reviseText
      }
    });
    setIsEditingReflection(false);
  };

  // Calculate progress stats dynamically
  const progressStats = React.useMemo(() => {
    if (!companyData || !companyData.progress) return { fraction: '0/0', percentage: '0%' };
    const total = companyData.progress.length;
    const completed = companyData.progress.filter(item => item.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { fraction: `${completed}/${total}`, percentage: `${percentage}%` };
  }, [companyData]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-24">
        <Loader size="lg" text="Loading company workspace..." />
      </div>
    );
  }

  if (error || !companyData) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center font-sans">
        <div className="text-lg text-red-600 font-medium mb-4">
          {error ? `Failed to load workspace: ${error.message}` : 'Workspace not found'}
        </div>
        <Link to="/companies" className="text-[#415b33] hover:underline text-sm font-medium">
          Return to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-8 font-sans select-none animate-fade-in text-notion-text-main">
      
      {/* Back button */}
      <Link
        to="/companies"
        className="inline-flex items-center gap-1.5 text-xs text-notion-text-sub hover:text-notion-text-main transition-colors mb-6 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Companies
      </Link>

      {/* Workspace Header */}
      <div className="mb-10">
        <h1 className="font-serif text-[42px] font-normal tracking-tight leading-tight mb-2">
          {companyData.name}
        </h1>
        
        {/* Subtitle details */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-notion-text-sub font-light">
          <span>{companyData.role}</span>
          <span>·</span>
          <span>{companyData.package || 'Competitive'}</span>
          <span>·</span>
          <span>Deadline {companyData.deadline || 'TBD'}</span>
          <span>·</span>
          
          {/* Status Dropdown */}
          <div className="flex items-center gap-1">
            <span className="font-medium text-notion-text-sub">Status:</span>
            <select
              value={companyData.status}
              onChange={handleStatusChange}
              className="px-2 py-0.5 bg-notion-sidebar border border-notion-border rounded-md text-[13px] font-medium hover:bg-[#efefed] focus:outline-hidden cursor-pointer transition-colors"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Workspace Sections */}
      <div className="space-y-10">
        
        {/* 01 · JOB DESCRIPTION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase">
              01 · Job Description
            </h2>
            {isEditingJD ? (
              <button
                onClick={saveJD}
                className="text-[12px] font-medium text-[#3d8438] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Save
              </button>
            ) : (
              <button
                onClick={startEditingJD}
                className="text-[12px] font-medium text-notion-text-sub hover:text-notion-text-main flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
          
          {isEditingJD ? (
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows="4"
              className="w-full p-4 border border-notion-border rounded-xl text-[14.5px] focus:outline-hidden focus:border-slate-400 bg-white"
              placeholder="Paste the company Job Description here..."
            />
          ) : (
            <div className="border border-notion-border rounded-xl p-5 bg-white shadow-2xs leading-relaxed text-[14.5px] font-light">
              {companyData.jd ? `"${companyData.jd}"` : <span className="italic text-slate-400">No job description entered. Click Edit to add details.</span>}
            </div>
          )}
        </div>

        {/* 02 · TAILORED RESUME */}
        <div>
          <div className="flex items-center justify-between border-b border-notion-border pb-2.5 mb-4">
            <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase">
              02 · Tailored Resume
            </h2>
            {companyData.resume?.name && (
              <button
                onClick={handleDeleteCompanyResume}
                className="text-[12px] font-medium text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Remove Resume
              </button>
            )}
          </div>

          {companyData.resume?.name ? (
            <div className="border border-notion-border rounded-xl p-5 bg-white shadow-2xs leading-relaxed text-[14.5px]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg border bg-slate-50 border-slate-100 text-notion-text-sub">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px] leading-tight text-notion-text-main break-all">
                      {companyData.resume.name}
                    </h3>
                    <div className="text-[12px] text-notion-text-sub/80 mt-1 flex items-center gap-1.5 font-light">
                      <span>{companyData.resume.version || 'v1.0'}</span>
                      <span>·</span>
                      <span>{companyData.resume.size || '120 KB'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {companyData.resume.notes && (
                <div className="border-t border-notion-border pt-3 mt-3">
                  <span className="text-[11.5px] font-semibold text-notion-text-sub uppercase tracking-wider block mb-1">
                    Notes
                  </span>
                  <p className="text-[13.5px] text-notion-text-sub font-light">
                    {companyData.resume.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-slate-300 rounded-xl p-6 bg-[#fafaf9] text-center max-w-xl">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-[14.5px] font-semibold text-slate-700 mb-1">No tailored resume uploaded yet</h4>
              <p className="text-[12px] text-slate-400 font-light mb-4">
                Upload the custom resume you submitted for this role to enable ATS insights.
              </p>
              
              <form onSubmit={handleUploadCompanyResume} className="space-y-3.5 text-left bg-white border border-notion-border rounded-lg p-4 shadow-3xs">
                {resumes.length > 0 && (
                  <div className="mb-2.5">
                    <label className="block text-[11px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1">Select from your saved resumes</label>
                    <select
                      onChange={(e) => {
                        const selected = resumes.find(r => r._id === e.target.value);
                        if (selected) {
                          setResumeForm({
                            name: selected.name,
                            version: selected.version || 'v1.0',
                            role: selected.role || 'Software Engineer',
                            notes: selected.notes || '',
                            tags: selected.tags ? selected.tags.join(', ') : '',
                            content: selected.content || '',
                            size: selected.size || '120 KB'
                          });
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-[#fcfcfc] border border-notion-border rounded-md text-[13px] focus:outline-hidden cursor-pointer"
                    >
                      <option value="">-- Choose an existing resume --</option>
                      {resumes.map(r => (
                        <option key={r._id} value={r._id}>
                          {r.name} ({r.version})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1">Select Resume File</label>
                  <div className="border border-dashed border-slate-200 rounded-md p-3 bg-[#fafaf9] text-center hover:border-slate-300 cursor-pointer relative transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setResumeForm(prev => ({
                            ...prev,
                            name: file.name,
                            size: `${Math.round(file.size / 1024)} KB`
                          }));

                          if (file.name.toLowerCase().endsWith('.pdf')) {
                            try {
                              setIsExtractingPdf(true);
                              const text = await api.parsePdf(file);
                              setResumeForm(prev => ({
                                ...prev,
                                content: text
                              }));
                            } catch (err) {
                              toast.error('Failed to extract text from PDF: ' + err.message);
                            } finally {
                              setIsExtractingPdf(false);
                            }
                          } else {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setResumeForm(prev => ({
                                ...prev,
                                content: event.target.result
                              }));
                            };
                            reader.readAsText(file);
                          }
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="text-[12px] text-[#3d8438] font-semibold">Choose PDF/Word file</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {resumeForm.name ? `Selected: ${resumeForm.name} (${resumeForm.size || ''})` : 'Or select file to pre-fill name'}
                    </p>
                    {isExtractingPdf && (
                      <div className="mt-2"><Loader size="sm" text="Extracting text from PDF, please wait..." /></div>
                    )}
                  </div>
                </div>


                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#415b33] text-white hover:bg-[#2f4227] rounded-md text-[13px] font-medium transition-colors cursor-pointer"
                  >
                    Attach Resume
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 03 · REQUIRED SKILLS */}
        <div>
          <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase mb-3">
            03 · Required Skills
          </h2>
          {analyzeMutation.isPending ? (
            <div className="flex flex-wrap gap-2 items-center animate-pulse py-1">
              <span className="h-7 w-20 bg-slate-100 border border-slate-200/80 rounded-lg"></span>
              <span className="h-7 w-24 bg-slate-100 border border-slate-200/80 rounded-lg"></span>
              <span className="h-7 w-16 bg-slate-100 border border-slate-200/80 rounded-lg"></span>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                {companyData.requiredSkills && companyData.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className={`px-2.5 py-1 text-[13px] rounded-lg border font-normal tracking-wide transition-all inline-flex items-center gap-1 ${
                      skill === companyData.highlightedSkill
                        ? 'bg-amber-50 border-amber-200 text-amber-800 font-medium'
                        : 'bg-white border-notion-border text-notion-text-main'
                    }`}
                  >
                    <span
                      onClick={() => handleSetHighlightSkill(skill)}
                      className="cursor-pointer hover:underline"
                      title="Click to set highlight skill tag"
                    >
                      {skill}
                    </span>
                    <button
                      onClick={() => handleDeleteSkill(skill)}
                      className="hover:bg-slate-100 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                
                {/* Inline add skill */}
                <input
                  type="text"
                  placeholder="+ Add Skill (Enter)"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  className="px-2.5 py-1 text-[13px] border border-dashed border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-400 bg-transparent placeholder-slate-400 w-36"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-light mt-1.5 pl-0.5">
                Tip: Click a skill tag's name to highlight it as the core target stack.
              </p>
            </>
          )}
        </div>

        {/* 04 · MY PROGRESS */}
        <div>
          <div className="flex items-center justify-between border-b border-notion-border pb-2.5 mb-4">
            <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase">
              04 · My Progress
            </h2>
            <span className="text-[13px] font-mono font-medium text-notion-text-sub">
              {progressStats.fraction} - {progressStats.percentage}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {companyData.progress && companyData.progress.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-[14.5px] hover:bg-notion-hover/40 p-2 rounded-lg transition-colors border border-transparent hover:border-notion-border/40 group/item"
              >
                <div
                  onClick={() => toggleProgress(idx)}
                  className="flex items-center flex-1 cursor-pointer"
                >
                  {item.completed ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#415b33] inline-block mr-3 shrink-0"></span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-transparent inline-block mr-3 shrink-0"></span>
                  )}
                  <span className={item.completed ? 'line-through text-slate-400' : ''}>{item.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteMilestone(idx)}
                  className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            
            {/* Inline add milestone */}
            <div className="p-1 flex items-center border border-dashed border-slate-300 rounded-lg bg-transparent w-full">
              <input
                type="text"
                placeholder="+ Add milestone (Enter)"
                value={newMilestoneInput}
                onChange={(e) => setNewMilestoneInput(e.target.value)}
                onKeyDown={handleAddMilestone}
                className="w-full bg-transparent px-2 py-0.5 text-[13.5px] placeholder-slate-400 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 05 · MISSING SKILLS */}
        <div>
          <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase mb-3">
            05 · Missing Skills
          </h2>
          {analyzeMutation.isPending ? (
            <div className="flex flex-wrap gap-2 items-center animate-pulse py-1">
              <span className="h-7 w-20 bg-red-50/40 border border-red-100/60 rounded-lg"></span>
              <span className="h-7 w-16 bg-red-50/40 border border-red-100/60 rounded-lg"></span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
            {companyData.missingSkills && companyData.missingSkills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 bg-red-50 border border-red-100 text-red-700 text-[13px] rounded-lg font-normal tracking-wide inline-flex items-center gap-1"
              >
                <span>{skill}</span>
                <button
                  onClick={() => handleDeleteMissingSkill(skill)}
                  className="hover:bg-red-100 p-0.5 rounded text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="+ Add missing (Enter)"
              value={newMissingSkillInput}
              onChange={(e) => setNewMissingSkillInput(e.target.value)}
              onKeyDown={handleAddMissingSkill}
              className="px-2.5 py-1 text-[13px] border border-dashed border-red-200 text-red-700 placeholder-red-300 rounded-lg focus:outline-hidden focus:border-red-400 bg-transparent w-36"
            />
          </div>
          )}
        </div>

        {/* 06 · STUDY CHECKLIST */}
        <div>
          <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase mb-3">
            06 · Study Checklist
          </h2>
          <div className="space-y-2.5 pl-1">
            {companyData.checklist && companyData.checklist.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-[14.5px] group/check max-w-xl"
              >
                <div
                  onClick={() => toggleChecklist(idx)}
                  className="flex items-center cursor-pointer flex-1 py-0.5 hover:text-[#3d8438] transition-colors"
                >
                  {item.completed ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#415b33] inline-block mr-3.5 shrink-0"></span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-transparent inline-block mr-3.5 shrink-0"></span>
                  )}
                  <span className={item.completed ? 'line-through text-notion-text-sub/70 font-light' : 'font-normal'}>
                    {item.text}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteChecklistItem(idx)}
                  className="opacity-0 group-hover/check:opacity-100 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            
             {/* Inline Add Checklist Item */}
            <div className="flex items-center max-w-xl gap-2 mt-2">
              <input
                type="text"
                placeholder="Add study checklist item..."
                value={newChecklistInput}
                onChange={(e) => setNewChecklistInput(e.target.value)}
                onKeyDown={handleAddChecklistItem}
                className="flex-1 px-3 py-1.5 border border-notion-border rounded-lg text-[14px] placeholder-slate-400 focus:outline-hidden focus:border-slate-400 bg-white"
              />
              <button
                onClick={handleAddChecklistItemSubmit}
                className="px-3.5 py-1.5 bg-[#415b33] hover:bg-[#2f4227] text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* 07 · RESUME MATCH */}
        <div>
          <div className="flex items-center justify-between border-b border-notion-border pb-2.5 mb-4">
            <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase">
              07 · Resume Match
            </h2>
            {isEditingMatch ? (
              <button
                onClick={saveMatchData}
                className="text-[12px] font-medium text-[#3d8438] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Save
              </button>
            ) : (
              <button
                onClick={startEditingMatch}
                className="text-[12px] font-medium text-notion-text-sub hover:text-notion-text-main flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
          
          {isEditingMatch ? (
            <div className="border border-notion-border rounded-xl p-5 bg-white space-y-4 max-w-xl shadow-xs">
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 uppercase mb-1">Match Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={matchScore}
                  onChange={(e) => setMatchScore(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-md text-[13.5px] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 uppercase mb-1">Missing Keywords</label>
                <input
                  type="text"
                  value={matchKeywords}
                  onChange={(e) => setMatchKeywords(e.target.value)}
                  placeholder="e.g. AWS, DynamoDB"
                  className="w-full px-3 py-1.5 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-md text-[13.5px] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 uppercase mb-1">ATS Recommendation</label>
                <input
                  type="text"
                  value={matchSuggestion}
                  onChange={(e) => setMatchSuggestion(e.target.value)}
                  placeholder="e.g. explicitly mention projects built with AWS Lambda"
                  className="w-full px-3 py-1.5 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-md text-[13.5px] focus:outline-hidden"
                />
              </div>
            </div>
          ) : analyzeMutation.isPending ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-10 w-24 bg-slate-100 rounded-md"></div>
              <div className="border border-notion-border rounded-xl p-5 bg-[#fafaf9] space-y-2.5">
                <div className="h-4 w-48 bg-slate-200/60 rounded"></div>
                <div className="h-4 w-64 bg-slate-200/60 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-[34px] font-normal font-sans tracking-tight">
                <span className="font-semibold text-notion-text-main">{companyData.resumeMatch?.score || 0}</span>
                <span className="text-notion-text-sub text-[22px] font-light">/100</span>
              </div>
              <div className="border border-notion-border rounded-xl p-5 bg-[#fafaf9] space-y-2.5 text-[14px] leading-relaxed">
                <div className="font-light text-notion-text-sub">
                  Missing keywords: <span className="font-semibold text-amber-700">{companyData.resumeMatch?.keywords || 'None'}</span>
                </div>
                <div className="font-light text-notion-text-sub">
                  Suggestions: <span className="font-medium">{companyData.resumeMatch?.suggestion || 'Resume keyword matches look good.'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 08 · INTERVIEW NOTES */}
        <div>
          <div className="flex items-center justify-between border-b border-notion-border pb-2.5 mb-4">
            <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase">
              08 · Interview Notes
            </h2>
            <button
              onClick={() => setShowNoteForm(!showNoteForm)}
              className="text-[12.5px] font-semibold text-notion-text-sub hover:text-notion-text-main transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New note</span>
            </button>
          </div>

          {/* Note form */}
          {showNoteForm && (
            <form onSubmit={handleAddNote} className="border border-notion-border rounded-xl p-5 bg-white space-y-3.5 mb-4 max-w-lg shadow-xs">
              <div>
                <input
                  type="text"
                  placeholder="e.g. Round 2 — System Design · Jul 12"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-md text-[13.5px] focus:outline-hidden transition-colors"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Discussed requirements, scaling database structures, bottlenecks..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-1.5 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-md text-[13.5px] focus:outline-hidden resize-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#415b33] text-white hover:bg-[#2f4227] rounded-md text-[12.5px] font-medium transition-colors cursor-pointer"
                >
                  Save Note
                </button>
                <button
                  type="button"
                  onClick={() => setShowNoteForm(false)}
                  className="px-3.5 py-1.5 border border-notion-border hover:border-slate-300 rounded-md text-[12.5px] font-normal hover:bg-notion-hover transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Notes list */}
          {companyData.notes && companyData.notes.length > 0 ? (
            <div className="space-y-4">
              {companyData.notes.map((note) => (
                <div key={note._id || note.id} className="border border-notion-border rounded-xl p-5 bg-white shadow-2xs group/note relative">
                  <div className="absolute top-4 right-4 opacity-0 group-hover/note:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDeleteNote(note._id || note.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-[14.5px] mb-2 pr-8">
                    {note.title}
                  </h3>
                  <p className="text-[13.5px] text-notion-text-sub whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[13.5px] text-notion-text-sub font-light italic pl-1">
              No interview notes logged yet.
            </div>
          )}
        </div>

        {/* 09 · REFLECTION */}
        <div>
          <div className="flex items-center justify-between border-b border-notion-border pb-2.5 mb-4">
            <h2 className="text-[12.5px] font-semibold text-notion-text-sub tracking-wider uppercase">
              09 · Reflection
            </h2>
            {isEditingReflection ? (
              <button
                onClick={saveReflection}
                className="text-[12px] font-medium text-[#3d8438] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Save
              </button>
            ) : (
              <button
                onClick={startEditingReflection}
                className="text-[12px] font-medium text-notion-text-sub hover:text-notion-text-main flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          {isEditingReflection ? (
            <div className="border border-notion-border rounded-xl p-5 bg-white space-y-4 max-w-xl shadow-xs">
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 uppercase mb-1">What went well</label>
                <textarea
                  value={wentWellText}
                  onChange={(e) => setWentWellText(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-1.5 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-md text-[13.5px] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 uppercase mb-1">What I struggled with</label>
                <textarea
                  value={struggledText}
                  onChange={(e) => setStruggledText(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-1.5 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-md text-[13.5px] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-500 uppercase mb-1">Concepts to revise</label>
                <input
                  type="text"
                  value={reviseText}
                  onChange={(e) => setReviseText(e.target.value)}
                  placeholder="e.g. Redis caching patterns"
                  className="w-full px-3 py-1.5 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-md text-[13.5px] focus:outline-hidden"
                />
              </div>
            </div>
          ) : (
            <div className="border border-notion-border rounded-xl p-5 bg-white shadow-2xs space-y-4 text-[14px]">
              <div>
                <div className="font-semibold mb-1">What went well:</div>
                <div className="text-notion-text-sub font-light leading-relaxed">
                  {companyData.reflection?.wentWell || <span className="italic text-slate-400">None logged yet.</span>}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">What I struggled with:</div>
                <div className="text-notion-text-sub font-light leading-relaxed">
                  {companyData.reflection?.struggled || <span className="italic text-slate-400">None logged yet.</span>}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">Concepts to revise:</div>
                {companyData.reflection?.revise ? (
                  <div className="text-slate-800 font-medium bg-slate-50 border border-slate-100/80 px-3 py-1.5 rounded-lg inline-block text-[13px] tracking-wide mt-1">
                    {companyData.reflection.revise}
                  </div>
                ) : (
                  <div className="text-notion-text-sub font-light italic mt-1">No revision concepts logged.</div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CompanyWorkspace;
