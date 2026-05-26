# 🤖 AI Integration & Features

DevCollab features built-in AI tools powered by Gemini and OpenAI models. These features help developers automate routine management, review code, standup daily tasks, and converse with an AI project agent.

---

## ⚡ AI Functionalities

### 1. AI Task Breakdown
- **Endpoint**: `POST /api/ai/breakdown`
- **Purpose**: Generates a set of structured subtasks, complexity rating, and hours estimation for any given task description.
- **Input Parameters**:
  - `taskTitle`: String (required)
  - `description`: String (optional)
  - `projectId`: String (optional)
- **Response Format**:
  - `subtasks`: Array of objects containing `{ title, priority }`
  - `estimatedHours`: Number
  - `complexity`: String ('low', 'medium', 'high')
  - `suggestions`: Array of guidelines.

### 2. Automated Daily Standup Reports
- **Endpoint**: `POST /api/ai/standup`
- **Purpose**: Analyzes the active user's completed/modified tasks in the last 24 hours to formulate a cohesive standup report.
- **Input Parameters**:
  - `projectId`: String (required)

### 3. Smart Project Progress Summary
- **Endpoint**: `GET /api/ai/projects/:projectId/summary`
- **Purpose**: Crawls all tasks in a project to yield a progress report, overall health score (0-100), risk identifiers, and next-action advice.

### 4. Real-time Code Reviewer
- **Endpoint**: `POST /api/ai/review`
- **Purpose**: Analyzes a raw block of code to find bugs, security loopholes, performance limits, and stylistic improvements.
- **Input Parameters**:
  - `code`: String (required)
  - `language`: String (required, e.g., 'javascript')
- **Response Format**:
  - `issues`: Array of objects containing `{ type, severity, line, message, suggestion }`
  - `score`: Number (overall code quality score out of 100)
  - `summary`: Overview markdown.

### 5. Blocker Detection Agent
- **Endpoint**: `GET /api/ai/projects/:projectId/blockers`
- **Purpose**: Identifies overdue tasks, inactive tasks, and potential bottlenecks.

### 6. Conversational Chatbot Companion
- **Endpoint**: `POST /api/ai/chat`
- **Purpose**: An AI project agent that answers questions and offers project-management guidance.

---

## 🔌 Connecting Real AI APIs

The project is currently configured with high-fidelity mock services to support offline developer environments and quick evaluation. To activate real AI integrations, follow these steps:

### Step 1: Update API Keys in `server/.env`
Ensure you add the relevant API keys to your `.env` configuration file:
```env
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere...
OPENAI_API_KEY=sk-proj-YourOpenAiApiKeyHere...
```

### Step 2: Integrate Node.js Client Libraries
Install the official SDKs in the `server/` directory:
```bash
cd server
npm install @google/generative-ai openai
```

### Step 3: Replace Mock Code in `server/src/controllers/aiController.js`
Replace the `mockAIResponse` logic with a request to the SDKs. For example, using Gemini:

```javascript
const { GoogleGenAI } = require('@google/generative-ai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getGeminiResponse = async (prompt) => {
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const response = await model.generateContent(prompt);
  return response.response.text();
};
```
