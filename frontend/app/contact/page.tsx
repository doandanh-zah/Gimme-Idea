'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Send, 
  MessageCircle, 
  Twitter, 
  CheckCircle,
  Loader2,
  User,
  Building2,
  FileText,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Zap,
  Globe,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Contact info
const CONTACT_INFO = {
  email: 'gimmeidea.contact@gmail.com',
  telegram: 'https://t.me/+s7KW91Nf4G1iZWVl',
  twitter: '@gimme_idea',
  twitterUrl: 'https://twitter.com/gimme_idea',
};

// Inquiry types - simplified
const INQUIRY_TYPES = [
  { value: 'general', label: 'General', icon: '💬' },
  { value: 'partnership', label: 'Partnership', icon: '🤝' },
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'feature', label: 'Feature Request', icon: '💡' },
  { value: 'other', label: 'Other', icon: '📝' }
];

function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    inquiryType: 'general',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const subject = encodeURIComponent(`[${formData.inquiryType.toUpperCase()}] ${formData.subject || 'Contact Form'}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company || 'N/A'}\nType: ${INQUIRY_TYPES.find(t => t.value === formData.inquiryType)?.label}\n\nMessage:\n${formData.message}`
      );
      
      window.location.href = `mailto:${CONTACT_INFO.email}?subject=${subject}&body=${body}`;
      
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        toast.success('Opening your email client...');
      }, 500);

    } catch (error) {
      setIsSubmitting(false);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', company: '', inquiryType: 'general', subject: '', message: '' });
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen text-gray-300 pt-24 pb-16 px-4 font-sans relative overflow-hidden">
      {/* Background - Cleaner */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#FFD700]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Container with Golden Ratio max-width */}
      <div className="max-w-5xl mx-auto">
        
        {/* Hero Section - Golden Ratio spacing */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span className="text-[#FFD700] text-xs font-medium tracking-wide">GET IN TOUCH</span>
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 font-quantico tracking-tight">
            Let's Build Something{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-amber-400 to-[#FFD700]">
              Amazing
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Have questions or want to collaborate? We'd love to hear from you.
          </p>
        </motion.div>

        {/* Quick Contact - Horizontal Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          <a 
            href={`mailto:${CONTACT_INFO.email}`}
            className="group flex items-center gap-3 px-5 py-3 bg-white/[0.03] border border-white/10 rounded-full hover:border-[#FFD700]/40 hover:bg-[#FFD700]/5 transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-full bg-[#FFD700]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-4 h-4 text-[#FFD700]" />
            </div>
            <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
              {CONTACT_INFO.email}
            </span>
          </a>
          
          <a 
            href={CONTACT_INFO.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-5 py-3 bg-white/[0.03] border border-white/10 rounded-full hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Twitter className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
              {CONTACT_INFO.twitter}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
          </a>
          
          <a 
            href={CONTACT_INFO.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-5 py-3 bg-white/[0.03] border border-white/10 rounded-full hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
              Telegram
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
          </a>
        </motion.div>

        {/* Main Grid - Golden Ratio (61.8% : 38.2%) */}
        <div className="grid lg:grid-cols-[1fr_0.618fr] gap-8 items-start">
          
          {/* Contact Form - Larger section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              {/* Form Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-amber-500/5 flex items-center justify-center">
                  <Send className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Send a Message</h2>
                  <p className="text-gray-500 text-sm">We respond within 24-48 hours</p>
                </div>
              </div>

              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/5 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Send!</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                    Your email client should open. If not, email us at{' '}
                    <span className="text-[#FFD700]">{CONTACT_INFO.email}</span>
                  </p>
                  <button 
                    onClick={resetForm} 
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors font-medium"
                  >
                    New Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Row 1: Name & Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                        Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input 
                          type="text" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleInputChange} 
                          placeholder="Your name" 
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:border-[#FFD700]/50 focus:bg-white/[0.05] focus:outline-none transition-all" 
                          required 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleInputChange} 
                          placeholder="you@example.com" 
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:border-[#FFD700]/50 focus:bg-white/[0.05] focus:outline-none transition-all" 
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Company & Type */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                        Company <span className="text-gray-600">(optional)</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input 
                          type="text" 
                          name="company" 
                          value={formData.company} 
                          onChange={handleInputChange} 
                          placeholder="Your company" 
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:border-[#FFD700]/50 focus:bg-white/[0.05] focus:outline-none transition-all" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                        Type
                      </label>
                      <select 
                        name="inquiryType" 
                        value={formData.inquiryType} 
                        onChange={handleInputChange} 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#FFD700]/50 focus:bg-white/[0.05] focus:outline-none transition-all appearance-none cursor-pointer"
                      >
                        {INQUIRY_TYPES.map(type => (
                          <option key={type.value} value={type.value} className="bg-[#151515]">
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                      Subject
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input 
                        type="text" 
                        name="subject" 
                        value={formData.subject} 
                        onChange={handleInputChange} 
                        placeholder="What's this about?" 
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:border-[#FFD700]/50 focus:bg-white/[0.05] focus:outline-none transition-all" 
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea 
                      name="message" 
                      value={formData.message} 
                      onChange={handleInputChange} 
                      placeholder="Tell us what's on your mind..." 
                      rows={4} 
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-[#FFD700]/50 focus:bg-white/[0.05] focus:outline-none transition-all resize-none" 
                      required 
                    />
                  </div>

                  {/* Submit Row */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-gray-600 text-xs hidden sm:block">
                      By submitting, you agree to our{' '}
                      <Link href="/privacy" className="text-gray-400 hover:text-[#FFD700] transition-colors">Privacy Policy</Link>
                    </p>
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full sm:w-auto bg-gradient-to-r from-[#FFD700] to-amber-500 text-black font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          Send Message
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>

          {/* Sidebar - Smaller section (Golden Ratio) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-5"
          >
            {/* Quick Links */}
            <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFD700]" />
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link 
                  href="/docs" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all group"
                >
                  <span className="text-base">📚</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Documentation</p>
                    <p className="text-gray-600 text-xs truncate">Learn how to use Gimme Idea</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#FFD700] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
                <Link 
                  href="/idea" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all group"
                >
                  <span className="text-base">🧭</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">GTM Assistant</p>
                    <p className="text-gray-600 text-xs truncate">Validate & go-to-market faster</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#FFD700] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
                <Link 
                  href="/donate" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all group"
                >
                  <span className="text-base">❤️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">Support Us</p>
                    <p className="text-gray-600 text-xs truncate">Help us grow</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#FFD700] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-[#FFD700]/[0.08] to-purple-500/[0.03] border border-[#FFD700]/20 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">500+</p>
                  <p className="text-gray-400 text-xs">Founders trust us</p>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Fast Response</p>
                  <p className="text-gray-500 text-xs">Usually within 24-48 hours</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;