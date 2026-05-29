import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Zap, ArrowRight, Check } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const perks = ['Unlimited projects on free plan', 'AI-powered task breakdown', 'Real-time team collaboration', 'Beautiful kanban boards'];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setIsLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Account created! Welcome to DevCollab 🚀');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const strength = form.password.length > 10 ? 'strong' : form.password.length > 6 ? 'medium' : form.password.length > 0 ? 'weak' : '';
  const strengthColors = { weak: 'bg-red-500', medium: 'bg-yellow-500', strong: 'bg-green-500' };
  const strengthWidths = { weak: 'w-1/3', medium: 'w-2/3', strong: 'w-full' };

  return (
    <div className="min-h-screen bg-gray-950 flex overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-purple-600/20 via-indigo-600/10 to-gray-950 items-center justify-center p-12">
        <div className="blob w-80 h-80 bg-purple-600 opacity-25 top-10 left-10" />
        <div className="blob w-64 h-64 bg-indigo-600 opacity-20 bottom-10 right-0 animation-delay-400" />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow">
              <Zap size={22} className="text-white-fixed" />
            </div>
            <span className="text-2xl font-black gradient-text">DevCollab</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Start shipping faster today</h2>
          <p className="text-gray-400 text-lg mb-10">Join 10,000+ developers using DevCollab to build better products.</p>
          <ul className="space-y-4">
            {perks.map((perk, i) => (
              <motion.li
                key={perk}
                className="flex items-center gap-3 text-gray-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-green-400" />
                </div>
                {perk}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="blob w-64 h-64 bg-indigo-600 opacity-10 top-0 right-0" />
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

          <h1 className="text-3xl font-black text-white mb-2">Create account</h1>
          <p className="text-gray-400 mb-8">Get started with your free DevCollab workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="input-field pl-10"
                />
              </div>
            </div>

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
                  placeholder="Min 6 characters"
                  className="input-field pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength]} ${strengthWidths[strength]}`} />
                  </div>
                  <span className={`text-xs capitalize ${strength === 'strong' ? 'text-green-400' : strength === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}>{strength}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat your password"
                  className="input-field pl-10"
                />
                {form.confirmPassword && (
                  <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${form.password === form.confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                    <Check size={16} />
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-indigo-400 hover:underline">Terms</a> and{' '}
              <a href="#" className="text-indigo-400 hover:underline">Privacy Policy</a>.
            </p>

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
                <> Create Account <ArrowRight size={18} /> </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
