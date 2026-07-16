import React, { useState, useMemo } from 'react';
import toast from "react-hot-toast";
import { useConfirm } from "../context/ConfirmContext";
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { Search, X, Edit2, Trash2 } from 'lucide-react';
import Loader from "../components/Loader";

const STATUS_OPTIONS = ['Wishlist', 'Applied', 'Prepping', 'Offered', 'Rejected', 'Saved'];

const StatusDot = ({ status }) => {
  const confirm = useConfirm();
  if (status === 'Applied') {
    return (
      <span className="flex items-center gap-1.5 text-[#3d8438] font-sans text-[14px]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#3d8438] inline-block shrink-0"></span>
        Applied
      </span>
    );
  }
  if (status === 'Prepping') {
    return (
      <span className="flex items-center gap-1.5 text-[#37352f] font-sans text-[14px]">
        <span className="w-2.5 h-2.5 rounded-full border border-slate-700 inline-flex items-center justify-start overflow-hidden shrink-0 relative">
          <span className="w-1/2 h-full bg-slate-700 absolute left-0 top-0"></span>
        </span>
        Prepping
      </span>
    );
  }
  if (status === 'Offered') {
    return (
      <span className="flex items-center gap-1.5 text-amber-700 font-sans text-[14px]">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0"></span>
        Offered
      </span>
    );
  }
  if (status === 'Rejected') {
    return (
      <span className="flex items-center gap-1.5 text-red-700 font-sans text-[14px]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shrink-0"></span>
        Rejected
      </span>
    );
  }
  if (status === 'Wishlist') {
    return (
      <span className="flex items-center gap-1.5 text-[#4f46e5] font-sans text-[14px]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5] inline-block shrink-0"></span>
        Wishlist
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-notion-text-sub font-sans text-[14px]">
      <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-transparent inline-block shrink-0"></span>
      Saved
    </span>
  );
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

const Companies = () => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deadlineFilter, setDeadlineFilter] = useState('All'); // All, This Week, Overdue
  const [sortOption, setSortOption] = useState('Newest'); // Newest, Oldest, Ascending, Descending
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null); // null if adding new
  const [formData, setFormData] = useState({ name: '', role: '', package: '', deadline: '', status: 'Saved' });
  const [valError, setValError] = useState('');

  // 1. Fetch companies data
  const { data: companies = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['companies'],
    queryFn: api.getCompanies
  });

  // 2. Define Mutations
  const createMutation = useMutation({
    mutationFn: api.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      if (editingCompany) {
        queryClient.invalidateQueries({ queryKey: ['company', editingCompany._id] });
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
  });

  const deleteAllMutation = useMutation({
    mutationFn: api.deleteAllCompanies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
  });

  // Filtered & Sorted list
  const processedCompanies = useMemo(() => {
    let result = [...companies];

    // 1. Search Query Filter (Case Insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        c => c.name.toLowerCase().includes(query) || c.role.toLowerCase().includes(query)
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(c => c.status === statusFilter);
    }

    // 3. Deadline Filter
    if (deadlineFilter !== 'All') {
      if (deadlineFilter === 'This Week') {
        result = result.filter(c => isDeadlineThisWeek(c.deadline));
      } else if (deadlineFilter === 'Overdue') {
        result = result.filter(c => {
          if (!c.deadline) return false;
          let dateObj = new Date(c.deadline);
          if (isNaN(dateObj.getTime())) {
            const currentYear = new Date().getFullYear();
            dateObj = new Date(`${c.deadline}, ${currentYear}`);
          }
          if (isNaN(dateObj.getTime())) return false;
          dateObj.setHours(23,59,59,999);
          return dateObj < new Date() && c.status !== 'Rejected' && c.status !== 'Offered';
        });
      }
    }

    // 4. Sorting
    if (sortOption === 'Newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOption === 'Oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortOption === 'Ascending') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'Descending') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [companies, searchQuery, statusFilter, deadlineFilter, sortOption]);

  const handleOpenAddModal = () => {
    setEditingCompany(null);
    setFormData({ name: '', role: '', package: '', deadline: '', status: 'Saved' });
    setValError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      role: company.role,
      package: company.package || '',
      deadline: company.deadline || '',
      status: company.status || 'Saved',
    });
    setValError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setValError('');

    // Strict Validation
    if (!formData.name.trim()) {
      setValError('Company Name is required.');
      return;
    }
    if (!formData.role.trim()) {
      setValError('Target Role is required.');
      return;
    }

    // Package number check
    if (formData.package.trim()) {
      const numMatch = formData.package.match(/^\d+(\.\d+)?/);
      if (!numMatch) {
        setValError('Package must contain numbers (e.g. 18 or 18 LPA).');
        return;
      }
      const numValue = parseFloat(numMatch[0]);
      if (numValue < 0) {
        setValError('Package package value cannot be negative.');
        return;
      }
    }

    // Deadline date verification
    if (formData.deadline.trim()) {
      let parsed = new Date(formData.deadline);
      if (isNaN(parsed.getTime())) {
        const year = new Date().getFullYear();
        parsed = new Date(`${formData.deadline}, ${year}`);
      }
      if (isNaN(parsed.getTime())) {
        setValError('Please enter a valid date (e.g. 2026-08-02 or Aug 2).');
        return;
      }
    }

    try {
      if (editingCompany) {
        await updateMutation.mutateAsync({ id: editingCompany._id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setValError('Failed to save company data: ' + err.message);
    }
  };

  const handleDeleteCompany = async (id) => {
    if (await confirm('Are you sure you want to delete this company?')) {
      try {
        await deleteMutation.mutateAsync(id);
        setIsModalOpen(false);
      } catch (err) {
        toast.error('Failed to delete company: ' + err.message);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (await confirm('CAUTION: Are you sure you want to delete all companies from your workspace? This action cannot be undone.')) {
      try {
        await deleteAllMutation.mutateAsync();
      } catch (err) {
        toast.error('Failed to clear companies database: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center font-sans">
        <div className="w-6 h-6 border-2 border-[#415b33] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[14.5px] text-slate-500 font-light">Loading companies database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center font-sans">
        <div className="text-red-600 font-semibold mb-2">Failed to load companies database</div>
        <p className="text-slate-500 font-light mb-6">{error.message || 'Connection lost to the server.'}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#415b33] hover:bg-[#2f4227] text-white text-[13.5px] font-medium rounded-lg transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-8 font-sans select-none animate-fade-in text-notion-text-main">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-[40px] font-normal tracking-tight">
          Companies
        </h1>
        <div className="flex items-center gap-2">
          {companies.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg text-[13px] font-medium transition-colors shadow-3xs cursor-pointer"
            >
              Delete All
            </button>
          )}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-1.5 bg-[#415b33] hover:bg-[#2f4227] text-white rounded-lg text-[13.5px] font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Add company</span>
          </button>
        </div>
      </div>

      {companies.length > 0 ? (
        <>
          {/* Control bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
            
            {/* Search */}
            <div className="relative w-full sm:flex-1 max-w-lg">
              <Search className="w-4 h-4 text-notion-text-sub absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#fcfcfc] border border-notion-border rounded-lg text-[14px] placeholder-slate-400 focus:outline-hidden focus:border-slate-400 transition-colors shadow-2xs"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-notion-border hover:border-slate-300 rounded-lg text-[13.5px] font-normal hover:bg-[#efefed] transition-colors focus:outline-hidden cursor-pointer"
              >
                <option value="All">Status: All</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <select
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-notion-border hover:border-slate-300 rounded-lg text-[13.5px] font-normal hover:bg-[#efefed] transition-colors focus:outline-hidden cursor-pointer"
              >
                <option value="All">Deadline: All</option>
                <option value="This Week">This Week</option>
                <option value="Overdue">Overdue</option>
              </select>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-2 bg-white border border-notion-border hover:border-slate-300 rounded-lg text-[13.5px] font-normal hover:bg-[#efefed] transition-colors focus:outline-hidden cursor-pointer"
              >
                <option value="Newest">Sort: Newest</option>
                <option value="Oldest">Sort: Oldest</option>
                <option value="Ascending">Sort: Name (A-Z)</option>
                <option value="Descending">Sort: Name (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Notion Table */}
          <div className="border border-notion-border rounded-xl bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-notion-border bg-[#fafaf9] text-left text-notion-text-sub select-none">
                    <th className="py-3 px-5 text-[13px] font-medium tracking-wide w-1/4">Company</th>
                    <th className="py-3 px-5 text-[13px] font-medium tracking-wide w-1/4">Role</th>
                    <th className="py-3 px-5 text-[13px] font-medium tracking-wide w-1/6">Package</th>
                    <th className="py-3 px-5 text-[13px] font-medium tracking-wide w-1/6">Deadline</th>
                    <th className="py-3 px-5 text-[13px] font-medium tracking-wide w-1/6">Status</th>
                    <th className="py-3 px-5 text-[13px] font-medium tracking-wide w-12 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-notion-border">
                  {processedCompanies.length > 0 ? (
                    processedCompanies.map((company) => (
                      <tr
                        key={company._id}
                        onClick={() => navigate(`/companies/${company._id}`)}
                        className="hover:bg-[#f8f8f7] group transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-5 text-[14.5px] font-semibold tracking-tight break-all">
                          {company.name}
                        </td>
                        <td className="py-3.5 px-5 text-[14px] break-all">
                          {company.role}
                        </td>
                        <td className="py-3.5 px-5 text-[14px] text-notion-text-sub font-mono break-all">
                          {company.package || '—'}
                        </td>
                        <td className="py-3.5 px-5 text-[14px] break-all">
                          {company.deadline || '—'}
                        </td>
                        <td className="py-3.5 px-5">
                          <StatusDot status={company.status} />
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(company);
                              }}
                              className="p-1 hover:bg-[#efefed] rounded text-notion-text-sub hover:text-notion-text-main transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCompany(company._id);
                              }}
                              className="p-1 hover:bg-red-50 rounded text-notion-text-sub hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-notion-text-sub font-light text-[14px] bg-white">
                        No companies found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="border border-dashed border-slate-300 rounded-xl p-16 text-center bg-white shadow-3xs max-w-xl mx-auto my-12">
          <h3 className="text-lg font-semibold text-notion-text-main mb-1.5">No companies added yet.</h3>
          <p className="text-sm text-slate-400 font-light max-w-sm mx-auto mb-6">
            Start tracking your placement journey by adding your first company.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#415b33] hover:bg-[#2f4227] text-white rounded-lg text-[13.5px] font-medium transition-all shadow-xs cursor-pointer"
          >
            + Add Company
          </button>
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-notion-border rounded-xl shadow-lg w-full max-w-md overflow-hidden relative m-4">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-notion-border bg-[#fafaf9] flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium">
                {editingCompany ? 'Edit Company' : 'Add Company'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-md text-notion-text-sub hover:bg-notion-hover hover:text-notion-text-main transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 font-sans">
              
              {valError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-[12.5px] text-red-700">
                  {valError}
                </div>
              )}

              <div>
                <label className="block text-[12.5px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Google"
                  className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-lg text-[14px] focus:outline-hidden transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="e.g. SDE Intern"
                  className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-lg text-[14px] focus:outline-hidden transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">
                    Package
                  </label>
                  <input
                    type="text"
                    name="package"
                    value={formData.package}
                    onChange={handleInputChange}
                    placeholder="e.g. 18 or 18 LPA"
                    className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-lg text-[14px] focus:outline-hidden transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">
                    Deadline
                  </label>
                  <input
                    type="text"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    placeholder="e.g. 2026-08-02 or Aug 2"
                    className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-lg text-[14px] focus:outline-hidden transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-notion-text-sub uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2 bg-[#fcfcfc] border border-notion-border focus:border-slate-400 rounded-lg text-[14px] focus:outline-hidden cursor-pointer transition-colors"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Modal Footer / Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-notion-border mt-6">
                <div>
                  {editingCompany && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCompany(editingCompany._id)}
                      className="px-3.5 py-2 text-[13.5px] font-medium text-red-600 hover:bg-red-50 hover:border-red-100 rounded-lg transition-colors border border-transparent cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-3.5 py-2 border border-notion-border hover:border-slate-300 rounded-lg text-[13.5px] font-normal hover:bg-notion-hover transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#3d8438] text-white hover:bg-[#415b33] rounded-lg text-[13.5px] font-medium transition-colors shadow-2xs cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Companies;
