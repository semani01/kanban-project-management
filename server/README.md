# Kanban Backend API

RESTful API server for the Kanban Project Management application.

## Features

- **RESTful API** with Express.js
- **SQLite Database** for data persistence
- **JWT Authentication** for secure user sessions
- **Comprehensive CRUD operations** for all entities
- **Board sharing and permissions**
- **Activity logging**
- **Notifications system**

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Initialize database:
```bash
npm run init-db
```

4. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update current user
- `PUT /api/users/me/password` - Change password

### Boards
- `GET /api/boards` - Get all accessible boards
- `GET /api/boards/:id` - Get board by ID
- `POST /api/boards` - Create new board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/:id/share` - Share board
- `DELETE /api/boards/:id/share/:userId` - Remove sharing

### Tasks
- `GET /api/tasks?boardId=xxx` - Get tasks for board
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Activities
- `GET /api/activities?boardId=xxx` - Get board activities

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count

### Automations
- `GET /api/automations?boardId=xxx` - Get automation rules
- `POST /api/automations` - Create rule
- `PUT /api/automations/:id` - Update rule
- `DELETE /api/automations/:id` - Delete rule

### Recurring Tasks
- `GET /api/recurring?boardId=xxx` - Get recurring templates
- `POST /api/recurring` - Create template
- `PUT /api/recurring/:id` - Update template
- `DELETE /api/recurring/:id` - Delete template

### Saved Filters
- `GET /api/filters` - Get saved filters
- `POST /api/filters` - Create filter
- `PUT /api/filters/:id` - Update filter
- `DELETE /api/filters/:id` - Delete filter

### Custom Fields
- `GET /api/custom-fields?boardId=xxx` - Get custom fields
- `POST /api/custom-fields` - Create field
- `PUT /api/custom-fields/:id` - Update field
- `DELETE /api/custom-fields/:id` - Delete field

## Database

The database is stored in `data/kanban.db` by default. The schema is automatically created on first server start.

## Authentication

All endpoints (except `/api/auth/*`) require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are valid for 7 days.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret key for JWT tokens
- `DB_PATH` - Path to SQLite database file
- `CORS_ORIGIN` - Allowed CORS origin
