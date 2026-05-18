export const colorsMap = {
  '#6366f1': { name: 'indigo', primary: '#6366f1', secondary: '#8b5cf6', hover: '#4f46e5' },
  '#8b5cf6': { name: 'violet', primary: '#8b5cf6', secondary: '#a78bfa', hover: '#7c3aed' },
  '#ec4899': { name: 'pink', primary: '#ec4899', secondary: '#f472b6', hover: '#db2777' },
  '#06b6d4': { name: 'cyan', primary: '#06b6d4', secondary: '#22d3ee', hover: '#0891b2' },
  '#10b981': { name: 'green', primary: '#10b981', secondary: '#34d399', hover: '#059669' },
  '#f59e0b': { name: 'orange', primary: '#f59e0b', secondary: '#fbbf24', hover: '#d97706' },
};

export const applyTheme = (theme) => {
  localStorage.setItem('devcollab_theme', theme);
  const root = document.documentElement;
  
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.toggle('dark', systemTheme === 'dark');
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
};

export const applyAccentColor = (color) => {
  localStorage.setItem('devcollab_accent_color', color);
  const cfg = colorsMap[color];
  if (!cfg) return;

  let styleEl = document.getElementById('dynamic-accent-theme');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-accent-theme';
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    .btn-primary {
      background: linear-gradient(135deg, ${cfg.primary} 0%, ${cfg.secondary} 100%) !important;
      box-shadow: 0 0 20px ${cfg.primary}40 !important;
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, ${cfg.hover} 0%, ${cfg.secondary} 100%) !important;
      box-shadow: 0 0 25px ${cfg.primary}60 !important;
    }
    .sidebar-item.active {
      background: linear-gradient(to right, ${cfg.primary}20, ${cfg.secondary}20) !important;
      border-color: ${cfg.primary}30 !important;
    }
    .input-field:focus {
      border-color: ${cfg.primary} !important;
      box-shadow: 0 0 0 1px ${cfg.primary}50 !important;
    }
    .text-indigo-400, .text-indigo-500, .text-indigo-300 {
      color: ${cfg.primary} !important;
    }
    .bg-indigo-500, .bg-indigo-600 {
      background-color: ${cfg.primary} !important;
    }
    .border-indigo-500\\/30 {
      border-color: ${cfg.primary}48 !important;
    }
    .border-indigo-500\\/20 {
      border-color: ${cfg.primary}33 !important;
    }
    .border-indigo-500 {
      border-color: ${cfg.primary} !important;
    }
    .shadow-glow {
      box-shadow: 0 0 20px ${cfg.primary}40 !important;
    }
  `;
};

export const initAppearance = () => {
  const theme = localStorage.getItem('devcollab_theme') || 'dark';
  const accent = localStorage.getItem('devcollab_accent_color') || '#6366f1';
  applyTheme(theme);
  applyAccentColor(accent);
};
