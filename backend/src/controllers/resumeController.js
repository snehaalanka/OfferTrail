import Resume from '../models/Resume.js';

const calculateAtsScore = async (resumeText) => {
  const DEFAULT_JD = "We are looking for a Software Engineer skilled in Data Structures, Algorithms, Object-Oriented Programming, Database Management Systems, Git, React, Node.js, SQL, and Docker.";
  
  try {
    const fastapiUrl = process.env.FASTAPI_SERVICE_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${fastapiUrl}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: resumeText || '', jd: DEFAULT_JD })
    });
    if (response.ok) {
      const data = await response.json();
      return data.score || 0;
    }
  } catch (error) {
    console.warn('FastAPI offline during resume create/update, running local fallback parser:', error.message);
  }

  // Local fallback parser
  const allRequirements = ["dsa", "oop", "dbms", "git", "react", "node.js", "sql", "docker"];
  let matchedCount = 0;
  const resumeLower = (resumeText || '').toLowerCase();
  allRequirements.forEach(req => {
    if (resumeLower.includes(req)) {
      matchedCount++;
    }
  });
  const ratio = matchedCount / allRequirements.length;
  return Math.round(40 + (ratio * 55));
};

// @desc    Get user resumes
// @route   GET /api/resumes
// @access  Private
export const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(resumes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new resume version
// @route   POST /api/resumes
// @access  Private
export const createResume = async (req, res) => {
  const { name, version, role, size, tags, notes, content } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Resume name is required' });
    }

    const atsScore = await calculateAtsScore(content);

    const resume = await Resume.create({
      user: req.user._id,
      name,
      version: version || 'v1.0',
      role: role || 'Software Engineer',
      size: size || '120 KB',
      tags: tags || [],
      notes: notes || '',
      content: content || '',
      atsScore,
      isActive: false
    });

    return res.status(201).json(resume);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update a resume card details
// @route   PUT /api/resumes/:id
// @access  Private
export const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const { name, version, role, size, tags, notes, content } = req.body;

    if (name !== undefined) resume.name = name;
    if (version !== undefined) resume.version = version;
    if (role !== undefined) resume.role = role;
    if (size !== undefined) resume.size = size;
    if (tags !== undefined) resume.tags = tags;
    if (notes !== undefined) resume.notes = notes;
    if (content !== undefined) {
      resume.content = content;
      resume.atsScore = await calculateAtsScore(content);
    }

    const updated = await resume.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a resume card
// @route   DELETE /api/resumes/:id
// @access  Private
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    return res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Set a resume version as primary
// @route   PUT /api/resumes/:id/primary
// @access  Private
export const setPrimaryResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Set all other resumes of this user to inactive
    await Resume.updateMany({ user: req.user._id }, { isActive: false });

    // Set this one to active
    resume.isActive = true;
    const updated = await resume.save();
    
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
