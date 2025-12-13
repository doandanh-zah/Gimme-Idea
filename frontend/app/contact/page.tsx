'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, MessageCircle, Twitter, MapPin, Clock, CheckCircle, Loader2, User, Building2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CONTACT_INFO = {
  email: 'gimmeidea.contact@gmail.com',
  telegram: 'https://t.me/+s7KW91Nf4G1iZWVl',
  twitter: '@gimme_idea',
  twitterUrl: 'https://twitter.com/gimme_idea',
  location: 'Remote - Global',
  responseTime: '24-48 hours'
};

const INQUIRY_TYPES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'press', label: 'Press / Media' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' }
];

export default function ContactPage() {
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);
  const [formData, setFormData] = useState({ name: '', email: '', company: '', inquiryType: 'general', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: String(Math.random() * 100) + '%',
      left: String(Math.random() * 100) + '%',
      size: Math.random() * 2 + 1,
      duration: String(Math.random() * 3 + 2) + 's',
      opacity: Math.random()
    }));
    setStars(newStars);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubmitting(true);
    try {
      const subjectText = '[' + formData.inquiryType.toUpperCase() + '] ' + (formData.subject || 'Contact Form');
      const inquiryLabel = INQUIRY_TYPES.find(t => t.value === formData.inquiryType)?.label || '';
      const bodyText = 'Name: ' + formData.name + '\nEmail: ' + formData.email + '\nCompany: ' + (formData.company || 'N/A') + '\nType: ' + inquiryLabel + '\n\nMessage:\n' + formData.message;
      window.location.href = 'mailto:' + CONTACT_INFO.email + '?subject=' + encodeURIComponent(subjectText) + '&body=' + encodeURIComponent(bodyText);
      setTimeout(() => { setIsSubmitting(false); setIsSubmitted(true); toast.success('Opening your email client...'); }, 500);
    } catch { setIsSubmitting(false); toast.error('Something went wrong.'); }
  };

  const resetForm = () => { setFormData({ name: '', email: '', company: '', inquiryType: 'general', subject: '', message: '' }); setIsSubmitted(false); };

  return (
    <div className="min-h-screen text-gray-300 pt-20 pb-6 px-4 font-sans relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="bg-grid opacity-40"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#2e1065] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#422006] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" style={{animationDelay: '2s'}} />
        <div className="stars-container">
          {stars.map((star) => (
            <div key={star.id} className="star" style={{ top: star.top, left: star.left, width: star.size + 'px', height: star.size + 'px', '--duration': star.duration, '--opacity': star.opacity } as React.CSSProperties} />
          ))}
        </div>
      </div>
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 font-quantico">Get in Touch</h1>
          <p className="text-gray-400 text-sm">We would love to hear from you. Our team responds within 24-48 hours.</p>
        </motion.div>
        <div className="grid lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-3">
            <a href={'mailto:' + CONTACT_INFO.email} className="block bg-white/5 border border-white/10 rounded-xl p-3 hover:border-[#FFD700]/50 hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-[#FFD700]/10 flex items-center justify-center group-hover:bg-[#FFD700]/20 transition-colors"><Mail className="w-4 h-4 text-[#FFD700]" /></div><div><h3 className="text-white font-medium text-sm">Email Us</h3><p className="text-gray-400 text-xs">{CONTACT_INFO.email}</p></div></div>
            </a>
            <a href={CONTACT_INFO.twitterUrl} target="_blank" rel="noopener noreferrer" className="block bg-white/5 border border-white/10 rounded-xl p-3 hover:border-blue-500/50 hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors"><Twitter className="w-4 h-4 text-blue-400" /></div><div><h3 className="text-white font-medium text-sm">Twitter / X</h3><p className="text-gray-400 text-xs">{CONTACT_INFO.twitter}</p></div></div>
            </a>
            <a href={CONTACT_INFO.telegram} target="_blank" rel="noopener noreferrer" className="block bg-white/5 border border-white/10 rounded-xl p-3 hover:border-cyan-500/50 hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors"><MessageCircle className="w-4 h-4 text-cyan-400" /></div><div><h3 className="text-white font-medium text-sm">Telegram</h3><p className="text-gray-400 text-xs">Join our community</p></div></div>
            </a>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-purple-400" /><div className="flex-1"><p className="text-gray-500 text-xs">Location</p><p className="text-white text-sm">{CONTACT_INFO.location}</p></div></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-green-400" /><div className="flex-1"><p className="text-gray-500 text-xs">Response Time</p><p className="text-white text-sm">{CONTACT_INFO.responseTime}</p></div></div>
            </div>
            <div className="bg-gradient-to-br from-[#FFD700]/10 to-purple-500/10 border border-[#FFD700]/20 rounded-xl p-3">
              <h3 className="text-white font-medium text-sm mb-2">Quick Links</h3>
              <div className="space-y-1"><Link href="/docs" className="block text-gray-400 hover:text-[#FFD700] transition-colors text-xs">→ Documentation</Link><Link href="/hackathons" className="block text-gray-400 hover:text-[#FFD700] transition-colors text-xs">→ Hackathons</Link><Link href="/donate" className="block text-gray-400 hover:text-[#FFD700] transition-colors text-xs">→ Support Us</Link></div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              {isSubmitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3"><CheckCircle className="w-7 h-7 text-green-400" /></div>
                  <h2 className="text-lg font-bold text-white mb-2">Message Ready!</h2>
                  <p className="text-gray-400 mb-4 text-sm">Your email client should have opened. If not, email us at <span className="text-[#FFD700]">{CONTACT_INFO.email}</span></p>
                  <button onClick={resetForm} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm">Send Another</button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div><label className="block text-gray-300 text-xs mb-1">Name <span className="text-red-400">*</span></label><div className="relative"><User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" /><input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your name" className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:outline-none transition-colors text-sm" required /></div></div>
                    <div><label className="block text-gray-300 text-xs mb-1">Email <span className="text-red-400">*</span></label><div className="relative"><Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" /><input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="your@email.com" className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:outline-none transition-colors text-sm" required /></div></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div><label className="block text-gray-300 text-xs mb-1">Company</label><div className="relative"><Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" /><input type="text" name="company" value={formData.company} onChange={handleInputChange} placeholder="Optional" className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:outline-none transition-colors text-sm" /></div></div>
                    <div><label className="block text-gray-300 text-xs mb-1">Inquiry Type</label><select name="inquiryType" value={formData.inquiryType} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#FFD700]/50 focus:outline-none transition-colors text-sm appearance-none cursor-pointer">{INQUIRY_TYPES.map(type => (<option key={type.value} value={type.value} className="bg-[#1a1a1a]">{type.label}</option>))}</select></div>
                  </div>
                  <div><label className="block text-gray-300 text-xs mb-1">Subject</label><div className="relative"><FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" /><input type="text" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Brief subject" className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:outline-none transition-colors text-sm" /></div></div>
                  <div><label className="block text-gray-300 text-xs mb-1">Message <span className="text-red-400">*</span></label><textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Tell us more..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:outline-none transition-colors resize-none text-sm" required /></div>
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <p className="text-gray-500 text-xs">By submitting, you agree to our <Link href="/privacy" className="text-[#FFD700] hover:underline">Privacy Policy</Link></p>
                    <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-bold px-5 py-2 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{isSubmitting ? 'Preparing...' : 'Send'}</button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
