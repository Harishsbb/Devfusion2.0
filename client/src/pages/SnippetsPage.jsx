import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Copy, Eye, Heart, Code2, Tag, Filter, Check, Trash2 } from 'lucide-react';
import { snippetAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import { timeAgo, languageColors } from '../lib/utils';
import toast from 'react-hot-toast';

const LANGUAGES = ['javascript', 'typescript', 'python', 'jsx', 'tsx', 'css', 'html', 'go', 'rust', 'sql', 'bash', 'json', 'yaml'];

function SnippetCard({ snippet, onCopy, onView, onDelete, currentUserId }) {
  const [copied, setCopied] = useState(false);
  const color = languageColors[snippet.language] || languageColors.default;

  const handleCopy = async (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    onCopy(snippet._id);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  return (
    <motion.div
      className="glass-dark rounded-2xl border border-white/[0.06] overflow-hidden card-hover cursor-pointer group"
      onClick={() => onView(snippet)}
      layout
    >
      <div className="p-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs font-mono text-gray-400 uppercase">{snippet.language}</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            {snippet.author?._id === currentUserId && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(snippet._id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        <h3 className="font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{snippet.title}</h3>
        {snippet.description && <p className="text-xs text-gray-500 mt-1 truncate">{snippet.description}</p>}
      </div>
      <div className="relative">
        <pre className="p-4 text-xs text-gray-300 font-mono overflow-hidden max-h-28 leading-relaxed bg-gray-900/50">
          <code>{snippet.code.slice(0, 300)}{snippet.code.length > 300 ? '...' : ''}</code>
        </pre>
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-gray-900 to-transparent" />
      </div>
      <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <Avatar user={snippet.author} size="xs" />
          <span className="text-xs text-gray-500">{snippet.author?.name}</span>
          <span className="text-xs text-gray-700">·</span>
          <span className="text-xs text-gray-600">{timeAgo(snippet.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Eye size={11} /> {snippet.views}</span>
          <span className="flex items-center gap-1"><Copy size={11} /> {snippet.copies}</span>
        </div>
      </div>
      {snippet.tags?.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {snippet.tags.slice(0, 4).map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">#{t}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function SnippetsPage() {
  const { workspaceId } = useParams();
  const { user } = useAuthStore();
  const [snippets, setSnippets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewSnippet, setViewSnippet] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', code: '', language: 'javascript', tags: '', isPublic: false });

  useEffect(() => {
    loadSnippets();
  }, [workspaceId, filterLang]);

  const loadSnippets = async () => {
    setIsLoading(true);
    try {
      const data = await snippetAPI.getAll(workspaceId, { language: filterLang || undefined });
      setSnippets(data.snippets);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const data = await snippetAPI.create(workspaceId, { ...form, tags });
      setSnippets(prev => [data.snippet, ...prev]);
      setShowCreate(false);
      setForm({ title: '', description: '', code: '', language: 'javascript', tags: '', isPublic: false });
      toast.success('Snippet saved!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await snippetAPI.delete(workspaceId, id);
      setSnippets(prev => prev.filter(s => s._id !== id));
      toast.success('Snippet deleted');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCopy = async (id) => {
    await snippetAPI.copy(workspaceId, id);
    setSnippets(prev => prev.map(s => s._id === id ? { ...s, copies: s.copies + 1 } : s));
  };

  const filtered = snippets.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Code2 className="text-indigo-400" /> Code Snippets
          </h1>
          <p className="text-gray-400 text-sm mt-1">Save and share reusable code across your team</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Snippet
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search snippets..." className="input-field pl-9 text-sm py-2" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterLang('')} className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${!filterLang ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'glass-dark border-white/10 text-gray-400 hover:text-white'}`}>
            All
          </button>
          {LANGUAGES.slice(0, 6).map(lang => (
            <button key={lang} onClick={() => setFilterLang(lang === filterLang ? '' : lang)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${filterLang === lang ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'glass-dark border-white/10 text-gray-400 hover:text-white'}`}>
              <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5" style={{ background: languageColors[lang] || '#6366f1' }} />
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span><span className="text-white font-semibold">{filtered.length}</span> snippets</span>
        <span><span className="text-white font-semibold">{snippets.reduce((a, s) => a + s.copies, 0)}</span> total copies</span>
        <span><span className="text-white font-semibold">{snippets.reduce((a, s) => a + s.views, 0)}</span> total views</span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-56 glass-dark rounded-2xl border border-white/5 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-dark rounded-2xl border border-white/[0.06] p-12 text-center">
          <Code2 size={36} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No snippets found</h3>
          <p className="text-gray-400 text-sm mb-6">Save your first reusable code snippet</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} className="inline mr-1" /> New Snippet
          </button>
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" layout>
          <AnimatePresence>
            {filtered.map((snippet, i) => (
              <motion.div key={snippet._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
                <SnippetCard snippet={snippet} onCopy={handleCopy} onView={setViewSnippet} onDelete={handleDelete} currentUserId={user?._id} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Save Snippet" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Snippet title" className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Language</label>
              <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} className="input-field">
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Tags</label>
              <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="react, hooks, util" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What does this snippet do?" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Code *</label>
            <textarea value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="// Paste your code here..." rows={10} className="input-field font-mono text-sm resize-none" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Snippet</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewSnippet} onClose={() => setViewSnippet(null)} title={viewSnippet?.title} size="xl">
        {viewSnippet && (
          <div className="space-y-4 -mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-gray-800 px-3 py-1 rounded-full text-gray-300 uppercase" style={{ borderLeft: `3px solid ${languageColors[viewSnippet.language] || '#6366f1'}` }}>
                  {viewSnippet.language}
                </span>
                {viewSnippet.tags?.map(t => <span key={t} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">#{t}</span>)}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(viewSnippet.code); toast.success('Copied!'); }} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
                <Copy size={13} /> Copy
              </button>
            </div>
            {viewSnippet.description && <p className="text-gray-400 text-sm">{viewSnippet.description}</p>}
            <div className="relative">
              <pre className="bg-gray-900 rounded-xl p-5 text-sm text-gray-200 font-mono overflow-x-auto max-h-96 border border-gray-800 leading-relaxed scrollbar-none">
                <code>{viewSnippet.code}</code>
              </pre>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Avatar user={viewSnippet.author} size="xs" />
                <span>{viewSnippet.author?.name}</span>
                <span>·</span>
                <span>{timeAgo(viewSnippet.createdAt)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Eye size={11} /> {viewSnippet.views} views</span>
                <span className="flex items-center gap-1"><Copy size={11} /> {viewSnippet.copies} copies</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
