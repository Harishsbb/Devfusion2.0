import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Search, Edit3, Trash2, Eye, Clock, Save, X, ArrowLeft } from 'lucide-react';
import { documentAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { timeAgo, formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

function DocEditor({ doc, onSave, onClose }) {
  const [title, setTitle] = useState(doc?.title || '');
  const [content, setContent] = useState(doc?.content || '');
  const [emoji, setEmoji] = useState(doc?.emoji || '📄');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return toast.error('Title is required');
    setIsSaving(true);
    try {
      await onSave({ title, content, emoji });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-5 border-b border-white/10">
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
        <input value={emoji} onChange={e => setEmoji(e.target.value)} className="w-10 text-center text-2xl bg-transparent border-0 outline-none" maxLength={2} />
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Document title..."
          className="flex-1 text-xl font-bold text-white bg-transparent border-0 outline-none placeholder-gray-600"
        />
        <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-2 text-sm">
          {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </div>
      <div className="flex-1 overflow-auto p-5">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Start writing... Markdown is supported.

# Heading 1
## Heading 2

**Bold text** and *italic text*

- List item 1
- List item 2

```javascript
// Code blocks
const hello = 'world';
```"
          className="w-full h-full bg-transparent text-gray-200 text-sm leading-relaxed resize-none outline-none placeholder-gray-700 font-mono"
        />
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { workspaceId, projectId } = useParams();
  const { user } = useAuthStore();
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);

  useEffect(() => {
    loadDocs();
  }, [workspaceId, projectId]);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const data = await documentAPI.getAll(workspaceId, projectId);
      setDocs(data.documents);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (docData) => {
    try {
      const data = await documentAPI.create(workspaceId, projectId, docData);
      setDocs(prev => [data.document, ...prev]);
      setIsCreating(false);
      toast.success('Document created!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdate = async (docData) => {
    if (!editingDoc) return;
    try {
      const data = await documentAPI.update(workspaceId, projectId, editingDoc._id, docData);
      setDocs(prev => prev.map(d => d._id === editingDoc._id ? data.document : d));
      setEditingDoc(null);
      toast.success('Document saved!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentAPI.delete(workspaceId, projectId, docId);
      setDocs(prev => prev.filter(d => d._id !== docId));
      toast.success('Document deleted');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filtered = docs.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()));

  if (editingDoc || isCreating) {
    return (
      <div className="h-full glass-dark border-t border-white/[0.06]">
        <DocEditor
          doc={isCreating ? null : editingDoc}
          onSave={isCreating ? handleCreate : handleUpdate}
          onClose={() => { setEditingDoc(null); setIsCreating(false); }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <motion.div className="flex items-center justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <FileText className="text-indigo-400" /> Documentation
          </h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage project wikis and documentation</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Document
        </button>
      </motion.div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="input-field pl-9 text-sm" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-40 glass-dark rounded-2xl border border-white/5 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-dark rounded-2xl border border-white/[0.06] p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl overflow-hidden flex items-center justify-center shadow-glow border border-indigo-500/20">
            <img src="/doc_logo.png" alt="Wiki Logo" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-white font-semibold mb-2">No documents yet</h3>
          <p className="text-gray-400 text-sm mb-6">Create your first project document or wiki page</p>
          <button onClick={() => setIsCreating(true)} className="btn-primary">
            <Plus size={16} className="inline mr-1" /> New Document
          </button>
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" layout>
          <AnimatePresence>
            {filtered.map((doc, i) => (
              <motion.div
                key={doc._id}
                className="glass-dark rounded-2xl border border-white/[0.06] p-5 card-hover cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setViewDoc(doc)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{doc.emoji}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); setEditingDoc(doc); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"><Edit3 size={13} /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(doc._id); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">{doc.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{doc.content?.slice(0, 120) || 'Empty document'}</p>
                <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Avatar user={doc.lastEditedBy || doc.author} size="xs" />
                    <span>{(doc.lastEditedBy || doc.author)?.name}</span>
                  </div>
                  <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(doc.updatedAt)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* View Document Modal */}
      <Modal isOpen={!!viewDoc} onClose={() => setViewDoc(null)} title="" size="xl">
        {viewDoc && (
          <div className="-mt-6 -mx-6 -mb-6">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{viewDoc.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{viewDoc.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <Avatar user={viewDoc.author} size="xs" />
                    <span>{viewDoc.author?.name}</span>
                    <span>·</span>
                    <span>{timeAgo(viewDoc.updatedAt)}</span>
                    <span>·</span>
                    <span><Eye size={10} className="inline" /> {viewDoc.views} views</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setViewDoc(null); setEditingDoc(viewDoc); }} className="btn-secondary text-sm py-1.5 flex items-center gap-1.5"><Edit3 size={13} /> Edit</button>
                <button onClick={() => setViewDoc(null)} className="text-gray-500 hover:text-white p-1"><X size={18} /></button>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto scrollbar-none">
              <div className="prose prose-invert prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-300 text-sm leading-relaxed">{viewDoc.content || 'Empty document'}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
