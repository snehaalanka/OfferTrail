import Company from '../models/Company.js';
import { logActivity } from '../utils/activityLogger.js';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private
export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single company details
// @route   GET /api/companies/:id
// @access  Private
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, user: req.user.id });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new company
// @route   POST /api/companies
// @access  Private
export const createCompany = async (req, res) => {
  const { name, role, package: pkg, deadline, status } = req.body;

  try {
    if (!name || !role) {
      return res.status(400).json({ message: 'Company name and role are required' });
    }

    // Default template values for a new company workspace
    const newCompany = new Company({
      user: req.user.id,
      name,
      role,
      package: pkg || '',
      deadline: deadline || '',
      status: status || 'Saved',
      jd: '',
      requiredSkills: [],
      highlightedSkill: '',
      progress: [],
      missingSkills: [],
      checklist: [],
      resumeMatch: {
        score: 0,
        keywords: '',
        suggestion: ''
      },
      notes: [],
      reflection: {
        wentWell: '',
        struggled: '',
        revise: ''
      }
    });

    const savedCompany = await newCompany.save();
    await logActivity(req.user.id, 'job', `Created company workspace: "${savedCompany.name}"`, savedCompany._id, savedCompany.name);
    res.status(201).json(savedCompany);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a company
// @route   PUT /api/companies/:id
// @access  Private
export const updateCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, user: req.user.id });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Update fields dynamically
    const fieldsToUpdate = [
      'name', 'role', 'package', 'deadline', 'status', 'jd', 
      'requiredSkills', 'highlightedSkill', 'progress', 
      'missingSkills', 'checklist', 'resume', 'resumeMatch', 'notes', 'reflection'
    ];

    // Log interview notes updates before saving
    if (req.body.notes !== undefined) {
      const oldNotesCount = company.notes.length;
      const newNotesCount = req.body.notes.length;
      if (newNotesCount > oldNotesCount) {
        const addedNote = req.body.notes[req.body.notes.length - 1];
        if (addedNote) {
          await logActivity(req.user.id, 'job', `Added interview note: "${addedNote.title}"`, company._id, company.name);
        }
      } else if (newNotesCount < oldNotesCount) {
        await logActivity(req.user.id, 'job', `Removed interview note`, company._id, company.name);
      } else {
        let modifiedTitle = '';
        for (let i = 0; i < newNotesCount; i++) {
          const oldNote = company.notes[i];
          const newNote = req.body.notes[i];
          if (oldNote && newNote && (oldNote.title !== newNote.title || oldNote.content !== newNote.content)) {
            modifiedTitle = newNote.title;
            break;
          }
        }
        if (modifiedTitle) {
          await logActivity(req.user.id, 'job', `Updated interview note: "${modifiedTitle}"`, company._id, company.name);
        }
      }
    }

    // Log resume updates before saving
    if (req.body.resume !== undefined && req.body.resume !== company.resume) {
      await logActivity(req.user.id, 'job', `Updated Resume PDF for application`, company._id, company.name);
    }
    if (req.body.resumeMatch !== undefined && JSON.stringify(req.body.resumeMatch) !== JSON.stringify(company.resumeMatch)) {
      await logActivity(req.user.id, 'job', `Updated Resume ATS Match analysis`, company._id, company.name);
    }

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

    const updatedCompany = await company.save();
    res.json(updatedCompany);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a company
