import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (date) => format(new Date(date), 'MMM d, yyyy');
export const formatDateTime = (date) => format(new Date(date), 'MMM d, yyyy HH:mm');
export const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

export const priorityConfig = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', dot: 'bg-red-400' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', dot: 'bg-orange-400' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', dot: 'bg-yellow-400' },
  low: { label: 'Low', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', dot: 'bg-green-400' },
};

export const statusConfig = {
  todo: { label: 'To Do', color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/30' },
  inprogress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
  inreview: { label: 'In Review', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
  done: { label: 'Done', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
};

export const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const generateAvatarColor = (name) => {
  const colors = ['from-indigo-500 to-purple-600', 'from-pink-500 to-rose-600', 'from-green-500 to-emerald-600', 'from-yellow-500 to-orange-600', 'from-cyan-500 to-blue-600', 'from-violet-500 to-purple-600'];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

export const truncate = (str, length = 50) => str?.length > length ? str.slice(0, length) + '...' : str;

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

export const languageColors = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3776ab', rust: '#ce422b',
  go: '#00add8', java: '#ed8b00', css: '#1572b6', html: '#e34f26',
  jsx: '#61dafb', tsx: '#3178c6', bash: '#4eaa25', sql: '#e48e00',
  json: '#292929', markdown: '#083fa1', yaml: '#cb171e', default: '#6366f1',
};
