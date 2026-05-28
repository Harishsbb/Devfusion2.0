import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Zap, Github, ArrowRight, Check, Star, Users, FolderKanban,
  MessageSquare, Brain, Code2, BarChart3, Globe, Shield, Sparkles,
  ChevronRight, Play,
} from 'lucide-react';

const FileText = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;

const features = [
  { icon: FolderKanban, title: 'Kanban Boards', desc: 'Drag-and-drop task management with real-time updates across your entire team.', color: 'from-indigo-500 to-purple-600' },
  { icon: Brain, title: 'AI Assistant', desc: 'Generate task breakdowns, standup reports, and code reviews with GPT-powered AI.', color: 'from-pink-500 to-rose-600' },
  { icon: MessageSquare, title: 'Real-time Collaboration', desc: 'Live cursors, typing indicators, and instant updates via Socket.IO.', color: 'from-green-500 to-emerald-600' },
  { icon: Code2, title: 'Code Snippets', desc: 'Save, share, and reuse code snippets with syntax highlighting across projects.', color: 'from-yellow-500 to-orange-600' },
  { icon: FileText, title: 'Wiki & Docs', desc: 'Rich-text documentation with markdown, tables, and version history.', color: 'from-cyan-500 to-blue-600' },
  { icon: BarChart3, title: 'Analytics', desc: 'Beautiful charts tracking productivity, velocity, and team contributions.', color: 'from-violet-500 to-purple-600' },
];

const testimonials = [
  { name: 'Harish K.', role: 'Full-Stack Dev', text: 'DevCollab replaced our entire stack of Jira, Notion, and Slack. The AI features are incredible!', rating: 5 },
  { name: 'Monisha P.', role: 'UI/UX Designer', text: 'The kanban board and real-time collab features are buttery smooth. Our team productivity doubled.', rating: 5 },
  { name: 'Arjun S.', role: 'Backend Engineer', text: 'Code snippet sharing with syntax highlighting saved us hours every week. Absolutely love it.', rating: 5 },
];

const pricing = [
  { plan: 'Free', price: '$0', desc: 'Perfect for solo devs', features: ['3 Projects', '5 Team Members', 'Basic Kanban', 'Code Snippets', '1GB Storage'], cta: 'Start Free', highlight: false },
  { plan: 'Pro', price: '$12', desc: 'For growing teams', features: ['Unlimited Projects', '25 Team Members', 'AI Features', 'Analytics', 'Priority Support', '50GB Storage'], cta: 'Start Free Trial', highlight: true },
  { plan: 'Enterprise', price: '$49', desc: 'Scale with confidence', features: ['Everything in Pro', 'Unlimited Members', 'SSO & SAML', 'Custom Integrations', 'SLA Guarantee', 'Unlimited Storage'], cta: 'Contact Sales', highlight: false },
];


