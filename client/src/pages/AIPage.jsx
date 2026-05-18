import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Bot, User, Zap, FileText, Code2, Shield, TrendingUp,
  AlertTriangle, CheckCircle2, ChevronDown, Loader2, Copy, Check,
} from 'lucide-react';
import { aiAPI, projectAPI } from '../lib/api';
import useWorkspaceStore from '../store/workspaceStore';
import { PriorityBadge } from '../components/ui/Badge';
import toast from 'react-hot-toast';

const TOOLS = [
  { id: 'chat', label: 'AI Chat', icon: Bot, desc: 'Ask anything about your projects' },
  { id: 'breakdown', label: 'Task Breakdown', icon: Zap, desc: 'AI-generated subtask suggestions' },
  { id: 'standup', label: 'Standup Report', icon: FileText, desc: 'Auto-generate daily standups' },
  { id: 'codeReview', label: 'Code Review', icon: Code2, desc: 'AI-powered code analysis' },
];

const severityColors = {
  high: 'text-red-400 bg-red-400/10 border-red-400/30',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  low: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  info: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
};

const typeIcons = { bug: '🐛', security: '🔒', performance: '⚡', style: '💅' };

function ChatMessage({ message }) {
  const isAI = message.role === 'assistant';
  return (
    <motion.div
      className={`flex gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isAI ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-700'}`}>
        {isAI ? <Bot size={16} className="text-white" /> : <User size={16} className="text-gray-300" />}
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isAI ? 'glass rounded-tl-none text-gray-200' : 'bg-indigo-500/20 border border-indigo-500/30 rounded-tr-none text-gray-100'}`}>
        {message.content}
      </div>
    </motion.div>
  );
}

export default function AIPage() {
  const { workspaceId } = useParams();
  const { projects } = useWorkspaceStore();
  const [activeTool, setActiveTool] = useState('chat');
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Hi! I'm your AI assistant for DevCollab. I can help you break down tasks, generate standup reports, review code, and analyze your projects. What would you like to do?" }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleChat = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    try {
      const data = await aiAPI.chat({ message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBreakdown = async () => {
    if (!taskTitle.trim()) return toast.error('Enter a task title');
    setIsLoading(true);
    setResult(null);
    try {
      const data = await aiAPI.breakdown({ taskTitle, projectId: selectedProject });
      setResult({ type: 'breakdown', ...data });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStandup = async () => {
    if (!selectedProject) return toast.error('Select a project first');
    setIsLoading(true);
    setResult(null);
    try {
      const data = await aiAPI.standup({ projectId: selectedProject });
      setResult({ type: 'standup', ...data });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeReview = async () => {
    if (!codeInput.trim()) return toast.error('Paste some code to review');
    setIsLoading(true);
    setResult(null);
    try {
      const data = await aiAPI.codeReview({ code: codeInput, language: 'javascript' });
      setResult({ type: 'codeReview', ...data });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (result?.report) {
      navigator.clipboard.writeText(result.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          AI Assistant
        </h1>
        <p className="text-gray-400 text-sm mt-1">Powered by AI to supercharge your development workflow</p>
      </motion.div>

      {/* Tool tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => { setActiveTool(tool.id); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${activeTool === tool.id ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'glass-dark border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}
          >
            <tool.icon size={15} />
            {tool.label}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Left panel */}
        <div className="flex flex-col glass-dark rounded-2xl border border-white/[0.06] overflow-hidden">
          {activeTool === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none">
                <AnimatePresence>
                  {messages.map((msg, i) => <ChatMessage key={i} message={msg} />)}
                </AnimatePresence>
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="glass rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex gap-1.5 items-center">
                        {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat(e)}
                    placeholder="Ask AI anything about your projects..."
                    className="input-field flex-1 text-sm py-2.5"
                    disabled={isLoading}
                  />
                  <button onClick={handleChat} disabled={isLoading || !input.trim()} className="btn-primary px-4 disabled:opacity-50">
                    <Send size={16} />
                  </button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['Break down this feature', 'Generate standup', 'Review my code', 'Find blockers'].map(hint => (
                    <button key={hint} onClick={() => setInput(hint)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 glass rounded-lg border border-white/5 transition-colors">
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                {TOOLS.find(t => t.id === activeTool) && (() => {
                  const tool = TOOLS.find(t => t.id === activeTool);
                  return (
                    <>
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <tool.icon size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{tool.label}</p>
                        <p className="text-xs text-gray-500">{tool.desc}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {activeTool === 'breakdown' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Task Title</label>
                    <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="e.g. Build authentication system" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Project (optional)</label>
                    <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="input-field">
                      <option value="">Select project</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.emoji} {p.name}</option>)}
                    </select>
                  </div>
                  <button onClick={handleBreakdown} disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isLoading ? 'Generating...' : 'Generate Breakdown'}
                  </button>
                </div>
              )}

              {activeTool === 'standup' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Project</label>
                    <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="input-field">
                      <option value="">Select project</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.emoji} {p.name}</option>)}
                    </select>
                  </div>
                  <button onClick={handleStandup} disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                    {isLoading ? 'Generating...' : 'Generate Standup Report'}
                  </button>
                </div>
              )}

              {activeTool === 'codeReview' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Paste Your Code</label>
                    <textarea
                      value={codeInput}
                      onChange={e => setCodeInput(e.target.value)}
                      placeholder="// Paste your code here for AI review..."
                      rows={10}
                      className="input-field font-mono text-sm resize-none"
                    />
                  </div>
                  <button onClick={handleCodeReview} disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Code2 size={16} />}
                    {isLoading ? 'Analyzing...' : 'Review Code'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel - Results */}
        <div className="glass-dark rounded-2xl border border-white/[0.06] overflow-y-auto scrollbar-none p-5">
          <AnimatePresence mode="wait">
            {!result && !isLoading && (
              <motion.div
                className="h-full flex flex-col items-center justify-center text-center p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <Sparkles size={28} className="text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">AI Results</h3>
                <p className="text-gray-500 text-sm">Use the tools on the left to generate AI-powered insights for your projects.</p>
              </motion.div>
            )}

            {isLoading && (
              <motion.div className="h-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
                    <Sparkles size={22} className="text-white" />
                  </div>
                  <p className="text-gray-300 font-medium">AI is thinking...</p>
                  <p className="text-gray-500 text-sm mt-1">Generating insights for your project</p>
                </div>
              </motion.div>
            )}

            {result && !isLoading && (
              <motion.div className="space-y-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {result.type === 'breakdown' && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white flex items-center gap-2"><Zap size={16} className="text-indigo-400" /> Task Breakdown</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>~{result.estimatedHours}h</span>
                        <span className="capitalize px-2 py-0.5 rounded-full bg-gray-800">{result.complexity} complexity</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {result.subtasks?.map((sub, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 glass rounded-xl border border-white/5">
                          <span className="text-gray-500 text-xs w-5 text-center">{i + 1}</span>
                          <p className="text-sm text-gray-200 flex-1">{sub.title}</p>
                          <PriorityBadge priority={sub.priority} />
                        </div>
                      ))}
                    </div>
                    {result.suggestions?.length > 0 && (
                      <div className="glass rounded-xl p-4 border border-indigo-500/20 space-y-2">
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">AI Suggestions</p>
                        {result.suggestions.map((s, i) => <p key={i} className="text-sm text-gray-300">• {s}</p>)}
                      </div>
                    )}
                  </>
                )}

                {result.type === 'standup' && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white flex items-center gap-2"><FileText size={16} className="text-indigo-400" /> Standup Report</h3>
                      <button onClick={handleCopyReport} className="btn-secondary py-1.5 text-xs flex items-center gap-1.5">
                        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                      </button>
                    </div>
                    <div className="glass rounded-xl p-4 border border-white/5">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{result.report}</pre>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-green-400" />
                      Based on {result.taskCount || 0} recent tasks
                    </div>
                  </>
                )}

                {result.type === 'codeReview' && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white flex items-center gap-2"><Code2 size={16} className="text-indigo-400" /> Code Review</h3>
                      <div className={`text-sm font-bold px-3 py-1 rounded-xl ${result.score >= 80 ? 'bg-green-500/20 text-green-400' : result.score >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        Score: {result.score}/100
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{result.summary}</p>
                    <div className="space-y-2">
                      {result.issues?.map((issue, i) => (
                        <div key={i} className={`p-3 rounded-xl border ${severityColors[issue.severity]} text-sm`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span>{typeIcons[issue.type] || '💡'}</span>
                            <span className="font-medium capitalize">{issue.type}</span>
                            <span className="text-xs opacity-70">Line {issue.line}</span>
                            <span className="text-xs capitalize ml-auto">{issue.severity}</span>
                          </div>
                          <p className="opacity-80">{issue.message}</p>
                          <p className="text-xs opacity-60 mt-1 italic">→ {issue.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
