import mongoose from 'mongoose';

// 1. Learning Topic Schema (for Study Workspace DSA, DBMS, OS, React cards)
const learningTopicSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    progress: {
      type: Number,
      default: 0 // 0-5 stars/dots
    },
    status: {
      type: String,
      enum: ['Revision due', 'Fresh'],
      default: 'Revision due'
    },
    lastRevised: {
      type: String,
      default: 'Not revised yet'
    },
    notes: {
      type: [String],
      default: []
    },
    resources: [
      {
        name: { type: String, required: true },
        url: { type: String, default: '#' }
      }
    ]
  },
  { timestamps: true }
);

// 2. Project Schema (for Study Workspace Projects sub-tab)
const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    stack: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      default: 'In Progress'
    }
  },
  { timestamps: true }
);

// 3. Cheat Sheet Note Schema (for Study Workspace Notes sub-tab)
const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: 'General'
    },
    content: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const LearningTopic = mongoose.model('LearningTopic', learningTopicSchema);
export const Project = mongoose.model('Project', projectSchema);
export const Note = mongoose.model('Note', noteSchema);
