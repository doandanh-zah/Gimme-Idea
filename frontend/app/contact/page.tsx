'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Send, 
  MessageCircle, 
  Twitter, 
  MapPin, 
  Clock, 
  CheckCircle,
  Loader2,
  User,
  Building2,
  FileText,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Contact info
const CONTACT_INFO = {
  email: 'gimmeidea.contact@gmail.com',
  telegram: 'https://t.me/+s7KW91Nf4G1iZWVl',
  twitter: '@gimme_idea',
  twitterUrl: 'https://twitter.com/gimme_idea',
  location: 'Remote - Global',
  responseTime: '24-48 hours'
};

// Inquiry types
const INQUIRY_TYPES = [
  { value: 'general', label: 'General Inquiry', icon: '💬' },
  { value: 'partnership', label: 'Partnership', icon: '🤝' },
  { value: 'sponsorship', label: 'Sponsorship', icon: '⭐' },
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'feature', label: 'Feature Request', icon: '💡' },
  { value: 'press', label: 'Press / Media', icon: '📰' },
  { value: 'investment', label: 'Investment', icon: '💰' },
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
    <div className="min-h-screen text-gray-300 pt-28 pb-12 px-4 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFD700]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#FFD700]" />
            <span className="text-[#FFD700] text-sm font-medium">We're here to help</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-quantico">
            Let's <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-amber-500">Connect</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have a question, feedback, or want to collaborate? We'd love to hear from you.
          </p>
        </motion.div>

        {/* Quick Contact Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-4 mb-12"
        >
          {/* Email */}
          <a 
            href={`mailto:${CONTACT_INFO.email}`} 
            className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-[#FFD700]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#FFD700]/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-[#FFD700]" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">Email Us</h3>
              <p className="text-gray-400 text-sm mb-3">Best for detailed inquiries</p>
              <div className="flex items-center gap-2 text-[#FFD700] text-sm font-medium">
                <span>{CONTACT_INFO.email}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>

          {/* Twitter */}
          <a 
            href={CONTACT_INFO.twitterUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Twitter className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">Twitter / X</h3>
              <p className="text-gray-400 text-sm mb-3">Quick updates & DMs</p>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                <span>{CONTACT_INFO.twitter}</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>

          {/* Telegram */}
          <a 
            href={CONTACT_INFO.telegram} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">Telegram</h3>
              <p className="text-gray-400 text-sm mb-3">Join our community</p>
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                <span>Community Chat</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Form - Takes more space */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3"
          >
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-purple-500/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Send us a message</h2>
                  <p className="text-gray-400 text-sm">We'll get back to you within 24-48 hours</p>
                </div>
              </div>

              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Ready!</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Your email client should have opened. If not, email us directly at{' '}
                    <span className="text-[#FFD700]">{CONTACT_INFO.email}</span>
                  </p>
                  <button 
                    onClick={resetForm} 
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Name */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                          type="text" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleInputChange} 
                          placeholder="John Doe" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/20 focus:outline-none transition-all" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleInputChange} 
                          placeholder="john@example.com" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/20 focus:outline-none transition-all" 
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Company */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Company</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                          type="text" 
                          name="company" 
                          value={formData.company} 
                          onChange={handleInputChange} 
                          placeholder="Optional" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/20 focus:outline-none transition-all" 
                        />
                      </div>
                    </div>

                    {/* Inquiry Type */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Inquiry Type</label>
                      <select 
                        name="inquiryType" 
                        value={formData.inquiryType} 
                        onChange={handleInputChange} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/20 focus:outline-none transition-all appearance-none cursor-pointer"
                      >
                        {INQUIRY_TYPES.map(type => (
                          <option key={type.value} value={type.value} className="bg-[#1a1a1a]">
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Subject</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        name="subject" 
                        value={formData.subject} 
                        onChange={handleInputChange} 
                        placeholder="What's this about?" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/20 focus:outline-none transition-all" 
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea 
                      name="message" 
                      value={formData.message} 
                      onChange={handleInputChange} 
                      placeholder="Tell us what's on your mind..." 
                      rows={5} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/20 focus:outline-none transition-all resize-none" 
                      required 
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <p className="text-gray-500 text-sm">
                      By submitting, you agree to our{' '}
                      <Link href="/privacy" className="text-[#FFD700] hover:underline">Privacy Policy</Link>
                    </p>
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full sm:w-auto bg-gradient-to-r from-[#FFD700] to-amber-500 text-black font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FFD700]/20"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>

          {/* Sidebar Info */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Response Info */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Response Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Location</p>
                    <p className="text-white font-medium">{CONTACT_INFO.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Response Time</p>
                    <p className="text-white font-medium">{CONTACT_INFO.responseTime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-gradient-to-br from-[#FFD700]/10 to-purple-500/5 border border-[#FFD700]/20 rounded-2xl p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Before You Contact</h3>
              <p className="text-gray-400 text-sm mb-4">
                Check out these resources - you might find your answer there!
              </p>
              <div className="space-y-2">
                <Link 
                  href="/docs" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <span className="text-lg">📚</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Documentation</p>
                    <p className="text-gray-500 text-xs">Learn how to use Gimme Idea</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all" />
                </Link>
                <Link 
                  href="/hackathons" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <span className="text-lg">🏆</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Hackathons</p>
                    <p className="text-gray-500 text-xs">Join exciting competitions</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all" />
                </Link>
                <Link 
                  href="/donate" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <span className="text-lg">❤️</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Support Us</p>
                    <p className="text-gray-500 text-xs">Help us grow</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm mb-2">Trusted by</p>
              <p className="text-3xl font-bold text-white mb-1">500+</p>
              <p className="text-gray-400 text-sm">startup founders worldwide</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;