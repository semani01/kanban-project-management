# Kanban Project Management App

A modern, interactive Kanban board application built with React and Node.js for managing tasks and projects.

## Features

- **Kanban Board**: Three columns (To Do, In Progress, Done) for organizing tasks
- **Drag and Drop**: Intuitive drag-and-drop functionality to move tasks between columns
- **Task Management**: Create, edit, and delete tasks with full CRUD operations
- **Priority Levels**: Assign priority levels (High, Medium, Low) with color-coded indicators
- **Backend API**: RESTful API with Express.js and SQLite database
- **User Authentication**: JWT-based authentication system
- **Board Sharing**: Share boards with other users with permission levels
- **Modern UI**: Clean, responsive design with smooth animations

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install and initialize backend:
```bash
npm run server:init
```

3. Start both frontend and backend:
```bash
npm run dev:full
```

Or start them separately:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run server:dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Environment Setup

1. Copy `.env.example` to `.env` in the root directory
2. Copy `server/.env.example` to `server/.env`
3. Update environment variables as needed

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── Task.jsx        # Individual task card component
│   ├── Column.jsx      # Kanban column component
│   ├── KanbanBoard.jsx # Main board container
│   └── TaskForm.jsx    # Task creation/editing modal
├── utils/              # Utility functions
│   └── storage.js      # localStorage helpers
├── data/               # Initial data
│   └── initialTasks.js # Sample tasks
├── styles/             # CSS styles
│   └── App.css         # Main stylesheet
├── App.jsx             # Main application component
└── main.jsx            # Application entry point
```

## Usage

- **Create Task**: Click the "+ Create Task" button in the header
- **Edit Task**: Click the "Edit" button on any task card
- **Delete Task**: Click the "Delete" button on any task card (confirmation required)
- **Move Task**: Drag and drop tasks between columns to change their status
- **Set Priority**: Choose priority level when creating or editing a task

## Technologies Used

- React 18
- Vite (build tool)
- react-beautiful-dnd (drag and drop)
- CSS3 (styling)
