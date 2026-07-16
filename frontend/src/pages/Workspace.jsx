import React, { useState } from 'react';
import toast from "react-hot-toast";
import { useConfirm } from "../context/ConfirmContext";
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { BookOpen, Clock, FileText, Plus, Trash, X, ExternalLink, Code, FileText as NoteIcon, UploadCloud, CheckCircle, Edit, Save } from 'lucide-react';
import Loader from "../components/Loader";

const DotTracker = ({ count, onChange }) => {
  const confirm = useConfirm();
  return (
    <div className="flex gap-1.5 items-center justify-center">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            if (onChange) onChange(i + 1);
          }}
          className={`w-3.5 h-3.5 rounded-full cursor-pointer border transition-all duration-150 hover:scale-110 ${
            i < count
              ? 'bg-[#415b33] border-transparent' // Notion forest green
              : 'bg-[#fafaf9] border-[#d6ded9] hover:border-slate-400' // Empty dot
          }`}
        ></span>
      ))}
    </div>
  );
};

const Workspace = () => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Learning');
  const [expandedTopicId, setExpandedTopicId] = useState(null);

  // Modal States
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);

  // Edit / Active item references for edit modals
  const [editingNote, setEditingNote] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  // Form States
  const [topicForm, setTopicForm] = useState({ name: '', progress: 1, notes: '', resourcesName: '', resourcesUrl: '' });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', stack: '', status: 'In Progress' });
  const [noteForm, setNoteForm] = useState({ title: '', category: 'Technical', content: '' });
  const [resumeForm, setResumeForm] = useState({ name: '', version: 'v1.0', role: 'Software Engineer', notes: '', tags: '', content: '', size: '120 KB' });

  // ==========================================
  // 1. DATA FETCHING (REACT QUERY)
  // ==========================================
  
  const { data: topics = [], isLoading: loadingTopics, error: errorTopics } = useQuery({
    queryKey: ['topics'],
    queryFn: api.getTopics,
    enabled: activeTab === 'Learning'
  });

  const { data: resumes = [], isLoading: loadingResumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: api.getResumes,
    enabled: activeTab === 'Resume'
  });

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
    enabled: activeTab === 'Projects'
  });

  const { data: notes = [], isLoading: loadingNotes } = useQuery({
    queryKey: ['notes'],
    queryFn: api.getNotes,
    enabled: activeTab === 'Notes'
  });

  const primaryResume = React.useMemo(() => {
    return resumes.find(r => r.isActive) || resumes[0] || null;
  }, [resumes]);

  // ==========================================
  // 2. DATA MUTATIONS (REACT QUERY)
  // ==========================================

  // Learning Topics Mutations
  const createTopicMutation = useMutation({
    mutationFn: api.createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    }
  });

  const updateTopicMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateTopic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    }
  });

  const deleteTopicMutation = useMutation({
    mutationFn: api.deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    }
  });

  // Resumes Mutations
  const createResumeMutation = useMutation({
    mutationFn: api.createResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    }
  });

  const deleteResumeMutation = useMutation({
    mutationFn: api.deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    }
  });

  // Projects Mutations
  const createProjectMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  // Notes Mutations
  const createNoteMutation = useMutation({
    mutationFn: api.createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: api.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  // ==========================================
  // 3. EVENT HANDLERS
  // ==========================================

  const handleProgressChange = (topic, newScore) => {
    const status = newScore >= 4 ? 'Fresh' : 'Revision due';
    updateTopicMutation.mutate({
      id: topic._id,
      data: {
        ...topic,
        progress: newScore,
        status,
        lastRevised: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      }
    });
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!topicForm.name.trim()) return;

    const payload = {
      name: topicForm.name.trim(),
      progress: parseInt(topicForm.progress, 10) || 1,
      status: topicForm.progress >= 4 ? 'Fresh' : 'Revision due',
      lastRevised: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      notes: topicForm.notes ? topicForm.notes.split('\n').map(n => n.trim()).filter(Boolean) : [],
      resources: topicForm.resourcesName ? [{ name: topicForm.resourcesName.trim(), url: topicForm.resourcesUrl.trim() || '#' }] : []
    };

    try {
      await createTopicMutation.mutateAsync(payload);
      setTopicForm({ name: '', progress: 1, notes: '', resourcesName: '', resourcesUrl: '' });
      setIsTopicModalOpen(false);
    } catch (err) {
      toast.error('Failed to save topic: ' + err.message);
    }
  };

  const handleDeleteTopic = async (e, id) => {
    e.stopPropagation();
    if (await confirm('Delete this learning topic?')) {
      try {
        await deleteTopicMutation.mutateAsync(id);
        if (expandedTopicId === id) setExpandedTopicId(null);
      } catch (err) {
        toast.error('Failed to delete topic: ' + err.message);
      }
    }
  };

  // Resume Upload Handler
  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    if (!resumeForm.name.trim()) return;

    const name = resumeForm.name.endsWith('.pdf') ? resumeForm.name : `${resumeForm.name}.pdf`;
    const payload = {
      name,
      version: resumeForm.version || 'v1.0',
      role: resumeForm.role || 'Software Engineer',
      size: resumeForm.size || '120 KB',
      notes: resumeForm.notes || 'Tailored resume draft.',
      tags: resumeForm.tags ? resumeForm.tags.split(',').map(t => t.trim()) : ['General'],
      content: resumeForm.content || ''
    };

    try {
      const created = await createResumeMutation.mutateAsync(payload);
      // Automatically make it primary if it is the first one
      if (resumes.length === 0) {
        await api.setPrimaryResume(created._id);
        queryClient.invalidateQueries({ queryKey: ['resumes'] });
      }
      setResumeForm({ name: '', version: 'v1.0', role: 'Software Engineer', notes: '', tags: '', content: '', size: '120 KB' });
      setIsResumeModalOpen(false);
    } catch (err) {
      toast.error('Failed to save resume: ' + err.message);
    }
  };

  const handleDeleteResume = async (id) => {
    if (await confirm('Are you sure you want to delete this resume version?')) {
      try {
        await deleteResumeMutation.mutateAsync(id);
      } catch (err) {
        toast.error('Failed to delete resume: ' + err.message);
      }
    }
  };

  // Projects CRUD
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;

    const payload = {
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      stack: projectForm.stack ? projectForm.stack.split(',').map(s => s.trim()).filter(Boolean) : [],
      status: projectForm.status
    };

    try {
      if (editingProject) {
        await updateProjectMutation.mutateAsync({ id: editingProject._id, data: payload });
      } else {
        await createProjectMutation.mutateAsync(payload);
      }
      setProjectForm({ title: '', description: '', stack: '', status: 'In Progress' });
      setEditingProject(null);
      setIsProjectModalOpen(false);
    } catch (err) {
      toast.error('Failed to save project: ' + err.message);
    }
  };

  const handleOpenEditProject = (e, project) => {
    e.stopPropagation();
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description || '',
      stack: project.stack ? project.stack.join(', ') : '',
      status: project.status || 'In Progress'
    });
    setIsProjectModalOpen(true);
  };

  const handleOpenAddProject = () => {
    setEditingProject(null);
    setProjectForm({ title: '', description: '', stack: '', status: 'In Progress' });
    setIsProjectModalOpen(true);
  };

  // Notes CRUD
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return;

    const payload = {
      title: noteForm.title.trim(),
      category: noteForm.category,
      content: noteForm.content.trim()
    };

    try {
      if (editingNote) {
        await updateNoteMutation.mutateAsync({ id: editingNote._id, data: payload });
      } else {
        await createNoteMutation.mutateAsync(payload);
      }
      setNoteForm({ title: '', category: 'Technical', content: '' });
      setEditingNote(null);
      setIsNoteModalOpen(false);
    } catch (err) {
      toast.error('Failed to save note: ' + err.message);
    }
  };

  const handleOpenEditNote = (e, note) => {
    e.stopPropagation();
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      category: note.category || 'Technical',
      content: note.content || ''
    });
    setIsNoteModalOpen(true);
  };

  const handleOpenAddNote = () => {
    setEditingNote(null);
    setNoteForm({ title: '', category: 'Technical', content: '' });
    setIsNoteModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 font-sans select-none animate-fade-in text-notion-text-main">
      
      {/* Workspace Header */}
      <h1 className="font-serif text-[40px] font-normal tracking-tight text-notion-text-main mb-8">
        Workspace
      </h1>

      {/* Tabs list */}
      <div className="flex border-b border-notion-border mb-8 relative justify-between items-center">
        <div className="flex">
          {['Learning', 'Resume', 'Projects', 'Notes'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setExpandedTopicId(null);
                }}
                className={`px-5 py-2.5 text-[15px] font-medium transition-all relative cursor-pointer border-b-2 -mb-[1px] ${
                  isActive
                    ? 'text-[#3d8438] border-[#3d8438]'
                    : 'text-notion-text-sub border-transparent hover:text-notion-text-main'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Action Button depending on tab */}
        {activeTab === 'Learning' && (
          <button
            onClick={() => setIsTopicModalOpen(true)}
            className="px-3.5 py-1.5 border border-notion-border hover:border-slate-300 bg-white rounded-lg text-[13px] hover:bg-[#efefed] transition-colors shadow-3xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Topic</span>
          </button>
        )}
        {activeTab === 'Projects' && (
          <button
            onClick={handleOpenAddProject}
            className="px-3.5 py-1.5 border border-notion-border hover:border-slate-300 bg-white rounded-lg text-[13px] hover:bg-[#efefed] transition-colors shadow-3xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Project</span>
          </button>
        )}
        {activeTab === 'Notes' && (
          <button
            onClick={handleOpenAddNote}
            className="px-3.5 py-1.5 border border-notion-border hover:border-slate-300 bg-white rounded-lg text-[13px] hover:bg-[#efefed] transition-colors shadow-3xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Note</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="transition-all duration-150">
        
        {/* LEARNING TAB */}
        {activeTab === 'Learning' && (
          <div className="space-y-6">
            {loadingTopics ? (
              <div className="py-12"><Loader text="Loading study topics..." /></div>
            ) : topics.length > 0 ? (
              <div className="border border-notion-border rounded-xl bg-white shadow-2xs overflow-hidden">
                <div className="divide-y divide-notion-border">
                  {topics.map((topic) => {
                    const isExpanded = expandedTopicId === topic._id;
                    const isRevisionDue = topic.status === 'Revision due';
                    
                    return (
                      <div key={topic._id} className="transition-colors hover:bg-[#fafaf9]/30">
                        
                        {/* Topic row layout */}
                        <div
                          onClick={() => setExpandedTopicId(isExpanded ? null : topic._id)}
                          className="flex items-center justify-between py-4 px-6 cursor-pointer group"
                        >
                          {/* Topic name */}
                          <div className="text-[15.5px] font-medium text-notion-text-main w-1/3 flex items-center gap-2">
                            <span className="break-all">{topic.name}</span>
                            <button
                              onClick={(e) => handleDeleteTopic(e, topic._id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-all"
                              title="Delete Topic"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Dot progress tracker */}
                          <div className="w-1/3 flex justify-center">
                            <DotTracker
                              count={topic.progress}
                              onChange={(score) => handleProgressChange(topic, score)}
                            />
                          </div>

                          {/* Status Label */}
                          <div className="w-1/3 flex justify-end text-[14px]">
                            <span
                              className={
                                isRevisionDue
                                  ? 'text-[#b45309] font-normal'
                                  : 'text-notion-text-sub font-light'
                              }
                            >
                              {topic.status}
                            </span>
                          </div>
                        </div>

                        {/* Expandable content area */}
                        {isExpanded && (
                          <div className="px-6 pb-6 pt-1 bg-[#fafaf9]/50 border-t border-[#f1f1ef] animate-fade-in space-y-4 text-[14px]">
                            
                            <div className="flex items-center gap-1.5 text-xs text-notion-text-sub font-light">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Last revised: {topic.lastRevised}</span>
                            </div>

                            {/* Quick Notes list */}
                            <div className="space-y-2">
                              <div className="font-semibold text-notion-text-main flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" /> Quick Notes
                              </div>
                              {topic.notes && topic.notes.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-1.5 text-notion-text-sub font-light leading-relaxed break-all">
                                  {topic.notes.map((note, idx) => (
                                    <li key={idx}>{note}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="italic text-slate-400 pl-1 font-light">No quick notes added yet.</p>
                              )}
                            </div>

                            {/* Resources flex tags */}
                            <div className="space-y-2">
                              <div className="font-semibold text-notion-text-main flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" /> Resources
                              </div>
                              {topic.resources && topic.resources.length > 0 ? (
                                <div className="flex flex-wrap gap-2.5 pl-1.5">
                                  {topic.resources.map((res, idx) => (
                                    <a
                                      key={idx}
                                      href={res.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-notion-border hover:border-slate-300 text-[12.5px] rounded-lg text-[#3d8438] font-medium transition-all shadow-3xs break-all"
                                    >
                                      {res.name}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <p className="italic text-slate-400 pl-1 font-light">No resources listed.</p>
                              )}
                            </div>

                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-xl p-12 text-center bg-white shadow-3xs max-w-xl mx-auto my-6">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-notion-text-main mb-1.5">No learning topics logged</h3>
                <p className="text-sm text-slate-400 font-light max-w-sm mx-auto mb-6">
                  Add revision subjects (DSA, DBMS, OS, React) to track your interview level and check off guidelines.
                </p>
                <button
                  onClick={() => setIsTopicModalOpen(true)}
                  className="px-4 py-2 bg-[#415b33] text-white hover:bg-[#2f4227] rounded-lg text-[13.5px] font-medium transition-all shadow-xs cursor-pointer"
                >
                  + Add your first topic
                </button>
              </div>
            )}
          </div>
        )}

        {/* RESUME TAB */}
        {activeTab === 'Resume' && (
          <div className="space-y-6 animate-fade-in">
            {primaryResume ? (
              <div className="space-y-6">
                {/* Score Card */}
                <div className="border border-notion-border rounded-xl p-6 bg-white shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="text-center md:border-r border-notion-border py-2">
                    <div className="text-xs text-notion-text-sub font-semibold tracking-wider uppercase mb-1.5">
                      ATS Match Score
                    </div>
                    <div className="text-5xl font-mono font-bold text-[#3d8438]">
                      {primaryResume.atsScore !== undefined ? `${primaryResume.atsScore}%` : '—'}
                    </div>
                  </div>
                  <div className="col-span-2 space-y-3 pl-2">
                    <h3 className="font-serif text-[20px] text-notion-text-main">
                      Active Resume Details
                    </h3>
                    <div className="text-[13.5px] text-notion-text-sub font-light space-y-1">
                      <div><span className="font-semibold text-slate-700">Filename:</span> <span className="break-all">{primaryResume.name}</span></div>
                      <div><span className="font-semibold text-slate-700">Target Role:</span> <span className="break-all">{primaryResume.role}</span></div>
                      <div><span className="font-semibold text-slate-700">Notes:</span> <span className="break-all">{primaryResume.notes}</span></div>
                    </div>
                    
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => handleDeleteResume(primaryResume._id)}
                        className="px-3.5 py-1.5 border border-red-100 text-red-600 hover:bg-red-50 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer"
                      >
                        Delete Resume
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsResumeModalOpen(true)}
                className="border-2 border-dashed border-notion-border rounded-xl p-12 bg-[#fafaf9] text-center hover:border-slate-400 transition-colors cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <UploadCloud className="w-10 h-10 text-notion-text-sub animate-bounce" />
                <div>
                  <span className="text-[14.5px] text-[#3d8438] font-semibold hover:underline">Click to upload</span>
                  <span className="text-[14.5px] text-notion-text-sub font-light"> or drag and drop your PDF</span>
                </div>
                <p className="text-xs text-notion-text-sub/70 font-light">
                  PDF format · Maximum size 5MB
                </p>
              </div>
            )}
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'Projects' && (
          <div className="space-y-4">
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="border border-notion-border rounded-xl p-5 bg-white hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between group relative"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => handleOpenEditProject(e, project)}
                        className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(e, project._id)}
                        className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3.5 pr-12">
                        <span className="text-[13.5px] font-semibold text-notion-text-main break-all pr-2">
                          {project.title}
                        </span>
                        <span className={`px-2 py-0.5 text-[11px] rounded-lg border font-medium shrink-0 ${
                          project.status === 'Completed'
                            ? 'bg-emerald-50 border-emerald-100 text-[#3d8438]'
                            : 'bg-amber-50 border-amber-100 text-amber-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-[13px] text-notion-text-sub font-light leading-relaxed mb-4 break-all">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#f1f1ef]">
                      {project.stack && project.stack.map(tech => (
                        <span key={tech} className="px-2 py-0.5 bg-[#fafaf9] border border-notion-border text-[11.5px] rounded text-notion-text-sub font-light break-all">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-xl p-12 text-center bg-white shadow-3xs max-w-xl mx-auto my-6">
                <Code className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-notion-text-main mb-1.5">No projects yet.</h3>
                <p className="text-sm text-slate-400 font-light max-w-sm mx-auto mb-6">
                  List portfolio items to showcase on your CV matches and reference core tech stacks during system design preps.
                </p>
                <button
                  onClick={handleOpenAddProject}
                  className="px-4 py-2 bg-[#415b33] text-white hover:bg-[#2f4227] rounded-lg text-[13.5px] font-medium transition-all shadow-xs cursor-pointer"
                >
                  + Add your first project
                </button>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'Notes' && (
          <div className="space-y-4">
            {notes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {notes.map((note) => (
                  <div
                    key={note._id}
                    className="border border-notion-border rounded-xl p-4.5 bg-white hover:bg-[#fafaf9]/40 cursor-pointer transition-colors shadow-3xs flex flex-col justify-between min-h-[140px] group relative"
                  >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => handleOpenEditNote(e, note)}
                        className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                        title="Edit Note"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteNote(e, note._id)}
                        className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                        title="Delete Note"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <span className="px-2 py-0.5 bg-[#fafaf9] border border-notion-border text-[10px] font-medium text-notion-text-sub rounded-md uppercase tracking-wider pr-10 shrink-0">
                        {note.category}
                      </span>
                      <h4 className="text-[14px] font-semibold text-notion-text-main mt-3 leading-snug break-all pr-4">
                        {note.title}
                      </h4>
                      <p className="text-[12px] text-notion-text-sub font-light mt-1.5 line-clamp-3 break-all pr-2">
                        {note.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-xl p-12 text-center bg-white shadow-3xs max-w-xl mx-auto my-6">
                <NoteIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-notion-text-main mb-1.5">No notes yet.</h3>
                <p className="text-sm text-slate-400 font-light max-w-sm mx-auto mb-6">
                  Save behavior scripts, interview notes, or technical definitions to review before recruitment rounds.
                </p>
                <button
                  onClick={handleOpenAddNote}
                  className="px-4 py-2 bg-[#415b33] text-white hover:bg-[#2f4227] rounded-lg text-[13.5px] font-medium transition-all shadow-xs cursor-pointer"
                >
                  + Create cheat sheet note
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ==========================================
          MODALS SECTION
          ========================================== */}
      
      {/* 1. Add Topic Modal */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-notion-border rounded-xl shadow-lg w-full max-w-md overflow-hidden relative m-4">
            <div className="px-6 py-4 border-b border-notion-border bg-[#fafaf9] flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium">Add Study Topic</h3>
              <button onClick={() => setIsTopicModalOpen(false)} className="p-1 rounded-md text-notion-text-sub hover:bg-notion-hover cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleTopicSubmit} className="p-6 space-y-4 font-sans text-sm">
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Topic Name</label>
                <input type="text" placeholder="e.g. DSA, DBMS, Compiler Design" value={topicForm.name} onChange={(e) => setTopicForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg" required />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Initial Progress (1-5)</label>
                <select value={topicForm.progress} onChange={(e) => setTopicForm(prev => ({ ...prev, progress: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg cursor-pointer">
                  {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} star{v > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Quick Notes (One per line)</label>
                <textarea rows="3" placeholder="Review sliding window complex...&#10;Understand ACID transactions..." value={topicForm.notes} onChange={(e) => setTopicForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Resource Name</label>
                  <input type="text" placeholder="e.g. LeetCode Top 150" value={topicForm.resourcesName} onChange={(e) => setTopicForm(prev => ({ ...prev, resourcesName: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Resource URL</label>
                  <input type="text" placeholder="https://..." value={topicForm.resourcesUrl} onChange={(e) => setTopicForm(prev => ({ ...prev, resourcesUrl: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-notion-border mt-6">
                <button type="button" onClick={() => setIsTopicModalOpen(false)} className="px-3.5 py-2 border border-notion-border rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#415b33] text-white hover:bg-[#2f4227] transition-colors rounded-lg cursor-pointer font-medium">Save Topic</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add/Edit Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-notion-border rounded-xl shadow-lg w-full max-w-md overflow-hidden relative m-4">
            <div className="px-6 py-4 border-b border-notion-border bg-[#fafaf9] flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium">{editingProject ? 'Edit Project' : 'Add Project'}</h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="p-1 rounded-md text-notion-text-sub hover:bg-notion-hover cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleProjectSubmit} className="p-6 space-y-4 font-sans text-sm">
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Project Title</label>
                <input type="text" placeholder="e.g. Chat App, AI Engine" value={projectForm.title} onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg" required />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Description</label>
                <textarea rows="3" placeholder="Brief outline of what the project solves..." value={projectForm.description} onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg resize-none" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Tech Stack (comma separated)</label>
                <input type="text" placeholder="e.g. React, Node.js, AWS" value={projectForm.stack} onChange={(e) => setProjectForm(prev => ({ ...prev, stack: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Status</label>
                <select value={projectForm.status} onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg cursor-pointer">
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-notion-border mt-6">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-3.5 py-2 border border-notion-border rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#415b33] text-white hover:bg-[#2f4227] transition-colors rounded-lg cursor-pointer font-medium">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add/Edit Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-notion-border rounded-xl shadow-lg w-full max-w-md overflow-hidden relative m-4">
            <div className="px-6 py-4 border-b border-notion-border bg-[#fafaf9] flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium">{editingNote ? 'Edit Cheat Sheet Note' : 'Add Cheat Sheet Note'}</h3>
              <button onClick={() => setIsNoteModalOpen(false)} className="p-1 rounded-md text-notion-text-sub hover:bg-notion-hover cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleNoteSubmit} className="p-6 space-y-4 font-sans text-sm">
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Note Title</label>
                <input type="text" placeholder="e.g. STAR Method Answers" value={noteForm.title} onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg" required />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Category</label>
                <select value={noteForm.category} onChange={(e) => setNoteForm(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg cursor-pointer">
                  <option value="Technical">Technical</option>
                  <option value="HR Prep">HR Prep</option>
                  <option value="System Design">System Design</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Content</label>
                <textarea rows="5" placeholder="Write or paste your notes here..." value={noteForm.content} onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))} className="w-full px-3 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-notion-border mt-6">
                <button type="button" onClick={() => setIsNoteModalOpen(false)} className="px-3.5 py-2 border border-notion-border rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#415b33] text-white hover:bg-[#2f4227] transition-colors rounded-lg cursor-pointer font-medium">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Upload Resume Modal */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-notion-border rounded-xl shadow-lg w-full max-w-md overflow-hidden relative m-4">
            <div className="px-6 py-4 border-b border-notion-border bg-[#fafaf9] flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium">Upload Resume</h3>
              <button onClick={() => setIsResumeModalOpen(false)} className="p-1 rounded-md text-notion-text-sub hover:bg-notion-hover cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleResumeSubmit} className="p-6 space-y-4 font-sans text-sm">
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">
                  Select Resume Document
                </label>
                <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-[#fafaf9] text-center hover:border-slate-400 cursor-pointer relative transition-colors mb-3">
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
                  <span className="text-[13px] text-[#3d8438] font-semibold">Choose PDF/Word file</span>
                  <p className="text-[11px] text-slate-400 font-light mt-1">
                    {resumeForm.name ? `Selected: ${resumeForm.name} (${resumeForm.size || ''})` : 'Or select file to pre-fill name'}
                  </p>
                  {isExtractingPdf && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1 animate-pulse">
                      Extracting text from PDF, please wait...
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">File Name</label>
                <input type="text" placeholder="e.g. Sneha_Resume_Systems_Google" value={resumeForm.name} onChange={(e) => setResumeForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Version</label>
                  <input type="text" value={resumeForm.version} onChange={(e) => setResumeForm(prev => ({ ...prev, version: e.target.value }))} className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Target Role</label>
                  <input type="text" value={resumeForm.role} onChange={(e) => setResumeForm(prev => ({ ...prev, role: e.target.value }))} className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg" />
                </div>
              </div>
              
              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Tags (comma separated)</label>
                <input type="text" placeholder="e.g. SDE, Backend, Docker" value={resumeForm.tags} onChange={(e) => setResumeForm(prev => ({ ...prev, tags: e.target.value }))} className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg" />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">
                  Resume Content (Paste text for ATS analysis)
                </label>
                <textarea
                  placeholder="Paste your full resume text (experience, skills, projects) here so the AI engine can run ATS comparisons."
                  value={resumeForm.content}
                  onChange={(e) => setResumeForm(prev => ({ ...prev, content: e.target.value }))}
                  rows="4"
                  className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">Notes</label>
                <textarea rows="2" placeholder="Version details..." value={resumeForm.notes} onChange={(e) => setResumeForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-notion-border mt-6">
                <button type="button" onClick={() => setIsResumeModalOpen(false)} className="px-3.5 py-2 border border-notion-border rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#415b33] text-white hover:bg-[#2f4227] transition-colors rounded-lg cursor-pointer font-medium">Save Resume</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Workspace;
