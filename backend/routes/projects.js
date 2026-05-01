const express = require('express');
const router = express.Router();
const { db, uuidv4 } = require('../data/store');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/projects — admin sees all, member sees their own
router.get('/', authenticate, (req, res) => {
  let projects = db.projects;

  if (req.user.role !== 'admin') {
    projects = projects.filter((p) => p.memberIds.includes(req.user.id));
  }

  res.json(projects.map(db.getProjectWithDetails));
});

// GET /api/projects/:id
router.get('/:id', authenticate, (req, res) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (
    req.user.role !== 'admin' &&
    !project.memberIds.includes(req.user.id)
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(db.getProjectWithDetails(project));
});

// POST /api/projects — admin only
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, description, memberIds } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  // Validate memberIds
  const validIds = (memberIds || []).filter((id) =>
    db.users.find((u) => u.id === id)
  );
  // Always include creator
  if (!validIds.includes(req.user.id)) validIds.push(req.user.id);

  const newProject = {
    id: uuidv4(),
    name: name.trim(),
    description: (description || '').trim(),
    memberIds: validIds,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };

  db.projects.push(newProject);
  res.status(201).json(db.getProjectWithDetails(newProject));
});

// PUT /api/projects/:id — admin only
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { name, description, memberIds } = req.body;

  if (name) project.name = name.trim();
  if (description !== undefined) project.description = description.trim();
  if (memberIds) {
    const validIds = memberIds.filter((id) => db.users.find((u) => u.id === id));
    project.memberIds = validIds;
  }

  res.json(db.getProjectWithDetails(project));
});

// DELETE /api/projects/:id — admin only
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const idx = db.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });

  // Also delete associated tasks
  db.tasks = db.tasks.filter((t) => t.projectId !== req.params.id);
  db.projects.splice(idx, 1);

  res.json({ message: 'Project deleted' });
});

// GET /api/projects/:id/tasks
router.get('/:id/tasks', authenticate, (req, res) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (
    req.user.role !== 'admin' &&
    !project.memberIds.includes(req.user.id)
  ) {
    return res.status(403).json({ error: 'Access denied' });
  }

  let tasks = db.tasks.filter((t) => t.projectId === req.params.id);
  if (req.user.role !== 'admin') {
    tasks = tasks.filter((t) => t.assigneeId === req.user.id);
  }

  res.json(tasks.map(db.getTaskWithDetails));
});

module.exports = router;
