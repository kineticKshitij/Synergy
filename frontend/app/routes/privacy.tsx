import { Link } from 'react-router';
import { ArrowLeft, Shield, Lock, Eye, Database, FileText } from 'lucide-react';
import type { Route } from './+types/privacy';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Privacy Policy - SynergyOS' },
        { name: 'description', content: 'Privacy Policy for SynergyOS' },
    ];
}

export default function Privacy() {
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
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
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
                                At SynergyOS, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and 
                                safeguard your information when you use our intelligent business management platform. By using SynergyOS, you 
                                agree to the collection and use of information in accordance with this policy.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Database className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">2. Information We Collect</h2>
                            </div>
                            <div className="space-y-4 text-blue-100 leading-relaxed">
                                <div>
                                    <p><strong className="text-white">2.1 Personal Information:</strong></p>
                                    <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                                        <li>Name, email address, and username</li>
                                        <li>Profile information and preferences</li>
                                        <li>Contact information (phone number, if provided)</li>
                                        <li>Company and organizational details</li>
                                    </ul>
                                </div>
                                <div>
                                    <p><strong className="text-white">2.2 Usage Information:</strong></p>
                                    <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                                        <li>Log data (IP address, browser type, pages visited)</li>
                                        <li>Device information (operating system, device identifiers)</li>
                                        <li>Usage patterns and preferences</li>
                                        <li>Feature interaction data</li>
                                    </ul>
                                </div>
                                <div>
                                    <p><strong className="text-white">2.3 Project and Task Data:</strong></p>
                                    <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                                        <li>Projects, tasks, and milestone information</li>
                                        <li>Team collaboration data</li>
                                        <li>File uploads and attachments</li>
                                        <li>Comments and communications within the platform</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* How We Use Your Information */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Eye className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">3. How We Use Your Information</h2>
                            </div>
                            <div className="space-y-3 text-blue-100 leading-relaxed">
                                <p>We use the collected information for the following purposes:</p>
                                <ul className="list-disc list-inside ml-4 space-y-2">
                                    <li><strong className="text-white">Service Delivery:</strong> To provide, maintain, and improve our platform</li>
                                    <li><strong className="text-white">AI Features:</strong> To power AI-driven task generation, risk analysis, and intelligent suggestions</li>
                                    <li><strong className="text-white">Personalization:</strong> To customize your experience and provide relevant recommendations</li>
                                    <li><strong className="text-white">Communication:</strong> To send you updates, notifications, and support messages</li>
                                    <li><strong className="text-white">Security:</strong> To detect, prevent, and address technical issues and security threats</li>
                                    <li><strong className="text-white">Analytics:</strong> To analyze usage patterns and improve our services</li>
                                    <li><strong className="text-white">Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
                                </ul>
                            </div>
                        </section>

                        {/* AI and Data Processing */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Database className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">4. AI and Data Processing</h2>
                            </div>
                            <div className="space-y-3 text-blue-100 leading-relaxed">
                                <p><strong className="text-white">4.1 AI Processing:</strong> SynergyOS uses artificial intelligence (powered by Google Gemini) 
                                to provide intelligent features. Your project and task data may be processed by AI systems to generate insights, suggestions, 
                                and automated task breakdowns.</p>
                                <p><strong className="text-white">4.2 Data Security:</strong> We implement industry-standard security measures to protect 
                                data during AI processing. Your data is encrypted in transit and at rest.</p>
                                <p><strong className="text-white">4.3 Third-Party AI:</strong> When using AI features, your data may be processed by our 
                                AI service providers (Google Gemini) in accordance with their privacy policies and our data processing agreements.</p>
                            </div>
                        </section>

                        {/* Data Sharing */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">5. Data Sharing and Disclosure</h2>
                            </div>
                            <div className="space-y-3 text-blue-100 leading-relaxed">
                                <p>We may share your information in the following circumstances:</p>
                                <ul className="list-disc list-inside ml-4 space-y-2">
                                    <li><strong className="text-white">Team Members:</strong> Within your organization for collaboration purposes</li>
                                    <li><strong className="text-white">Service Providers:</strong> With trusted third-party service providers (hosting, AI services)</li>
                                    <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect our rights</li>
                                    <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                                    <li><strong className="text-white">With Your Consent:</strong> When you explicitly authorize us to share your information</li>
                                </ul>
                                <p className="mt-4 text-white font-semibold">We do NOT sell your personal information to third parties.</p>
                            </div>
                        </section>

                        {/* Data Security */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">6. Data Security</h2>
                            </div>
                            <div className="space-y-3 text-blue-100 leading-relaxed">
                                <p>We implement comprehensive security measures to protect your information:</p>
                                <ul className="list-disc list-inside ml-4 space-y-2">
                                    <li>End-to-end encryption for data transmission</li>
                                    <li>Encrypted data storage</li>
                                    <li>Multi-factor authentication (2FA) support</li>
                                    <li>Regular security audits and updates</li>
                                    <li>Access controls and authentication systems</li>
                                    <li>Secure backup and disaster recovery procedures</li>
                                </ul>
                            </div>
                        </section>

                        {/* Data Retention */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Database className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">7. Data Retention</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this 
                                Privacy Policy. When you delete your account, we will delete or anonymize your personal information within 30 days, 
                                except where we are required to retain it for legal or regulatory purposes.
                            </p>
                        </section>

                        {/* Your Rights */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">8. Your Rights</h2>
                            </div>
                            <div className="space-y-3 text-blue-100 leading-relaxed">
                                <p>You have the following rights regarding your personal information:</p>
                                <ul className="list-disc list-inside ml-4 space-y-2">
                                    <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
                                    <li><strong className="text-white">Correction:</strong> Update or correct inaccurate information</li>
                                    <li><strong className="text-white">Deletion:</strong> Request deletion of your personal data</li>
                                    <li><strong className="text-white">Portability:</strong> Request data in a portable format</li>
                                    <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing communications</li>
                                    <li><strong className="text-white">Object:</strong> Object to certain types of data processing</li>
                                </ul>
                                <p className="mt-4">To exercise these rights, please contact us at privacy@synergyos.com</p>
                            </div>
                        </section>

                        {/* Cookies */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">9. Cookies and Tracking</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                We use cookies and similar tracking technologies to track activity on our Service and hold certain information. 
                                Cookies are files with a small amount of data that are sent to your browser from a website and stored on your device. 
                                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                            </p>
                        </section>

                        {/* Children's Privacy */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">10. Children's Privacy</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information 
                                from children under 18. If you become aware that a child has provided us with personal information, please contact us 
                                immediately.
                            </p>
                        </section>

                        {/* International Data Transfers */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Database className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">11. International Data Transfers</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                Your information may be transferred to and maintained on computers located outside of your jurisdiction where data 
                                protection laws may differ. We ensure that appropriate safeguards are in place to protect your information in compliance 
                                with this Privacy Policy and applicable laws.
                            </p>
                        </section>

                        {/* Changes to Privacy Policy */}
                        <section className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">12. Changes to This Privacy Policy</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
                                on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="mb-0">
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="w-6 h-6 text-blue-300" />
                                <h2 className="text-2xl font-bold text-white m-0">13. Contact Us</h2>
                            </div>
                            <p className="text-blue-100 leading-relaxed">
                                If you have any questions about this Privacy Policy or our data practices, please contact us:
                            </p>
                            <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20">
                                <p className="text-white font-semibold mb-2">SynergyOS Privacy Team</p>
                                <p className="text-blue-200">Email: privacy@synergyos.com</p>
                                <p className="text-blue-200">Data Protection Officer: dpo@synergyos.com</p>
                                <p className="text-blue-200">Support: support@synergyos.com</p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Security Badge */}
                <div className="mt-8 text-center animate-fadeIn">
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                        <Lock className="w-4 h-4 text-blue-300" />
                        <p className="text-sm text-blue-100 font-medium">
                            Your privacy is protected with enterprise-grade security
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
