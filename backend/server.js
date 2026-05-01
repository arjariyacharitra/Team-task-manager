require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Catch-all: serve frontend SPA ────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Team Task Manager running on http://localhost:${PORT}`);
  console.log(`\n📋 Test accounts:`);
  console.log(`   Admin  → arjun@team.dev   / admin123`);
  console.log(`   Member → priya@team.dev   / member123`);
  console.log(`   Member → rahul@team.dev   / member123`);
  console.log(`   Member → sneha@team.dev   / member123`);
  console.log(`\n📡 API endpoints:`);
  console.log(`   POST /api/auth/signup`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   GET  /api/projects`);
  console.log(`   POST /api/projects       (admin)`);
  console.log(`   GET  /api/tasks`);
  console.log(`   POST /api/tasks          (admin)`);
  console.log(`   PUT  /api/tasks/:id`);
  console.log(`   GET  /api/users`);
  console.log(`   GET  /api/users/dashboard/stats  (admin)\n`);
});

module.exports = app;
