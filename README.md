# Kanban Project Management App

A modern, interactive Kanban board application built with React for managing tasks and projects.

## Features

- **Kanban Board**: Three columns (To Do, In Progress, Done) for organizing tasks
- **Drag and Drop**: Intuitive drag-and-drop functionality to move tasks between columns
- **Task Management**: Create, edit, and delete tasks with full CRUD operations
- **Priority Levels**: Assign priority levels (High, Medium, Low) with color-coded indicators
- **Data Persistence**: All tasks are automatically saved to browser localStorage
- **Modern UI**: Clean, responsive design with smooth animations

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

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
