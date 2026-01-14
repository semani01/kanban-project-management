/**
 * Initial sample tasks for demonstration purposes
 * These tasks are only used if localStorage is empty
 */

export const initialTasks = [
  {
    id: 'task-1',
    title: 'Design homepage mockup',
    description: 'Create wireframes and design mockups for the homepage. Use **Figma** for design.',
    priority: 'high',
    status: 'todo',
    category: 'work',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: 'Set up development environment',
    description: 'Install dependencies and configure the project. Check the [documentation](https://example.com) for details.',
    priority: 'high',
    status: 'in-progress',
    category: 'work',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    comments: [
      {
        id: 'comment-1',
        text: 'Node.js version 18+ required',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task-3',
    title: 'Write documentation',
    description: 'Document the API endpoints and usage. Include code examples.',
    priority: 'medium',
    status: 'done',
    category: 'education',
    dueDate: null,
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]
