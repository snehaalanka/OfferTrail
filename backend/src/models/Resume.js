import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
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
    version: {
      type: String,
      default: 'v1.0'
    },
    role: {
      type: String,
      default: 'Software Engineer'
    },
    size: {
      type: String,
      default: '120 KB'
    },
    tags: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    atsScore: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
