import { LearningTopic, Project, Note } from '../models/Workspace.js';
import { logActivity } from '../utils/activityLogger.js';

// ==========================================
// 1. LEARNING TOPICS ENDPOINTS
// ==========================================

export const getTopics = async (req, res) => {
  try {
    const topics = await LearningTopic.find({ user: req.user._id }).sort({ createdAt: 1 });
    return res.json(topics);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createTopic = async (req, res) => {
  const { name, progress, status, lastRevised, notes, resources } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: 'Topic name is required' });
    }
    const topic = await LearningTopic.create({
      user: req.user._id,
      name,
      progress: progress || 0,
      status: status || 'Revision due',
      lastRevised: lastRevised || 'Not revised yet',
      notes: notes || [],
      resources: resources || []
    });
    return res.status(201).json(topic);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const topic = await LearningTopic.findOne({ _id: req.params.id, user: req.user._id });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const { name, progress, status, lastRevised, notes, resources } = req.body;

    if (name !== undefined) topic.name = name;
    if (progress !== undefined) topic.progress = progress;
    if (status !== undefined) topic.status = status;
    if (lastRevised !== undefined) topic.lastRevised = lastRevised;
    if (notes !== undefined) topic.notes = notes;
    if (resources !== undefined) topic.resources = resources;

    const updated = await topic.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    const topic = await LearningTopic.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    return res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ==========================================
// 2. PROJECTS ENDPOINTS
// ==========================================

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createProject = async (req, res) => {
  const { title, description, stack, status } = req.body;
  try {
    if (!title) {
      return res.status(400).json({ message: 'Project title is required' });
    }
    const project = await Project.create({
      user: req.user._id,
      title,
      description: description || '',
      stack: stack || [],
      status: status || 'In Progress'
    });
    return res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { title, description, stack, status } = req.body;

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (stack !== undefined) project.stack = stack;
    if (status !== undefined) project.status = status;

    const updated = await project.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    return res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ==========================================
// 3. CHEAT SHEET NOTES ENDPOINTS
// ==========================================

export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(notes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createNote = async (req, res) => {
  const { title, category, content } = req.body;
  try {
    if (!title) {
      return res.status(400).json({ message: 'Note title is required' });
    }
    const note = await Note.create({
      user: req.user._id,
      title,
      category: category || 'General',
      content: content || ''
    });
    return res.status(201).json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const { title, category, content } = req.body;

    if (title !== undefined) note.title = title;
    if (category !== undefined) note.category = category;
    if (content !== undefined) note.content = content;

    const updated = await note.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    return res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
