import Activity from '../models/Activity.js';

export const logActivity = async (userId, type, action, companyId = null, companyName = null) => {
  try {
    await Activity.create({
      user: userId,
      type,
      action,
      companyId,
      companyName,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};
