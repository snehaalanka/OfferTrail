const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Clears the session and sends the user to the real login page.
const forceLogout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

const makeRequest = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  });

  // Expired or invalid token — don't fake a new session, just log the user out for real.
  if (res.status === 401) {
    forceLogout();
    throw new Error('Session expired. Please log in again.');
  }

  return res;
};

export const api = {
  // --- Auth ---
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('token', data.token);
    return data;
  },

  register: async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => !!localStorage.getItem('token'),

  getProfile: async () => {
    const res = await makeRequest(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  // --- Companies CRUD ---
  getCompanies: async () => {
    const res = await makeRequest(`${API_BASE}/companies`);
    if (!res.ok) throw new Error('Failed to fetch companies');
    return res.json();
  },

  getCompany: async (id) => {
    const res = await makeRequest(`${API_BASE}/companies/${id}`);
    if (!res.ok) throw new Error('Failed to fetch company details');
    return res.json();
  },

  createCompany: async (data) => {
    const res = await makeRequest(`${API_BASE}/companies`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create company');
    return res.json();
  },

  updateCompany: async (id, data) => {
    const res = await makeRequest(`${API_BASE}/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update company');
    return res.json();
  },

  deleteCompany: async (id) => {
    const res = await makeRequest(`${API_BASE}/companies/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete company');
    return res.json();
  },

  deleteAllCompanies: async () => {
    const res = await makeRequest(`${API_BASE}/companies`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to remove all companies');
    return res.json();
  },

  generateCompanyAnalysis: async (id) => {
    const res = await makeRequest(`${API_BASE}/companies/${id}/analyze`, {
      method: 'POST'
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to generate insights');
    }
    return res.json();
  },

  // --- Resumes CRUD ---
  getResumes: async () => {
    const res = await makeRequest(`${API_BASE}/resumes`);
    if (!res.ok) throw new Error('Failed to fetch resumes');
    return res.json();
  },
  createResume: async (data) => {
    const res = await makeRequest(`${API_BASE}/resumes`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create resume');
    return res.json();
  },
  updateResume: async (id, data) => {
    const res = await makeRequest(`${API_BASE}/resumes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update resume');
    return res.json();
  },
  deleteResume: async (id) => {
    const res = await makeRequest(`${API_BASE}/resumes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete resume');
    return res.json();
  },
  setPrimaryResume: async (id) => {
    const res = await makeRequest(`${API_BASE}/resumes/${id}/primary`, { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to set primary resume');
    return res.json();
  },
  parsePdf: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('http://localhost:8000/parse_pdf', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to extract text from PDF');
    const data = await res.json();
    return data.text;
  },

  // --- Workspace Topics CRUD ---
  getTopics: async () => {
    const res = await makeRequest(`${API_BASE}/workspace/topics`);
    if (!res.ok) throw new Error('Failed to fetch learning topics');
    return res.json();
  },
  createTopic: async (data) => {
    const res = await makeRequest(`${API_BASE}/workspace/topics`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create learning topic');
    return res.json();
  },
  updateTopic: async (id, data) => {
    const res = await makeRequest(`${API_BASE}/workspace/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update topic');
    return res.json();
  },
  deleteTopic: async (id) => {
    const res = await makeRequest(`${API_BASE}/workspace/topics/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete topic');
    return res.json();
  },

  // --- Workspace Projects CRUD ---
  getProjects: async () => {
    const res = await makeRequest(`${API_BASE}/workspace/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },
  createProject: async (data) => {
    const res = await makeRequest(`${API_BASE}/workspace/projects`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },
  updateProject: async (id, data) => {
    const res = await makeRequest(`${API_BASE}/workspace/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },
  deleteProject: async (id) => {
    const res = await makeRequest(`${API_BASE}/workspace/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  // --- Workspace Notes CRUD ---
  getNotes: async () => {
    const res = await makeRequest(`${API_BASE}/workspace/notes`);
    if (!res.ok) throw new Error('Failed to fetch cheat sheet notes');
    return res.json();
  },
  createNote: async (data) => {
    const res = await makeRequest(`${API_BASE}/workspace/notes`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create note');
    return res.json();
  },
  updateNote: async (id, data) => {
    const res = await makeRequest(`${API_BASE}/workspace/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update note');
    return res.json();
  },
  deleteNote: async (id) => {
    const res = await makeRequest(`${API_BASE}/workspace/notes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete note');
    return res.json();
  }
};