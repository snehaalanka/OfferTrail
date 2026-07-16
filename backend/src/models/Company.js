import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const companySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  package: {
    type: String,
    default: ''
  },
  deadline: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Wishlist', 'Applied', 'Prepping', 'Offered', 'Rejected', 'Saved'],
    default: 'Saved'
  },
  jd: {
    type: String,
    default: ''
  },
  requiredSkills: [{
    type: String
  }],
  highlightedSkill: {
    type: String,
    default: ''
  },
  progress: [
    {
      name: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }
  ],
  missingSkills: [{
    type: String
  }],
  checklist: [
    {
      text: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }
  ],
  resume: {
    name: { type: String, default: '' },
    version: { type: String, default: 'v1.0' },
    role: { type: String, default: '' },
    size: { type: String, default: '' },
    notes: { type: String, default: '' },
    tags: [{ type: String }],
    content: { type: String, default: '' }
  },
  resumeMatch: {
    score: { type: Number, default: 0 },
    keywords: { type: String, default: '' },
    suggestion: { type: String, default: '' }
  },
  notes: [noteSchema],
  reflection: {
    wentWell: { type: String, default: '' },
    struggled: { type: String, default: '' },
    revise: { type: String, default: '' }
  }
}, {
  timestamps: true
});

const Company = mongoose.model('Company', companySchema);
export default Company;
