const express = require('express');
const router = express.Router();
const { db } = require('../data/store');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/users — admin sees all, member sees only themselves + teammates
router.get('/', authenticate, (req, res) => {
  if (req.user.role === 'admin') {
    return res.json(db.users.map(db.safeUser));
  }

  // Member: return all users in same projects (teammates)
  const myProjectIds = db.projects
    .filter((p) => p.memberIds.includes(req.user.id))
    .map((p) => p.id);

  const teammateIds = new Set([req.user.id]);
  db.projects
    .filter((p) => myProjectIds.includes(p.id))
    .forEach((p) => p.memberIds.forEach((id) => teammateIds.add(id)));

  const teammates = db.users
    .filter((u) => teammateIds.has(u.id))
    .map(db.safeUser);

  res.json(teammates);
});

// GET /api/users/:id
router.get('/:id', authenticate, (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Members can only see themselves
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const userTasks = db.tasks.filter((t) => t.assigneeId === user.id);
  const doneTasks = userTasks.filter((t) => t.status === 'done');
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = userTasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
  );

  res.json({
    ...db.safeUser(user),
    stats: {
      totalTasks: userTasks.length,
      doneTasks: doneTasks.length,
      overdueTasks: overdueTasks.length,
      inProgressTasks: userTasks.filter((t) => t.status === 'in_progress').length,
    },
  });
});

// PUT /api/users/:id/role — admin only, change user role
router.put('/:id/role', authenticate, requireAdmin, (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { role } = req.body;
  if (!role || !['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or member' });
  }

  // Prevent self-demotion
  if (user.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }

  user.role = role;
  res.json({ message: 'Role updated', user: db.safeUser(user) });
});

// GET /api/users/dashboard/stats — summary for admin
router.get('/dashboard/stats', authenticate, requireAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const overdue = db.tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
  );

  res.json({
    totalUsers: db.users.length,
    totalProjects: db.projects.length,
    totalTasks: db.tasks.length,
    doneTasks: db.tasks.filter((t) => t.status === 'done').length,
    inProgressTasks: db.tasks.filter((t) => t.status === 'in_progress').length,
    reviewTasks: db.tasks.filter((t) => t.status === 'review').length,
    overdueTasks: overdue.length,
    byPriority: {
      high: db.tasks.filter((t) => t.priority === 'high').length,
      medium: db.tasks.filter((t) => t.priority === 'medium').length,
      low: db.tasks.filter((t) => t.priority === 'low').length,
    },
  });
});

module.exports = router;
