import { cn, getInitials, generateAvatarColor } from '../../lib/utils';

const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' };

export default function Avatar({ user, size = 'md', className, showOnline = false }) {
  const sizeClass = sizes[size] || sizes.md;
  const gradientClass = generateAvatarColor(user?.name);

  return (
    <div className={cn('relative flex-shrink-0', className)}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={cn('rounded-full object-cover ring-2 ring-white/10', sizeClass)}
        />
      ) : (
        <div className={cn('rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white-fixed ring-2 ring-white/10', sizeClass, gradientClass)}>
          {getInitials(user?.name)}
        </div>
      )}
      {showOnline && user?.isOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-gray-900" />
      )}
    </div>
  );
}

export function AvatarGroup({ users = [], max = 4, size = 'sm' }) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;
  const sizeClass = sizes[size] || sizes.sm;

  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => (
        <div key={user._id || i} className="relative" title={user.name}>
          <Avatar user={user} size={size} className="ring-2 ring-gray-900" />
        </div>
      ))}
      {remaining > 0 && (
        <div className={cn('rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-medium ring-2 ring-gray-900', sizeClass)}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
