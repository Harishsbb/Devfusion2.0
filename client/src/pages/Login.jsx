import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight, Sparkles } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setIsLoading(true);
    try {
      await login(form);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => setForm({ email: 'harish@devcollab.io', password: 'password123' });

  return (
    <div className="min-h-screen bg-gray-950 flex overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-gray-950 items-center justify-center p-12">
        <div className="blob w-96 h-96 bg-indigo-600 opacity-30 -top-20 -left-20" />
        <div className="blob w-80 h-80 bg-purple-600 opacity-20 bottom-0 right-0 animation-delay-400" />
        <div className="relative z-10 max-w-md text-center">
          <motion.div
            className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-lg"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Zap size={36} className="text-white-fixed" />
          </motion.div>
          <h2 className="text-4xl font-black text-white mb-4">Welcome back to DevCollab</h2>
          <p className="text-gray-400 text-lg leading-relaxed">The AI-powered collaboration platform for developer teams</p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[['⚡', 'Real-time'], ['🤖', 'AI-Powered'], ['🚀', 'Ship Faster']].map(([emoji, label]) => (
              <div key={label} className="glass rounded-xl p-4">
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-gray-400 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="blob w-64 h-64 bg-purple-600 opacity-10 top-1/4 right-0" />
        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap size={16} className="text-white-fixed" />
            </div>
            <span className="font-bold text-xl gradient-text">DevCollab</span>
          </div>

          <h1 className="text-3xl font-black text-white mb-2">Sign in</h1>
          <p className="text-gray-400 mb-8">Enter your credentials to access your workspace</p>

          {/* Demo banner */}
          <motion.button
            onClick={fillDemo}
            className="w-full mb-6 p-3 glass rounded-xl border border-indigo-500/30 flex items-center justify-center gap-2 text-sm text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Sparkles size={14} />
            Click to fill demo credentials
          </motion.button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@company.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Your password"
                  className="input-field pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" className="rounded bg-gray-800 border-gray-700" />
                Remember me
              </label>
              <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300">Forgot password?</a>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 rounded-xl text-base flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <> Sign in <ArrowRight size={18} /> </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create one free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
