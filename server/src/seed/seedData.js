require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Snippet = require('../models/Snippet');
const Document = require('../models/Document');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('Seeding database...');

  await Promise.all([
    User.deleteMany({}), Workspace.deleteMany({}), Project.deleteMany({}),
    Task.deleteMany({}), Notification.deleteMany({}), Snippet.deleteMany({}),
    Document.deleteMany({}),
  ]);

  const hashedPass = await bcrypt.hash('password123', 12);

  const users = await User.insertMany([
    { name: 'Harish Kumar', email: 'harish@devcollab.io', password: hashedPass, bio: 'Full-stack developer & team lead', skills: ['React', 'Node.js', 'MongoDB'], isOnline: true },
    { name: 'Monisha Priya', email: 'monisha@devcollab.io', password: hashedPass, bio: 'UI/UX Designer & Frontend Dev', skills: ['React', 'Figma', 'Tailwind CSS'] },
    { name: 'Arjun Singh', email: 'arjun@devcollab.io', password: hashedPass, bio: 'Backend Engineer', skills: ['Node.js', 'Python', 'PostgreSQL'] },
    { name: 'Priya Sharma', email: 'priya@devcollab.io', password: hashedPass, bio: 'DevOps & Cloud Engineer', skills: ['AWS', 'Docker', 'Kubernetes'] },
  ]);

  const workspace = await Workspace.create({
    name: 'DevCollab HQ',
    description: 'Main development workspace for all team projects',
    color: '#6366f1',
    owner: users[0]._id,
    members: [
      { user: users[0]._id, role: 'owner' },
      { user: users[1]._id, role: 'admin' },
      { user: users[2]._id, role: 'member' },
      { user: users[3]._id, role: 'member' },
    ],
  });

  const projects = await Project.insertMany([
    {
      name: 'DevCollab Platform',
      description: 'The main platform development project',
      workspace: workspace._id,
      owner: users[0]._id,
      color: '#6366f1',
      emoji: '🚀',
      status: 'active',
      priority: 'high',
      tags: ['fullstack', 'react', 'nodejs'],
      members: [
        { user: users[0]._id, role: 'lead' },
        { user: users[1]._id, role: 'developer' },
        { user: users[2]._id, role: 'developer' },
      ],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      taskCount: 12,
      completedTaskCount: 4,
    },
    {
      name: 'Mobile App MVP',
      description: 'React Native mobile application',
      workspace: workspace._id,
      owner: users[1]._id,
      color: '#10b981',
      emoji: '📱',
      status: 'active',
      priority: 'medium',
      tags: ['mobile', 'react-native'],
      members: [{ user: users[1]._id, role: 'lead' }, { user: users[3]._id, role: 'developer' }],
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      taskCount: 8,
      completedTaskCount: 2,
    },
    {
      name: 'API Gateway Service',
      description: 'Microservices API gateway and authentication service',
      workspace: workspace._id,
      owner: users[2]._id,
      color: '#f59e0b',
      emoji: '⚡',
      status: 'active',
      priority: 'critical',
      tags: ['backend', 'microservices', 'api'],
      members: [{ user: users[2]._id, role: 'lead' }, { user: users[0]._id, role: 'developer' }],
      taskCount: 6,
      completedTaskCount: 3,
    },
  ]);

  const taskData = [
    { title: 'Design landing page hero section', status: 'done', priority: 'high', assignee: users[1]._id, labels: ['design', 'frontend'], order: 0 },
    { title: 'Implement JWT authentication', status: 'done', priority: 'critical', assignee: users[0]._id, labels: ['backend', 'security'], order: 1 },
    { title: 'Build Kanban board component', status: 'inprogress', priority: 'high', assignee: users[1]._id, labels: ['frontend', 'feature'], order: 0 },
    { title: 'Set up MongoDB schemas', status: 'done', priority: 'high', assignee: users[2]._id, labels: ['backend', 'database'], order: 2 },
    { title: 'Create Socket.IO real-time features', status: 'inprogress', priority: 'high', assignee: users[0]._id, labels: ['backend', 'realtime'], order: 1 },
    { title: 'Build AI integration panel', status: 'inreview', priority: 'medium', assignee: users[0]._id, labels: ['ai', 'feature'], order: 0 },
    { title: 'Implement notification system', status: 'todo', priority: 'medium', assignee: users[2]._id, labels: ['backend', 'feature'], order: 0 },
    { title: 'Create analytics dashboard', status: 'todo', priority: 'medium', assignee: users[1]._id, labels: ['frontend', 'analytics'], order: 1 },
    { title: 'Add dark/light mode toggle', status: 'todo', priority: 'low', assignee: users[1]._id, labels: ['ui', 'feature'], order: 2 },
    { title: 'Write API documentation', status: 'todo', priority: 'low', assignee: users[3]._id, labels: ['docs'], order: 3 },
    { title: 'Performance optimization', status: 'inreview', priority: 'high', assignee: users[3]._id, labels: ['performance'], order: 1 },
    { title: 'Deploy to production', status: 'todo', priority: 'critical', assignee: users[0]._id, labels: ['devops'], order: 4 },
  ];

  const tasks = await Task.insertMany(taskData.map(t => ({
    ...t,
    project: projects[0]._id,
    workspace: workspace._id,
    reporter: users[0]._id,
    dueDate: new Date(Date.now() + Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000),
    estimatedHours: Math.floor(Math.random() * 16) + 2,
  })));

  await Notification.insertMany([
    { recipient: users[0]._id, sender: users[1]._id, type: 'task_assigned', title: 'Task Assigned', message: 'Monisha assigned you "Build AI Integration Panel"', isRead: false },
    { recipient: users[0]._id, sender: users[2]._id, type: 'task_commented', title: 'New Comment', message: 'Arjun commented on "Socket.IO Setup"', isRead: false },
    { recipient: users[0]._id, sender: users[3]._id, type: 'mention', title: 'You were mentioned', message: 'Priya mentioned you in "Deploy to Production"', isRead: false },
    { recipient: users[0]._id, sender: users[1]._id, type: 'task_completed', title: 'Task Completed', message: 'Design landing page hero section was completed!', isRead: true },
    { recipient: users[0]._id, sender: users[2]._id, type: 'task_moved', title: 'Task Moved', message: 'Arjun moved "API Gateway" to In Review', isRead: true },
  ]);

  await Snippet.insertMany([
    {
      title: 'React Custom Hook - useLocalStorage',
      description: 'Persistent state hook using localStorage',
      code: `import { useState, useEffect } from 'react';\n\nconst useLocalStorage = (key, initialValue) => {\n  const [value, setValue] = useState(() => {\n    try {\n      return JSON.parse(localStorage.getItem(key)) ?? initialValue;\n    } catch { return initialValue; }\n  });\n\n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value));\n  }, [key, value]);\n\n  return [value, setValue];\n};\n\nexport default useLocalStorage;`,
      language: 'javascript',
      tags: ['react', 'hooks', 'localStorage'],
      author: users[0]._id,
      workspace: workspace._id,
      views: 42, copies: 18,
    },
    {
      title: 'Express Rate Limiter Middleware',
      description: 'Configurable rate limiting for API routes',
      code: `const rateLimit = require('express-rate-limit');\n\nconst createRateLimiter = (windowMs, max, message) =>\n  rateLimit({\n    windowMs,\n    max,\n    message: { success: false, message },\n    standardHeaders: true,\n    legacyHeaders: false,\n  });\n\nmodule.exports = {\n  apiLimiter: createRateLimiter(15 * 60 * 1000, 100, 'Too many requests'),\n  authLimiter: createRateLimiter(15 * 60 * 1000, 5, 'Too many auth attempts'),\n};`,
      language: 'javascript',
      tags: ['express', 'security', 'middleware'],
      author: users[2]._id,
      workspace: workspace._id,
      views: 35, copies: 12,
    },
    {
      title: 'Tailwind Gradient Card Component',
      description: 'Beautiful glassmorphism card with gradient border',
      code: `export const GlassCard = ({ children, className = '' }) => (\n  <div className={\`relative p-[1px] rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 \${className}\`}>\n    <div className="rounded-2xl bg-gray-900/90 backdrop-blur-xl p-6">\n      {children}\n    </div>\n  </div>\n);`,
      language: 'jsx',
      tags: ['react', 'tailwind', 'ui', 'glassmorphism'],
      author: users[1]._id,
      workspace: workspace._id,
      views: 89, copies: 34,
    },
  ]);

  await Document.insertMany([
    {
      title: 'Project Architecture Overview',
      emoji: '🏗️',
      content: '# Project Architecture\n\n## Overview\n\nDevCollab is built as a monorepo with separate frontend and backend packages.\n\n## Tech Stack\n\n- **Frontend**: React + Vite + Tailwind CSS\n- **Backend**: Node.js + Express\n- **Database**: MongoDB Atlas\n- **Realtime**: Socket.IO\n\n## Folder Structure\n\nSee the repository README for the full folder structure.',
      project: projects[0]._id,
      workspace: workspace._id,
      author: users[0]._id,
      lastEditedBy: users[0]._id,
      isPublished: true,
      tags: ['architecture', 'documentation'],
      views: 23,
    },
    {
      title: 'API Documentation',
      emoji: '📡',
      content: '# API Documentation\n\n## Authentication\n\n### POST /api/auth/login\nLogin with email and password.\n\n**Body:**\n```json\n{\n  "email": "user@example.com",\n  "password": "password"\n}\n```\n\n**Response:**\n```json\n{\n  "success": true,\n  "token": "jwt_token",\n  "user": { ... }\n}\n```',
      project: projects[0]._id,
      workspace: workspace._id,
      author: users[2]._id,
      lastEditedBy: users[2]._id,
      isPublished: true,
      tags: ['api', 'documentation'],
      views: 15,
    },
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('\n📧 Test accounts:');
  console.log('   harish@devcollab.io / password123 (Owner)');
  console.log('   monisha@devcollab.io / password123 (Admin)');
  console.log('   arjun@devcollab.io / password123 (Member)');
  console.log('   priya@devcollab.io / password123 (Member)');
  process.exit(0);
};

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
