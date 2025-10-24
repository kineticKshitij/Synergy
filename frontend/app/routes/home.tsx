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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Welcome to SynergyOS
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The <span className="text-blue-400 font-semibold">AI-Powered</span> Platform That Transforms How You Manage Projects, Teams, and Security
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
              { icon: "🚀", value: "500+", label: "Active Users" },
              { icon: "📊", value: "10K+", label: "Projects Managed" },
              { icon: "🤖", value: "99.9%", label: "AI Accuracy" },
              { icon: "🔒", value: "100%", label: "Secure" },
            ].map((stat, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center backdrop-blur-sm">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-blue-400 mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
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
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-blue-500/50 transition-all hover:transform hover:scale-105"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
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
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
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

      {/* Security Section */}
      <section id="security" className="py-20 px-6 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
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
