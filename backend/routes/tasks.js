const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../data/store');
const { authenticate, requireAdmin } = require('../middleware/auth');

const VALID_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// GET /api/tasks — admin sees all, member sees assigned tasks
router.get('/', authenticate, (req, res) => {
  let tasks = db.tasks;

  if (req.user.role !== 'admin') {
    tasks = tasks.filter((t) => t.assigneeId === req.user.id);
  }

  // Optional filters via query params
  if (req.query.status) {
    tasks = tasks.filter((t) => t.status === req.query.status);
  }
  if (req.query.priority) {
    tasks = tasks.filter((t) => t.priority === req.query.priority);
  }
  if (req.query.projectId) {
    tasks = tasks.filter((t) => t.projectId === req.query.projectId);
  }
  if (req.query.assigneeId && req.user.role === 'admin') {
    tasks = tasks.filter((t) => t.assigneeId === req.query.assigneeId);
  }
  if (req.query.overdue === 'true') {
    const today = new Date().toISOString().split('T')[0];
    tasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
    );
  }

  res.json(tasks.map(db.getTaskWithDetails));
});

// GET /api/tasks/:id
router.get('/:id', authenticate, (req, res) => {
  const task = db.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.user.role !== 'admin' && task.assigneeId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(db.getTaskWithDetails(task));
});

// POST /api/tasks — admin only
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { title, description, projectId, assigneeId, priority, status, dueDate } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required' });
  }
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }
  if (!assigneeId) {
    return res.status(400).json({ error: 'assigneeId is required' });
  }

  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const assignee = db.users.find((u) => u.id === assigneeId);
  if (!assignee) return res.status(404).json({ error: 'Assignee not found' });

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const newTask = {
    id: uuidv4(),
    title: title.trim(),
    description: (description || '').trim(),
    projectId,
    assigneeId,
    createdBy: req.user.id,
    priority: priority || 'medium',
    status: status || 'todo',
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
  };

  db.tasks.push(newTask);
  res.status(201).json(db.getTaskWithDetails(newTask));
});

// PUT /api/tasks/:id — admin can update all; member can only update status of their task
router.put('/:id', authenticate, (req, res) => {
  const task = db.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const isAdmin = req.user.role === 'admin';
  const isAssignee = task.assigneeId === req.user.id;

  if (!isAdmin && !isAssignee) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (isAdmin) {
    // Admin can update everything
    const { title, description, projectId, assigneeId, priority, status, dueDate } = req.body;

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (projectId) {
      const project = db.projects.find((p) => p.id === projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      task.projectId = projectId;
    }
    if (assigneeId) {
      const assignee = db.users.find((u) => u.id === assigneeId);
      if (!assignee) return res.status(404).json({ error: 'Assignee not found' });
      task.assigneeId = assigneeId;
    }
    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
      }
      task.priority = priority;
    }
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      task.status = status;
    }
    if (dueDate !== undefined) task.dueDate = dueDate || null;
  } else {
    // Member can only update status of their own task
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Members can only update task status' });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    task.status = status;
  }

  task.updatedAt = new Date().toISOString();
  res.json(db.getTaskWithDetails(task));
});

// DELETE /api/tasks/:id — admin only
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const idx = db.tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  db.tasks.splice(idx, 1);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