export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-4 inset-x-4 max-w-7xl mx-auto z-50 glass border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-glow border border-indigo-500/30">
              <img src="/logo.png" alt="DevCollab Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xl gradient-text">DevCollab</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            {['Features', 'Pricing', 'Docs', 'Blog'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Start Free <ArrowRight size={14} className="inline ml-1" /></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0">
          <div className="blob w-[600px] h-[600px] bg-indigo-600 -top-40 -left-20 opacity-20" />
          <div className="blob w-[500px] h-[500px] bg-purple-600 top-1/4 right-0 opacity-15 animation-delay-400" />
          <div className="blob w-[400px] h-[400px] bg-pink-600 bottom-0 left-1/3 opacity-10 animation-delay-600" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>

        <motion.div className="relative z-10 text-center max-w-5xl mx-auto px-6" style={{ y, opacity }}>
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-indigo-500/30 text-sm text-indigo-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles size={14} className="text-indigo-400" />
            <span>Powered by AI — Now in Public Beta</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-black leading-tight mb-6 text-balance"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-white">Collaborate.</span>{' '}
            <span className="gradient-text">Build.</span>{' '}
            <span className="text-white">Ship Faster.</span>
          </motion.h1>

          <motion.p
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            The all-in-one collaboration platform for developer teams. Kanban boards, AI features, real-time updates, code snippets, and analytics — all in one beautiful app.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/register" className="btn-primary px-8 py-3.5 text-base rounded-xl shadow-glow">
              Get Started Free <ArrowRight size={18} className="inline ml-2" />
            </Link>
            <a href="#features" className="btn-secondary px-8 py-3.5 text-base rounded-xl flex items-center gap-2">
              <Play size={16} className="text-indigo-400" /> Watch Demo
            </a>
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-6 mt-12 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2"><Check size={14} className="text-green-400" /> No credit card required</div>
            <div className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Free forever plan</div>
            <div className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Setup in 2 minutes</div>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            className="mt-20 relative"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-indigo-500/50 to-purple-500/20">
              <div className="rounded-2xl bg-gray-900 overflow-hidden shadow-2xl">
                <div className="h-8 bg-gray-800 flex items-center gap-2 px-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <div className="flex-1 mx-4 h-4 rounded bg-gray-700/50" />
                </div>
                <div className="flex h-64">
                  <div className="w-48 bg-gray-900 border-r border-white/5 p-3 space-y-1.5">
                    {['Dashboard', 'Projects', 'Analytics', 'Snippets', 'AI Assistant'].map((item, i) => (
                      <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${i === 0 ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-500'}`}>
                        <div className={`w-3 h-3 rounded ${i === 0 ? 'bg-indigo-500' : 'bg-gray-700'}`} />
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-4 space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      {[['🚀', '12 Projects', 'indigo'], ['✅', '89 Tasks', 'green'], ['👥', '8 Members', 'purple'], ['⚡', '94% Done', 'yellow']].map(([emoji, label, color]) => (
                        <div key={label} className="glass rounded-xl p-3 text-center">
                          <div className="text-lg mb-1">{emoji}</div>
                          <div className="text-xs text-gray-400">{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {['#6366f1', '#10b981', '#f59e0b'].map((color, i) => (
                        <div key={i} className="glass rounded-xl p-3 space-y-2">
                          <div className="h-2 rounded" style={{ background: color, width: `${60 + i * 15}%` }} />
                          <div className="h-1.5 bg-gray-700 rounded w-full" />
                          <div className="h-1.5 bg-gray-700 rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-indigo-500/20 blur-3xl rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['10K+', 'Developers'], ['500+', 'Teams'], ['1M+', 'Tasks Done'], ['99.9%', 'Uptime']].map(([stat, label]) => (
            <motion.div key={label} whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}>
              <div className="text-3xl font-black gradient-text mb-1">{stat}</div>
              <div className="text-gray-500 text-sm">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}>
            <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">Features</span>
            <h2 className="text-4xl font-black mt-3 mb-4">Everything your team needs</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">A complete developer-first collaboration suite that replaces multiple tools with one unified platform.</p>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="glass-dark rounded-2xl p-6 border border-white/5 card-hover group"
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon size={22} className="text-white" />
              </div>
              <h3 className="font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Loved by developers</h2>
            <p className="text-gray-400">Join thousands of dev teams building faster with DevCollab</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                className="glass-dark rounded-2xl p-6 border border-white/5"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="flex gap-1 mb-4">
                  {Array(t.rating).fill(0).map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-400">Start free, scale as you grow</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricing.map((plan, i) => (
            <motion.div
              key={plan.plan}
              className={`relative rounded-2xl p-6 ${plan.highlight ? 'bg-gradient-to-b from-indigo-500/20 to-purple-500/10 border border-indigo-500/40' : 'glass-dark border border-white/5'}`}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.plan}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-gray-500">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check size={14} className="text-green-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={plan.highlight ? 'btn-primary w-full text-center block py-3 rounded-xl' : 'btn-secondary w-full text-center block py-3 rounded-xl'}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20" />
        <div className="blob w-96 h-96 bg-indigo-500 opacity-20 top-0 left-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}>
            <h2 className="text-5xl font-black mb-6">Ready to ship faster?</h2>
            <p className="text-gray-300 text-xl mb-10">Join 10,000+ developers building better products with DevCollab.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary px-10 py-4 text-lg rounded-xl shadow-glow">
                Start Building Free <ArrowRight size={20} className="inline ml-2" />
              </Link>
              <a href="https://github.com" className="btn-secondary px-10 py-4 text-lg rounded-xl flex items-center justify-center gap-2">
                <Github size={20} /> Star on GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl overflow-hidden flex items-center justify-center border border-indigo-500/20">
              <img src="/logo.png" alt="DevCollab Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold gradient-text">DevCollab</span>
          </div>
          <p className="text-gray-500 text-sm">© 2025 DevCollab. Built for developers, by developers.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
