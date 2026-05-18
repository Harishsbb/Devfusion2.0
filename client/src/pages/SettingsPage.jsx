import { useState, useRef } from 'react';
import { applyTheme, applyAccentColor } from '../lib/theme';
import { motion } from 'framer-motion';
import { User, Lock, Bell, Palette, Code2, Save, Camera } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../lib/api';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    githubUrl: user?.githubUrl || '',
    skills: user?.skills?.join(', ') || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [theme, setThemeState] = useState(() => localStorage.getItem('devcollab_theme') || 'dark');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('devcollab_accent_color') || '#6366f1');

  const handleThemeChange = (newTheme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    toast.success(`Theme set to ${newTheme}!`);
  };

  const handleAccentChange = (newColor) => {
    setAccentColor(newColor);
    applyAccentColor(newColor);
    toast.success('Accent color updated!');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please select an image file');
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image size must be less than 5MB');
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        setIsSaving(true);
        const data = await authAPI.updateProfile({ avatar: base64 });
        updateUser(data.user);
        toast.success('Profile image updated successfully!');
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const skills = profileForm.skills.split(',').map(s => s.trim()).filter(Boolean);
      const data = await authAPI.updateProfile({ ...profileForm, skills });
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');
    setIsSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account and preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="glass-dark rounded-2xl border border-white/[0.06] p-3 h-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all ${activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 glass-dark rounded-2xl border border-white/[0.06] p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-5">
              <h2 className="text-lg font-semibold text-white mb-5">Profile Settings</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5 pb-5 border-b border-white/10">
                <div className="relative">
                  <Avatar user={user} size="xl" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors"
                  >
                    <Camera size={12} className="text-white" />
                  </button>
                </div>
                <div>
                  <p className="text-white font-medium">{user?.name}</p>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                  <p className="text-gray-500 text-xs mt-1 capitalize">{user?.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                  <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">GitHub URL</label>
                  <input value={profileForm.githubUrl} onChange={e => setProfileForm(p => ({ ...p, githubUrl: e.target.value }))} placeholder="https://github.com/username" className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
                <textarea value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell your team about yourself..." rows={3} className="input-field resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Skills</label>
                <input value={profileForm.skills} onChange={e => setProfileForm(p => ({ ...p, skills: e.target.value }))} placeholder="React, Node.js, TypeScript" className="input-field" />
                <p className="text-xs text-gray-600 mt-1">Separate with commas</p>
              </div>

              {profileForm.skills && (
                <div className="flex flex-wrap gap-2">
                  {profileForm.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                    <span key={skill} className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{skill}</span>
                  ))}
                </div>
              )}

              <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
                Save Changes
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSave} className="space-y-5">
              <h2 className="text-lg font-semibold text-white mb-5">Security Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Current Password</label>
                <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm New Password</label>
                <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} className="input-field" required />
              </div>
              <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={15} />}
                Change Password
              </button>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white mb-5">Notification Preferences</h2>
              {[
                { label: 'Task Assignments', desc: 'When a task is assigned to you', key: 'taskAssigned' },
                { label: 'Task Comments', desc: 'When someone comments on your tasks', key: 'taskCommented' },
                { label: 'Mentions', desc: 'When you are @mentioned anywhere', key: 'mentions' },
                { label: 'Task Completions', desc: 'When tasks in your projects are completed', key: 'taskCompleted' },
                { label: 'AI Suggestions', desc: 'AI-powered project insights and suggestions', key: 'aiSuggestions' },
              ].map(({ label, desc, key }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white mb-5">Appearance</h2>
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">Theme</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark', preview: 'bg-gray-950' },
                    { id: 'light', label: 'Light', preview: 'bg-gray-100' },
                    { id: 'system', label: 'System', preview: 'bg-gradient-to-r from-gray-950 to-gray-100' },
                  ].map(item => {
                    const isActive = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleThemeChange(item.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-500/5'
                            : 'border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        <div className={`h-12 rounded-lg ${item.preview} mb-2`} />
                        <p className="text-xs text-gray-300 text-center font-medium">{item.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300 mb-3">Accent Color</p>
                <div className="flex flex-wrap gap-3">
                  {['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'].map(color => {
                    const isSelected = accentColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleAccentChange(color)}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          isSelected ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ background: color }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
