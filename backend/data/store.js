const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// In-memory data store (replaces MySQL)
const db = {
  users: [
    {
      id: '1',
      name: 'Arjun Sharma',
      email: 'arjun@team.dev',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Priya Mehta',
      email: 'priya@team.dev',
      password: bcrypt.hashSync('member123', 10),
      role: 'member',
      createdAt: '2026-01-02T00:00:00Z',
    },
    {
      id: '3',
      name: 'Rahul Verma',
      email: 'rahul@team.dev',
      password: bcrypt.hashSync('member123', 10),
      role: 'member',
      createdAt: '2026-01-03T00:00:00Z',
    },
    {
      id: '4',
      name: 'Sneha Patel',
      email: 'sneha@team.dev',
      password: bcrypt.hashSync('member123', 10),
      role: 'member',
      createdAt: '2026-01-04T00:00:00Z',
    },
  ],

  projects: [
    {
      id: '1',
      name: 'E-commerce Platform',
      description: 'Online store with payment integration',
      memberIds: ['1', '2', '3'],
      createdBy: '1',
      createdAt: '2026-01-10T00:00:00Z',
    },
    {
      id: '2',
      name: 'Mobile App Redesign',
      description: 'UI/UX overhaul for iOS and Android',
      memberIds: ['1', '2', '4'],
      createdBy: '1',
      createdAt: '2026-01-15T00:00:00Z',
    },
    {
      id: '3',
      name: 'API Gateway',
      description: 'Microservices API layer with rate limiting',
      memberIds: ['1', '3'],
      createdBy: '1',
      createdAt: '2026-02-01T00:00:00Z',
    },
  ],

  tasks: [
    {
      id: '1',
      title: 'Set up database schema',
      description: 'Design and implement the initial DB schema',
      projectId: '1',
      assigneeId: '2',
      createdBy: '1',
      priority: 'high',
      status: 'done',
      dueDate: '2026-04-28',
      createdAt: '2026-04-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'Build authentication API',
      description: 'JWT-based login and signup endpoints',
      projectId: '1',
      assigneeId: '3',
      createdBy: '1',
      priority: 'high',
      status: 'done',
      dueDate: '2026-04-30',
      createdAt: '2026-04-02T00:00:00Z',
    },
    {
      id: '3',
      title: 'Design product listing page',
      description: 'Create responsive product grid with filters',
      projectId: '1',
      assigneeId: '2',
      createdBy: '1',
      priority: 'medium',
      status: 'in_progress',
      dueDate: '2026-05-10',
      createdAt: '2026-04-05T00:00:00Z',
    },
    {
      id: '4',
      title: 'Integrate payment gateway',
      description: 'Stripe integration for checkout flow',
      projectId: '1',
      assigneeId: '1',
      createdBy: '1',
      priority: 'high',
      status: 'todo',
      dueDate: '2026-05-15',
      createdAt: '2026-04-06T00:00:00Z',
    },
    {
      id: '5',
      title: 'Write unit tests',
      description: 'Jest tests for all API endpoints',
      projectId: '1',
      assigneeId: '3',
      createdBy: '1',
      priority: 'low',
      status: 'review',
      dueDate: '2026-05-12',
      createdAt: '2026-04-07T00:00:00Z',
    },
    {
      id: '6',
      title: 'Redesign navigation bar',
      description: 'Mobile-first responsive nav with hamburger menu',
      projectId: '2',
      assigneeId: '4',
      createdBy: '1',
      priority: 'medium',
      status: 'in_progress',
      dueDate: '2026-04-29',
      createdAt: '2026-04-10T00:00:00Z',
    },
    {
      id: '7',
      title: 'Create onboarding screens',
      description: '5-step user onboarding flow',
      projectId: '2',
      assigneeId: '2',
      createdBy: '1',
      priority: 'high',
      status: 'todo',
      dueDate: '2026-05-20',
      createdAt: '2026-04-12T00:00:00Z',
    },
    {
      id: '8',
      title: 'Implement dark mode',
      description: 'System-aware theme switching',
      projectId: '2',
      assigneeId: '4',
      createdBy: '1',
      priority: 'low',
      status: 'todo',
      dueDate: '2026-05-25',
      createdAt: '2026-04-13T00:00:00Z',
    },
    {
      id: '9',
      title: 'Set up rate limiting',
      description: 'Redis-based rate limiter per IP and user',
      projectId: '3',
      assigneeId: '3',
      createdBy: '1',
      priority: 'high',
      status: 'done',
      dueDate: '2026-04-25',
      createdAt: '2026-04-01T00:00:00Z',
    },
    {
      id: '10',
      title: 'API documentation',
      description: 'Swagger/OpenAPI docs for all endpoints',
      projectId: '3',
      assigneeId: '1',
      createdBy: '1',
      priority: 'medium',
      status: 'done',
      dueDate: '2026-04-27',
      createdAt: '2026-04-02T00:00:00Z',
    },
  ],
};

// Helper: get safe user (no password)
db.safeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

// Helper: find with computed fields
db.getTaskWithDetails = (task) => {
  const assignee = db.users.find((u) => u.id === task.assigneeId);
  const project = db.projects.find((p) => p.id === task.projectId);
  const creator = db.users.find((u) => u.id === task.createdBy);
  const today = new Date().toISOString().split('T')[0];
  const isOverdue =
    task.dueDate && task.dueDate < today && task.status !== 'done';
  return {
    ...task,
    assignee: assignee ? db.safeUser(assignee) : null,
    project: project ? { id: project.id, name: project.name } : null,
    createdByUser: creator ? db.safeUser(creator) : null,
    isOverdue,
  };
};

db.getProjectWithDetails = (project) => {
  const members = project.memberIds
    .map((id) => db.users.find((u) => u.id === id))
    .filter(Boolean)
    .map(db.safeUser);
  const projectTasks = db.tasks.filter((t) => t.projectId === project.id);
  const doneTasks = projectTasks.filter((t) => t.status === 'done');
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = projectTasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
  );
  return {
    ...project,
    members,
    taskCount: projectTasks.length,
    doneCount: doneTasks.length,
    overdueCount: overdueTasks.length,
    progress:
      projectTasks.length > 0
        ? Math.round((doneTasks.length / projectTasks.length) * 100)
        : 0,
  };
};

module.exports = { db, uuidv4 };
