# TeamTask — Full-Stack Task Manager

A full-stack team task manager built with **Node.js + Express** and **static in-memory data** (no MySQL/database required).

## Features
- **Authentication** — JWT-based login & signup
- **Role-based access** — Admin vs Member permissions
- **Projects** — Create, manage, track progress
- **Tasks** — Assign, prioritize, track status, due dates
- **Dashboard** — Stats overview, my tasks, project progress
- **Team** — Member list with task completion stats

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# For development with auto-reload
npm run dev
```

Open http://localhost:3000

## Demo Accounts

| Role   | Email              | Password   |
|--------|--------------------|------------|
| Admin  | arjun@team.dev     | admin123   |
| Member | priya@team.dev     | member123  |
| Member | rahul@team.dev     | member123  |
| Member | sneha@team.dev     | member123  |

## API Endpoints

### Auth
| Method | Route              | Access | Description     |
|--------|--------------------|--------|-----------------|
| POST   | /api/auth/signup   | Public | Register        |
| POST   | /api/auth/login    | Public | Login           |
| GET    | /api/auth/me       | Auth   | Current user    |

### Tasks
| Method | Route           | Access        | Description          |
|--------|-----------------|---------------|----------------------|
| GET    | /api/tasks      | Auth          | List tasks           |
| GET    | /api/tasks/:id  | Auth          | Get task             |
| POST   | /api/tasks      | Admin only    | Create task          |
| PUT    | /api/tasks/:id  | Auth (owner)  | Update task/status   |
| DELETE | /api/tasks/:id  | Admin only    | Delete task          |

### Projects
| Method | Route              | Access     | Description          |
|--------|--------------------|------------|----------------------|
| GET    | /api/projects      | Auth       | List projects        |
| POST   | /api/projects      | Admin only | Create project       |
| PUT    | /api/projects/:id  | Admin only | Update project       |
| DELETE | /api/projects/:id  | Admin only | Delete project       |

### Users
| Method | Route                    | Access     | Description     |
|--------|--------------------------|------------|-----------------|
| GET    | /api/users               | Auth       | List users      |
| GET    | /api/users/:id           | Auth       | Get user        |
| PUT    | /api/users/:id/role      | Admin only | Change role     |
| GET    | /api/users/dashboard/stats | Admin    | Admin stats     |

## Query Params for Tasks
```
GET /api/tasks?status=todo
GET /api/tasks?priority=high
GET /api/tasks?projectId=<id>
GET /api/tasks?overdue=true
```

## Project Structure
```
team-task-manager/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── data/
│   │   └── store.js       # In-memory data (static)
│   ├── middleware/
│   │   └── auth.js        # JWT authentication middleware
│   └── routes/
│       ├── auth.js        # Auth routes
│       ├── tasks.js       # Task CRUD routes
│       ├── projects.js    # Project CRUD routes
│       └── users.js       # User routes
├── frontend/
│   └── public/
│       ├── index.html     # SPA frontend
│       ├── css/style.css  # Styles
│       └── js/app.js      # Frontend JS
├── .env                   # Environment variables
└── package.json
```

## Deploy on Railway

1. Push to GitHub
2. Create new Railway project → Deploy from GitHub repo
3. Set environment variables in Railway dashboard:
   - `PORT` = 3000
   - `JWT_SECRET` = your_strong_secret_here
   - `NODE_ENV` = production
4. Railway auto-detects Node.js and runs `npm start`

> **Note:** Data resets on every server restart since it's in-memory.
> For persistence, swap `backend/data/store.js` with MongoDB or PostgreSQL.
