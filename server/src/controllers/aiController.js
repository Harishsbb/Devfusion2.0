const Task = require('../models/Task');
const Project = require('../models/Project');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
const getAI = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const callGemini = async (prompt, systemInstruction = '') => {
  const client = getAI();
  if (!client) {
    throw new Error('Google Gemini API Key is not configured. Please add GEMINI_API_KEY to your server .env file.');
  }

  const model = client.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: systemInstruction || 'You are an advanced software engineering and project management assistant.'
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });

  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('Failed to parse Gemini JSON response:', text);
    throw new Error('AI returned an invalid JSON structure.');
  }
};

exports.generateTaskBreakdown = async (req, res, next) => {
  try {
    const { taskTitle, description } = req.body;
    if (!taskTitle) return res.status(400).json({ success: false, message: 'Task title required' });

    const prompt = `Break down the following software engineering task into subtasks:
Task Title: ${taskTitle}
Description: ${description || 'No description provided.'}

Return your response in the following JSON format:
{
  "subtasks": [
    { "title": "subtask title", "priority": "low" | "medium" | "high" }
  ],
  "estimatedHours": 24,
  "complexity": "low" | "medium" | "high",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    const result = await callGemini(prompt);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

exports.generateStandup = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const recentTasks = await Task.find({
      project: projectId,
      assignee: req.user._id,
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).populate('assignee', 'name');

    const prompt = `Create a professional developer daily standup report (formatted in Markdown) based on the following tasks worked on in the past 24 hours:
${JSON.stringify(recentTasks.map(t => ({ title: t.title, description: t.description, status: t.status })))}

Return your response in the following JSON format:
{
  "report": "Markdown daily standup report string containing: **Yesterday:** (what was done based on completed/in-progress tasks), **Today:** (what will be done next), **Blockers:** (potential blockages or 'None identified')"
}`;

    const result = await callGemini(prompt);
    res.json({ success: true, ...result, taskCount: recentTasks.length });
  } catch (error) {
    next(error);
  }
};

exports.generateProjectSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const tasks = await Task.find({ project: projectId });

    const prompt = `Analyze the current state of this software project and generate a progress summary:
Project Name: ${project.name}
Description: ${project.description || 'No description.'}
Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate })))}

Return your response in the following JSON format:
{
  "summary": "Overall project progress summary",
  "healthScore": 85, // number from 0 to 100 representing project health
  "risks": ["risk 1", "risk 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    const result = await callGemini(prompt);
    res.json({ success: true, project: project.name, ...result });
  } catch (error) {
    next(error);
  }
};

exports.reviewCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code is required' });

    const prompt = `Perform a code review on the following code snippet:
Language: ${language || 'Detect language'}
Code:
\`\`\`
${code}
\`\`\`

Return your response in the following JSON format:
{
  "issues": [
    { "type": "bug" | "security" | "performance" | "style" | "info", "severity": "low" | "medium" | "high" | "info", "line": number, "message": "explanation", "suggestion": "remediation suggestion" }
  ],
  "score": 80, // score from 0 to 100 for code quality
  "summary": "Overall code review summary string"
}`;

    const result = await callGemini(prompt);
    res.json({ success: true, language: language || 'unknown', ...result });
  } catch (error) {
    next(error);
  }
};

exports.detectBlockers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const overdueTasks = await Task.find({
      project: projectId,
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() },
    }).populate('assignee', 'name');

    const prompt = `Identify potential blockers and risks based on the following overdue tasks in the project:
${JSON.stringify(overdueTasks.map(t => ({ title: t.title, dueDate: t.dueDate, assignee: t.assignee?.name })))}

Return your response in the following JSON format:
{
  "blockers": [
    { "task": "task title", "issue": "reason why it is a blocker", "impact": "low" | "medium" | "high", "suggestion": "remediation action" }
  ],
  "overallRisk": "low" | "medium" | "high"
}`;

    const result = await callGemini(prompt);
    res.json({ success: true, overdueTasks: overdueTasks.length, ...result });
  } catch (error) {
    next(error);
  }
};

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const prompt = `The user says: "${message}"
Respond as an expert software project management AI assistant.

Return your response in the following JSON format:
{
  "message": "Your helpful response string"
}`;

    const result = await callGemini(prompt);
    res.json({ success: true, ...result, timestamp: new Date() });
  } catch (error) {
    next(error);
  }
};
