import { Link } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import { Navbar } from '~/components/Navbar';
import type { Route } from "./+types/home";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "SynergyOS - AI-Powered Business Management Platform" },
    { name: "description", content: "Transform your business with AI-driven project management, intelligent automation, and enterprise-grade security" },
  ];
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const strategicPillars = [
    {
      title: "Unified Execution Layer",
      metric: "44 secure APIs",
      description:
        "Every workflow, approval, and data sync flows through a governed API catalog so leadership has one source of truth.",
    },
    {
      title: "Zero-Trust Delivery",
      metric: "OTP + httpOnly tokens",
      description:
        "Cookie-based refresh, OTP verification, and continuous audit logging eliminate the usual SaaS blind spots.",
    },
    {
      title: "Operational Intelligence",
      metric: "AI + Celery",
      description:
        "Predictive insights, automated assignments, and scheduled jobs free teams from manual coordination.",
    },
  ];

  const executiveOutcomes = [
    {
      role: "COO",
      priority: "Predictable Delivery",
      impact: "42% faster release cadence",
      detail: "Cross-functional dashboards expose blockers early and keep capital programs on schedule.",
    },
    {
      role: "CIO",
      priority: "Platform Consolidation",
      impact: "7 containers → 1 control plane",
      detail: "Dockerized services, shared secrets, and IaC-ready configs reduce tool sprawl and hosting costs.",
    },
    {
      role: "CISO",
      priority: "Continuous Compliance",
      impact: "Zero critical incidents",
      detail: "OTP, RBAC, and audit-ready logs satisfy SOC2/ISO requirements without bolt-on tools.",
    },
  ];

  const impactMilestones = [
    {
      label: "Week 0-2",
      title: "Stabilize Access",
      description: "Roll out cookie-based auth, OTP, and refresh automation—reduce credential risk immediately.",
    },
    {
      label: "Week 3-6",
      title: "Instrument Workstreams",
      description: "Connect departments via the 44 API endpoints and import historical projects for unified telemetry.",
    },
    {
      label: "Week 7-12",
      title: "Automate & Scale",
      description: "Launch AI insights, Celery routines, and SLA dashboards to keep growth initiatives on track.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-blue-500/10 rounded-lg rotate-45"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Operating System For Mission-Critical Work
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              SynergyOS unifies AI automation, executive visibility, and zero-trust security into one control plane so high-stakes programs never slip.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
              </Link>
              <a
                href="#features"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-semibold text-lg transition-all"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {[
              { icon: "🧩", value: "44", label: "Production APIs" },
              { icon: "🐳", value: "7", label: "Composable Services" },
              { icon: "🛡️", value: "0", label: "Security Incidents" },
              { icon: "⚡", value: "99.95%", label: "Uptime SLO" },
            ].map((stat, index) => (
              <div key={index} className="relative bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all"></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">{stat.icon}</div>
                  <div className="text-3xl font-bold text-blue-400 mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Importance Section */}
      <section id="importance" className="relative py-20 px-6 bg-slate-950/50 border-t border-b border-slate-800/50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`
          }}></div>
          <div className="absolute top-10 right-10 w-64 h-64 border border-blue-500/10 rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 border border-purple-500/10 rotate-45"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[0.35em] text-sm text-blue-300/70 mb-3">Why this project matters</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">A Control Plane For Every Critical Initiative</h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
              SynergyOS collapses disconnected spreadsheets, status decks, and ad-hoc tools into a single governed workflow so leadership can steer with confidence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {strategicPillars.map((pillar, index) => (
              <div
                key={pillar.title}
                className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-blue-500/20 rounded-bl-lg"></div>
                <div className="relative z-10">
                  <div className="text-sm text-blue-300 tracking-[0.3em] uppercase mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    Pillar {index + 1}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{pillar.title}</h3>
                  <p className="text-blue-400 font-semibold mb-4">{pillar.metric}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-6 bg-gradient-to-b from-slate-900/50 to-slate-950/50 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%233b82f6' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to manage projects efficiently and securely
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "AI-Powered Insights",
                description: "Get intelligent predictions, automated task assignments, and smart recommendations powered by advanced AI",
              },
              {
                icon: "📋",
                title: "Project Management",
                description: "Create, track, and manage projects with intuitive boards, timelines, and real-time collaboration tools",
              },
              {
                icon: "✅",
                title: "Task Automation",
                description: "Automate repetitive tasks, set up workflows, and let AI handle routine project management activities",
              },
              {
                icon: "👥",
                title: "Team Collaboration",
                description: "Work seamlessly with your team through real-time updates, comments, and integrated communication",
              },
              {
                icon: "🔒",
                title: "Enterprise Security",
                description: "Multi-factor authentication, role-based access control, and comprehensive audit logs for complete security",
              },
              {
                icon: "📊",
                title: "Advanced Analytics",
                description: "Visualize project progress, team performance, and business metrics with beautiful, interactive dashboards",
              },
              {
                icon: "🔔",
                title: "Smart Notifications",
                description: "Stay informed with intelligent alerts about project updates, deadlines, and security events",
              },
              {
                icon: "🌐",
                title: "OAuth Integration",
                description: "Sign in with Google, GitHub, or your favorite identity provider for seamless authentication",
              },
              {
                icon: "⚡",
                title: "Lightning Fast",
                description: "Built with modern technology for blazing-fast performance and responsive user experience",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/40 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105 group backdrop-blur-sm overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border border-blue-500/10 rounded-tr-2xl"></div>
                <div className="relative z-10">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executive Outcomes Section */}
      <section id="executive-focus" className="relative py-20 px-6 bg-slate-950/70 border-b border-slate-800/50 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(59, 130, 246, 0.5) 35px, rgba(59, 130, 246, 0.5) 36px)`
        }}></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-sm text-purple-300/70 mb-3">Board-level outcomes</p>
            <h2 className="text-4xl font-bold mb-4">Why leadership bets on SynergyOS</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Each persona sees measurable value within the first quarter, from predictable execution to provable compliance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {executiveOutcomes.map((item, idx) => (
              <div key={item.role} className="relative bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500/50 to-transparent"></div>
                <div className="absolute top-4 right-4 w-12 h-12 border border-purple-500/20 rounded-lg rotate-12"></div>
                <div className="relative z-10">
                  <div className="text-sm text-slate-400 uppercase tracking-[0.35em] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-xs">{idx + 1}</span>
                    {item.role}
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{item.priority}</h3>
                  <p className="text-purple-300 font-semibold mb-4">{item.impact}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.4) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get started in minutes with our simple 4-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up",
                description: "Create your free account in seconds with email or OAuth",
                icon: "👤",
              },
              {
                step: "2",
                title: "Create Projects",
                description: "Set up your projects, add team members, and define goals",
                icon: "📁",
              },
              {
                step: "3",
                title: "AI Automation",
                description: "Let AI optimize workflows and predict project outcomes",
                icon: "🤖",
              },
              {
                step: "4",
                title: "Track & Succeed",
                description: "Monitor progress and achieve your business objectives",
                icon: "🎯",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-center backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                      {item.step}
                    </div>
                    <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                    <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.description}</p>
                  </div>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <div className="text-blue-500 text-3xl">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Timeline Section */}
      <section id="impact-timeline" className="relative py-20 px-6 bg-gradient-to-br from-slate-950/50 to-slate-900/50 border-y border-slate-800/50 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 25 40, 50 50 T 100 50' fill='none' stroke='%2310b981' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="uppercase tracking-[0.3em] text-sm text-green-300/70 mb-3">90-day proof plan</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Show value fast, then scale without rewriting</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              The rollout blueprint ensures stakeholders see tangible risk reduction and productivity lift every few weeks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {impactMilestones.map((milestone, idx) => (
              <div key={milestone.label} className="relative bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm hover:border-green-500/50 transition-all duration-300 group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-bl-full"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-green-500/20 rounded-lg rotate-12"></div>
                <div className="relative z-10">
                  <div className="text-sm text-green-300 tracking-[0.3em] uppercase mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    {milestone.label}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{milestone.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="relative py-20 px-6 bg-gradient-to-b from-slate-900/50 to-slate-950/50 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h80v80H10z' fill='none' stroke='%233b82f6' stroke-width='1'/%3E%3Ccircle cx='10' cy='10' r='2' fill='%233b82f6'/%3E%3Ccircle cx='90' cy='10' r='2' fill='%233b82f6'/%3E%3Ccircle cx='90' cy='90' r='2' fill='%233b82f6'/%3E%3Ccircle cx='10' cy='90' r='2' fill='%233b82f6'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}></div>
        <div className="absolute top-40 left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Enterprise-Grade Security
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Your data security is our top priority. SynergyOS implements industry-leading security measures to protect your business.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "🔐", title: "Multi-Factor Authentication", desc: "Add an extra layer of security with TOTP-based 2FA" },
                  { icon: "👮", title: "Role-Based Access Control", desc: "Granular permissions for team members and resources" },
                  { icon: "🔍", title: "Audit Logs", desc: "Complete activity tracking and security event monitoring" },
                  { icon: "🛡️", title: "Data Encryption", desc: "End-to-end encryption for all sensitive information" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <span className="text-green-400">✓ MFA Enabled</span>
                    <span className="text-green-400 font-semibold">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <span className="text-blue-400">✓ OAuth Connected</span>
                    <span className="text-blue-400 font-semibold">Verified</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <span className="text-purple-400">✓ Audit Logs</span>
                    <span className="text-purple-400 font-semibold">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <span className="text-yellow-400">✓ Encryption</span>
                    <span className="text-yellow-400 font-semibold">AES-256</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of teams already using SynergyOS to streamline their workflow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-semibold text-lg transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">SynergyOS</h3>
              <p className="text-gray-400 text-sm">
                AI-powered platform for modern business management
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
                <li><Link to="/projects" className="hover:text-white transition-colors">Projects</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 SynergyOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
