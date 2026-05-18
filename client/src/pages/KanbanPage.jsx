import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Filter, Search, ArrowLeft, MoreHorizontal, Clock, MessageSquare,
  Paperclip, GripVertical, X, ChevronDown, User,
} from 'lucide-react';
import { taskAPI, projectAPI } from '../lib/api';
import { getSocket, emitTaskMove, emitTaskCreate } from '../lib/socket';
import useAuthStore from '../store/authStore';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { PriorityBadge, StatusBadge, Badge } from '../components/ui/Badge';
import { formatDate, timeAgo, priorityConfig } from '../lib/utils';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'border-gray-500', dot: 'bg-gray-400' },
  { id: 'inprogress', label: 'In Progress', color: 'border-blue-500', dot: 'bg-blue-400' },
  { id: 'inreview', label: 'In Review', color: 'border-purple-500', dot: 'bg-purple-400' },
  { id: 'done', label: 'Done', color: 'border-green-500', dot: 'bg-green-400' },
];

function TaskCard({ task, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSortDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} onClick={() => !isSortDragging && onClick(task)}>
      <motion.div
        className={`glass-dark rounded-xl p-3.5 border border-white/[0.06] cursor-pointer group hover:border-indigo-500/30 hover:shadow-lg transition-all ${isSortDragging ? 'shadow-glow' : ''}`}
        layout
      >
        <div className="flex items-start gap-2 mb-2">
          <button {...attributes} {...listeners} className="mt-0.5 text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 touch-none">
            <GripVertical size={14} />
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-100'}`}>{task.title}</p>
          </div>
        </div>
        {task.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 ml-6">
            {task.labels.slice(0, 3).map(l => (
              <span key={l} className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">{l}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between ml-6">
          <PriorityBadge priority={task.priority} />
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={`text-xs flex items-center gap-0.5 ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-gray-500'}`}>
                <Clock size={10} /> {formatDate(task.dueDate)}
              </span>
            )}
            {task.comments?.length > 0 && (
              <span className="text-xs text-gray-600 flex items-center gap-0.5">
                <MessageSquare size={10} /> {task.comments.length}
              </span>
            )}
            {task.assignee && <Avatar user={task.assignee} size="xs" />}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Column({ column, tasks, onAddTask, onTaskClick }) {
  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className={`flex items-center justify-between mb-3 pb-3 border-b-2 ${column.color}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
          <span className="font-semibold text-gray-200 text-sm">{column.label}</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button onClick={() => onAddTask(column.id)} className="text-gray-500 hover:text-indigo-400 transition-colors">
          <Plus size={16} />
        </button>
      </div>
      <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 min-h-[200px] pb-4">
          <AnimatePresence>
            {tasks.map(task => (
              <TaskCard key={task._id} task={task} onClick={onTaskClick} />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
      <button
        onClick={() => onAddTask(column.id)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 px-2 py-2 rounded-xl hover:bg-white/5 transition-all w-full"
      >
        <Plus size={14} /> Add task
      </button>
    </div>
  );
}

export default function KanbanPage() {
  const { workspaceId, projectId } = useParams();
  const { user } = useAuthStore();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [search, setSearch] = useState('');
  const [newComment, setNewComment] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '', labels: '', status: 'todo' });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const init = async () => {
      try {
        const [pData, tData] = await Promise.all([
          projectAPI.get(workspaceId, projectId),
          taskAPI.getAll(workspaceId, projectId),
        ]);
        setProject(pData.project);
        setTasks(tData.tasks);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const socket = getSocket();
    if (socket) {
      socket.on('task:moved', (data) => {
        setTasks(prev => prev.map(t => t._id === data.taskId ? { ...t, status: data.status } : t));
        toast(`${data.movedBy?.name} moved a task`, { icon: '🔀' });
      });
      socket.on('task:created', (data) => {
        setTasks(prev => [...prev, data.task]);
      });
    }
    return () => {
      socket?.off('task:moved');
      socket?.off('task:created');
    };
  }, [workspaceId, projectId]);

  const filteredTasks = tasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  const tasksByStatus = useCallback((status) =>
    filteredTasks.filter(t => t.status === status).sort((a, b) => a.order - b.order),
    [filteredTasks]
  );

  const findTask = (id) => tasks.find(t => t._id === id);

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeTask = findTask(active.id);
    const overTask = findTask(over.id);

    if (!activeTask) return;

    const newStatus = overTask ? overTask.status : over.id;

    if (activeTask.status !== newStatus) {
      setTasks(prev => prev.map(t => t._id === activeTask._id ? { ...t, status: newStatus } : t));
      try {
        await taskAPI.update(workspaceId, projectId, activeTask._id, { status: newStatus });
        emitTaskMove({ projectId, taskId: activeTask._id, status: newStatus });
        if (newStatus === 'done') toast.success('Task completed! 🎉');
      } catch (err) {
        setTasks(prev => prev.map(t => t._id === activeTask._id ? { ...t, status: activeTask.status } : t));
        toast.error('Failed to update task');
      }
    }
  };

  const handleAddTask = (status) => {
    setDefaultStatus(status);
    setTaskForm(p => ({ ...p, status }));
    setShowCreateModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const labels = taskForm.labels ? taskForm.labels.split(',').map(l => l.trim()).filter(Boolean) : [];
      const data = await taskAPI.create(workspaceId, projectId, { ...taskForm, labels });
      setTasks(prev => [...prev, data.task]);
      setShowCreateModal(false);
      setTaskForm({ title: '', description: '', priority: 'medium', assignee: '', dueDate: '', labels: '', status: 'todo' });
      emitTaskCreate({ projectId, task: data.task });
      toast.success('Task created!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    try {
      const data = await taskAPI.addComment(workspaceId, projectId, selectedTask._id, { content: newComment });
      setSelectedTask(prev => ({ ...prev, comments: [...(prev.comments || []), data.comment] }));
      setTasks(prev => prev.map(t => t._id === selectedTask._id ? { ...t, comments: [...(t.comments || []), data.comment] } : t));
      setNewComment('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleTaskClick = async (task) => {
    try {
      const data = await taskAPI.get(workspaceId, projectId, task._id);
      setSelectedTask(data.task);
      setShowTaskModal(true);
    } catch (_) {
      setSelectedTask(task);
      setShowTaskModal(true);
    }
  };

  if (isLoading) return (
    <div className="p-6 flex gap-4">
      {COLUMNS.map(c => (
        <div key={c.id} className="w-72 flex-shrink-0 space-y-2">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 glass-dark rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to={`/workspace/${workspaceId}/project/${projectId}`} className="text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{project?.emoji}</span> {project?.name}
            </h1>
            <p className="text-xs text-gray-500">Kanban Board</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 w-48" />
          </div>
          <button onClick={() => handleAddTask('todo')} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="p-6 flex gap-5 h-full min-w-max">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {COLUMNS.map(col => (
              <Column
                key={col.id}
                column={col}
                tasks={tasksByStatus(col.id)}
                onAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
              />
            ))}
            <DragOverlay>
              {activeId && findTask(activeId) && (
                <div className="glass-dark rounded-xl p-3.5 border border-indigo-500/40 shadow-glow opacity-90 w-72">
                  <p className="text-sm font-medium text-gray-100">{findTask(activeId)?.title}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Task" size="md">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
            <input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title..." className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Task details..." rows={3} className="input-field resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
              <select value={taskForm.status} onChange={e => setTaskForm(p => ({ ...p, status: e.target.value }))} className="input-field">
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
              <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))} className="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Due Date</label>
              <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Labels</label>
              <input value={taskForm.labels} onChange={e => setTaskForm(p => ({ ...p, labels: e.target.value }))} placeholder="ui, backend, bug" className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Task</button>
          </div>
        </form>
      </Modal>

      {/* Task Detail Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="" size="lg">
        {selectedTask && (
          <div className="-mt-6 -mx-6 -mb-6">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">{selectedTask.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={selectedTask.status} />
                    <PriorityBadge priority={selectedTask.priority} />
                    {selectedTask.labels?.map(l => <Badge key={l}>{l}</Badge>)}
                  </div>
                </div>
                <button onClick={() => setShowTaskModal(false)} className="text-gray-500 hover:text-white p-1"><X size={20} /></button>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-white/10">
              <div className="col-span-2 p-6 space-y-5">
                {selectedTask.description && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedTask.description}</p>
                  </div>
                )}
                {selectedTask.subtasks?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subtasks</h4>
                    <div className="space-y-2">
                      {selectedTask.subtasks.map((sub, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={sub.completed} readOnly className="rounded" />
                          <span className={sub.completed ? 'line-through text-gray-500' : 'text-gray-300'}>{sub.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Comments ({selectedTask.comments?.length || 0})</h4>
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto scrollbar-none">
                    {selectedTask.comments?.map((c, i) => (
                      <div key={i} className="flex gap-3">
                        <Avatar user={c.author} size="xs" className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1 glass rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-300">{c.author?.name}</span>
                            <span className="text-xs text-gray-600">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-400">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()} placeholder="Add a comment..." className="input-field flex-1 text-sm py-2" />
                    <button onClick={handleAddComment} className="btn-primary px-4 text-sm">Send</button>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Assignee</p>
                  {selectedTask.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar user={selectedTask.assignee} size="xs" />
                      <span className="text-sm text-gray-300">{selectedTask.assignee.name}</span>
                    </div>
                  ) : <span className="text-sm text-gray-600">Unassigned</span>}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Reporter</p>
                  {selectedTask.reporter && (
                    <div className="flex items-center gap-2">
                      <Avatar user={selectedTask.reporter} size="xs" />
                      <span className="text-sm text-gray-300">{selectedTask.reporter.name}</span>
                    </div>
                  )}
                </div>
                {selectedTask.dueDate && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                    <p className="text-sm text-gray-300">{formatDate(selectedTask.dueDate)}</p>
                  </div>
                )}
                {selectedTask.estimatedHours > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Estimated</p>
                    <p className="text-sm text-gray-300">{selectedTask.estimatedHours}h</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-gray-300">{timeAgo(selectedTask.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
