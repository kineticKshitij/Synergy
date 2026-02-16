import { Link } from 'react-router';
import { ArrowLeft, ScrollText, Shield, FileText } from 'lucide-react';
import type { Route } from './+types/terms';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Terms and Conditions - SynergyOS' },
        { name: 'description', content: 'Terms and Conditions for using SynergyOS' },
    ];
}

export default function Terms() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-4 py-12 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-8 animate-slideInDown">
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Registration
                    </Link>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/50">
                            <ScrollText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">Terms and Conditions</h1>
                            <p className="text-blue-200 mt-1">Last updated: February 16, 2026</p>
                        </div>
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20 animate-slideInUp">
                    <div className="prose prose-invert prose-blue max-w-none">
                        {/* Introduction */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">1. Introduction</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                Welcome to SynergyOS. These Terms and Conditions ("Terms") govern your access to and use of the SynergyOS platform, 
                                including our website, applications, and services (collectively, the "Service"). By accessing or using our Service, 
                                you agree to be bound by these Terms.
                            </p>
                        </section>

                        {/* Acceptance */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">2. Acceptance of Terms</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                By creating an account, accessing, or using SynergyOS, you acknowledge that you have read, understood, and agree to be 
                                bound by these Terms. If you do not agree to these Terms, you must not use our Service.
                            </p>
                        </section>

                        {/* User Accounts */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">3. User Accounts</h2>
                            </div>
                            <div className="space-y-3 text-blue-100 leading-relaxed">
                                <p><strong className="text-white">3.1 Account Creation:</strong> You must provide accurate and complete information when creating an account.</p>
                                <p><strong className="text-white">3.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials.</p>
                                <p><strong className="text-white">3.3 Account Responsibility:</strong> You are responsible for all activities that occur under your account.</p>
                                <p><strong className="text-white">3.4 Age Requirement:</strong> You must be at least 18 years old to use our Service.</p>
                            </div>
                        </section>

                        {/* Use of Service */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">4. Use of Service</h2>
                            </div>
                            <div className="space-y-3 text-blue-100 leading-relaxed">
                                <p><strong className="text-white">4.1 Permitted Use:</strong> You may use the Service only for lawful purposes and in accordance with these Terms.</p>
                                <p><strong className="text-white">4.2 Prohibited Activities:</strong> You agree not to:</p>
                                <ul className="list-disc list-inside ml-4 space-y-2">
                                    <li>Use the Service for any illegal purpose</li>
                                    <li>Attempt to gain unauthorized access to any part of the Service</li>
                                    <li>Interfere with or disrupt the Service or servers</li>
                                    <li>Upload viruses, malware, or other malicious code</li>
                                    <li>Harass, abuse, or harm other users</li>
                                    <li>Impersonate any person or entity</li>
                                </ul>
                            </div>
                        </section>

                        {/* Intellectual Property */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">5. Intellectual Property Rights</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                The Service and its original content, features, and functionality are owned by SynergyOS and are protected by 
                                international copyright, trademark, patent, trade secret, and other intellectual property laws.
                            </p>
                        </section>

                        {/* User Content */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">6. User Content</h2>
                            </div>
                            <div className="space-y-3 text-blue-100 leading-relaxed">
                                <p><strong className="text-white">6.1 Ownership:</strong> You retain ownership of all content you submit to the Service.</p>
                                <p><strong className="text-white">6.2 License:</strong> By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, 
                                reproduce, and display your content as necessary to provide the Service.</p>
                                <p><strong className="text-white">6.3 Responsibility:</strong> You are solely responsible for your content and the consequences of posting it.</p>
                            </div>
                        </section>

                        {/* AI Features */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">7. AI-Powered Features</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                SynergyOS uses artificial intelligence to provide enhanced features. While we strive for accuracy, AI-generated 
                                content and suggestions are not guaranteed to be error-free. Users should review and verify all AI-generated content 
                                before relying on it for business decisions.
                            </p>
                        </section>

                        {/* Termination */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">8. Termination</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
                                for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately.
                            </p>
                        </section>

                        {/* Limitation of Liability */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">9. Limitation of Liability</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                To the maximum extent permitted by law, SynergyOS shall not be liable for any indirect, incidental, special, 
                                consequential, or punitive damages resulting from your use or inability to use the Service.
                            </p>
                        </section>

                        {/* Disclaimer */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">10. Disclaimer</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, 
                                including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
                            </p>
                        </section>

                        {/* Changes to Terms */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">11. Changes to Terms</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting 
                                the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such 
                                modifications constitutes acceptance of the updated Terms.
                            </p>
                        </section>

                        {/* Governing Law */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">12. Governing Law</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
                                SynergyOS operates, without regard to its conflict of law provisions.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="mb-0">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">13. Contact Us</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                If you have any questions about these Terms, please contact us at:
                            </p>
                            <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20">
                                <p className="text-white font-semibold mb-2">SynergyOS Support</p>
                                <p className="text-blue-200">Email: legal@synergyos.com</p>
                                <p className="text-blue-200">Support: support@synergyos.com</p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Security Badge */}
                <div className="mt-8 text-center animate-fadeIn">
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                        <Shield className="w-4 h-4 text-blue-300" />
                        <p className="text-sm text-blue-100 font-medium">
                            Your rights are protected under these terms
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
