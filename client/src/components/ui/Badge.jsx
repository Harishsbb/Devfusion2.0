import { cn, priorityConfig, statusConfig } from '../../lib/utils';

export function PriorityBadge({ priority, size = 'sm' }) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium', config.color, config.bg, config.border)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.todo;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium', config.color, config.bg, config.border)}>
      {config.label}
    </span>
  );
}

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    primary: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
