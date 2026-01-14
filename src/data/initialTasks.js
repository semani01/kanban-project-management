/**
 * Initial sample tasks for demonstration purposes
 * These tasks are only used if localStorage is empty
 */

export const initialTasks = [
  {
    id: 'task-1',
    title: 'Design homepage mockup',
    description: 'Create wireframes and design mockups for the homepage',
    priority: 'high',
    status: 'todo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: 'Set up development environment',
    description: 'Install dependencies and configure the project',
    priority: 'high',
    status: 'in-progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-3',
    title: 'Write documentation',
    description: 'Document the API endpoints and usage',
    priority: 'medium',
    status: 'done',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]