// @route   DELETE /api/companies/:id
// @access  Private
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!company) {
      return res.status(404).json({ message: 'Company not found or unauthorized' });
    }

    await logActivity(req.user.id, 'job', `Removed company workspace: "${company.name}"`, company._id, company.name);

    res.json({ message: 'Company removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete all companies
// @route   DELETE /api/companies
// @access  Private
export const deleteAllCompanies = async (req, res) => {
  try {
    await Company.deleteMany({ user: req.user.id });
    res.json({ message: 'All companies removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate AI Insights for a company based on active primary resume
// @route   POST /api/companies/:id/analyze
// @access  Private
export const generateCompanyAnalysis = async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, user: req.user.id });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if job description exists
    const isJdEmpty = !company.jd || 
                     company.jd.trim() === '' || 
                     company.jd.includes('Enter job description here') || 
                     company.jd.includes('No job description provided');
    if (isJdEmpty) {
      return res.status(400).json({ message: 'Please add a Job Description to the company workspace before generating insights.' });
    }

    // Get company tailored resume
    if (!company.resume || !company.resume.content || company.resume.content.trim() === '') {
      return res.status(400).json({ message: 'Please upload a tailored resume for this company before generating insights.' });
    }

    // Call FastAPI service
    const resumeText = company.resume.content;
    const jdText = company.jd;

    let analysisData = null;

    try {
      // 1. Call FastAPI compare endpoint
      const compareRes = await fetch(`${FASTAPI_URL}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: resumeText, jd: jdText })
      });

      // 2. Call FastAPI analyze_jd endpoint
      const analyzeJdRes = await fetch(`${FASTAPI_URL}/analyze_jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jdText })
      });

      if (compareRes.ok && analyzeJdRes.ok) {
        const compareResult = await compareRes.json();
        const analyzeJdResult = await analyzeJdRes.json();

        analysisData = {
          score: compareResult.score,
          missing_skills: compareResult.missing_skills,
          suggested_improvements: compareResult.suggested_improvements,
          skills: analyzeJdResult.skills,
          technologies: analyzeJdResult.technologies,
          responsibilities: analyzeJdResult.responsibilities
        };
      }
    } catch (apiError) {
      console.warn('FastAPI service offline, running local fallback analysis:', apiError.message);
    }

    // Local JS parsing fallback if FastAPI is offline
    if (!analysisData) {
      const SKILLS_DICT = [
        "dsa", "data structures", "algorithms", "oop", "dbms", "operating systems",
        "system design", "agile", "scrum", "unit testing", "jest", "ci/cd", "git",
        "rest apis", "microservices", "load balancing", "caching", "object-oriented programming"
      ];
      const TECH_DICT = [
        "react", "vue", "angular", "node.js", "node", "express", "django", "flask", "fastapi",
        "spring boot", "java", "python", "javascript", "typescript", "c++", "golang", "rust",
        "mongodb", "postgresql", "mysql", "redis", "dynamodb", "aws", "azure", "gcp",
        "docker", "kubernetes", "jenkins", "terraform", "html", "css", "sql", "nosql", "linux"
      ];

      const parseKeywords = (text, dictionary) => {
        const found = [];
        const textLower = text.toLowerCase();
        dictionary.forEach(word => {
          const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp('\\b' + escapedWord + '\\b', 'i');
          if (regex.test(textLower)) {
            found.push(word.toUpperCase() === 'DSA' || word.toUpperCase() === 'OOP' || word.toUpperCase() === 'DBMS' || word.toUpperCase() === 'SQL' || word.toUpperCase() === 'AWS' ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1));
          }
        });
        return [...new Set(found)];
      };

      const targetSkills = parseKeywords(jdText, SKILLS_DICT);
      const targetTechs = parseKeywords(jdText, TECH_DICT);
      const allRequirements = [...new Set([...targetSkills, ...targetTechs])];

      const matched = [];
      const missing = [];
      const resumeLower = resumeText.toLowerCase();

      allRequirements.forEach(req => {
        const reqLower = req.toLowerCase();
        if (resumeLower.includes(reqLower)) {
          matched.push(req);
        } else {
          missing.push(req);
        }
      });

      const ratio = allRequirements.length > 0 ? matched.length / allRequirements.length : 1.0;
      const score = Math.round(40 + (ratio * 55));
      const suggestions = missing.map(m => `Add a project demonstrating experience with ${m}.`);
      if (suggestions.length === 0) {
        suggestions.push("Resume matches all core skills. Consider adding specific metrics.");
      }

      analysisData = {
        score,
        missing_skills: missing,
        suggested_improvements: suggestions,
        skills: targetSkills.length > 0 ? targetSkills : ["DSA", "OOP"],
        technologies: targetTechs.length > 0 ? targetTechs : ["React", "Node.js"]
      };
    }

    // Save analysis to company document
    company.requiredSkills = [...new Set([...analysisData.skills, ...analysisData.technologies])];
    company.highlightedSkill = analysisData.skills[0] || 'Core Stack';
    company.missingSkills = analysisData.missing_skills;
    
    // Populate progress tracker based on required skills
    const currentProgressNames = company.progress.map(p => p.name);
    company.requiredSkills.forEach(skill => {
      if (!currentProgressNames.includes(skill)) {
        company.progress.push({ name: skill, completed: false });
      }
    });

    company.resumeMatch = {
      score: analysisData.score,
      keywords: analysisData.missing_skills.join(', ') || 'None',
      suggestion: analysisData.suggested_improvements.slice(0, 2).join(' ')
    };

    const saved = await company.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};