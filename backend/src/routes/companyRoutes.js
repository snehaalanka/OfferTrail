import express from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  deleteAllCompanies,
  generateCompanyAnalysis,
} from '../controllers/companyController.js';
import { protect } from '../middleware/auth.js';
import Company from '../models/Company.js';
import Activity from '../models/Activity.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// --- Custom Dashboard Actions Enhancements ---

// 1. Fetch Top Activities for User (aggregated from unified logs)
router.get('/dashboard/activities', async (req, res) => {
  try {
    const logs = await Activity.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Interactive Update Progress Dots Stage (0-5)
router.put('/:id/progress-step', async (req, res) => {
  try {
    const { rating } = req.body;
    const company = await Company.findOne({ _id: req.params.id, user: req.user.id });
    if (!company) return res.status(404).json({ message: 'Company record not found' });
    
    if (!company.progress) company.progress = [];
    
    // Pad to exactly 5 elements so progress dots map 1-to-1 to rating
    while(company.progress.length < 5) {
      company.progress.push({ name: `Milestone Stage ${company.progress.length + 1}`, completed: false });
    }
    company.progress.forEach((p, idx) => {
      p.completed = idx < rating;
    });
    
    // Auto-inject to workspace log tracking
    if (!company.activities) company.activities = [];
    company.activities.push({
      action: `Updated metric evaluation progress to ${rating}/5`,
      timestamp: new Date()
    });

    // Log to unified activity collection
 
    await company.save();
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Post a direct checklist item context global goal
router.post('/dashboard/goals', async (req, res) => {
  try {
    const { text, companyId } = req.body;
    let targetId = companyId;
    if (!targetId) {
      let fallbackCompany = await Company.findOne({ user: req.user.id });
      if (!fallbackCompany) {
        // Automatically create a general fallback company if none exists
        fallbackCompany = await Company.create({
          user: req.user.id,
          name: "General Goals",
          role: "General",
          status: "Prepping",
          checklist: []
        });
      }
      targetId = fallbackCompany._id;
    }
    
    const company = await Company.findOne({ _id: targetId, user: req.user.id });
    if (!company.checklist) company.checklist = [];
    
    company.checklist.push({ text, completed: false });
    
    if (!company.activities) company.activities = [];
    company.activities.push({ action: `Added strategic objective: "${text}"`, timestamp: new Date() });

    // Log to unified activity collection
    
    await company.save();
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Update Checklist Complete Status (Strikethrough / updates records)
router.put('/:id/checklist-toggle', async (req, res) => {
  try {
    const { text, completed } = req.body;
    const company = await Company.findOne({ _id: req.params.id, user: req.user.id });
    if (!company) return res.status(404).json({ message: 'Record not found' });

    const item = company.checklist.find(i => i.text === text);
    if (item) {
      item.completed = completed;
      if (!company.activities) company.activities = [];
      company.activities.push({
        action: completed ? `Checked item: ${text}` : `Unchecked item: ${text}`,
        timestamp: new Date()
      });

      // Log to unified activity collection
      
      await company.save();
    }
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Delete Checklist item from dashboard
router.put('/:id/checklist-delete', async (req, res) => {
  try {
    const { text } = req.body;
    const company = await Company.findOne({ _id: req.params.id, user: req.user.id });
    if (!company) return res.status(404).json({ message: 'Record not found' });

    company.checklist = company.checklist.filter(i => i.text !== text);
    
    if (!company.activities) company.activities = [];
    company.activities.push({
      action: `Deleted objective: "${text}"`,
      timestamp: new Date()
    });

    // Log to unified activity collection
    
    await company.save();
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Core API Routes ---
router.route('/')
  .get(getCompanies)
  .post(createCompany)
  .delete(deleteAllCompanies);

router.route('/:id')
  .get(getCompanyById)
  .put(updateCompany)
  .delete(deleteCompany);

router.post('/:id/analyze', generateCompanyAnalysis);

export default router;