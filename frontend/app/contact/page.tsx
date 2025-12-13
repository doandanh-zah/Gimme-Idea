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
  FileText
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
  { value: 'general', label: 'General Inquiry' },
  { value: 'partnership', label: 'Partnership / Collaboration' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'press', label: 'Press / Media' },
  { value: 'investment', label: 'Investment Inquiry' },
  { value: 'other', label: 'Other' }
];

export default function ContactPage() {
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; duration: string; opacity: number }[]>([]);
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

  // Generate stars on mount
  useEffect(() => {
    const newStars = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: `${Math.random() * 3 + 2}s`,
      opacity: Math.random()
    }));
    setStars(newStars);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(`[${formData.inquiryType.toUpperCase()}] ${formData.subject || 'Contact Form Submission'}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Company: ${formData.company || 'N/A'}\n` +
        `Inquiry Type: ${INQUIRY_TYPES.find(t => t.value === formData.inquiryType)?.label}\n\n` +
        `Message:\n${formData.message}`
      );
      
      // Open email client
      window.location.href = `mailto:${CONTACT_INFO.email}?subject=${subject}&body=${body}`;
      
      // Show success state
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
    setFormData({
      name: '',
      email: '',
      company: '',
      inquiryType: 'general',
      subject: '',
      message: ''
    });
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen text-gray-300 pt-28 pb-10 px-4 font-sans relative">
      {/* Background with Stars & Grid */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="bg-grid opacity-40"></div>
        
        {/* Deep Purple Orb - Top Left */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#2e1065] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" />
      
        {/* Dark Gold/Bronze Orb - Bottom Right */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#422006] rounded-full blur-[120px] animate-pulse-slow opacity-40 mix-blend-screen" style={{animationDelay: '2s'}} />

        <div className="stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                '--duration': star.duration,
                '--opacity': star.opacity
              } as React.CSSProperties}
            />
          ))}
          <div className="shooting-star" style={{ top: '20%', left: '80%' }} />
          <div className="shooting-star" style={{ top: '60%', left: '10%', animationDelay: '2s' }} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-quantico">
            Get in Touch
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have a question, partnership proposal, or just want to say hi? 
            We'd love to hear from you. Our team typically responds within 24-48 hours.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* Email Card */}
            <a 
              href={`mailto:${CONTACT_INFO.email}`}
              className="block bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#FFD700]/50 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFD700]/10 flex items-center justify-center group-hover:bg-[#FFD700]/20 transition-colors">
                  <Mail className="w-6 h-6 text-[#FFD700]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Email Us</h3>
                  <p className="text-gray-400 text-sm">{CONTACT_INFO.email}</p>
                </div>
              </div>
            </a>

            {/* Twitter Card */}
            <a 
              href={CONTACT_INFO.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/5 border border-white/10 rounded-xl p-5 hover:border-blue-500/50 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Twitter className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Twitter / X</h3>
                  <p className="text-gray-400 text-sm">{CONTACT_INFO.twitter}</p>
                </div>
              </div>
            </a>

            {/* Telegram Card */}
            <a 
              href={CONTACT_INFO.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/5 border border-white/10 rounded-xl p-5 hover:border-cyan-500/50 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                  <MessageCircle className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Telegram</h3>
                  <p className="text-gray-400 text-sm">Join our community</p>
                </div>
              </div>
            </a>

            {/* Info Cards */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-gray-400 text-sm">Location</p>
                  <p className="text-white">{CONTACT_INFO.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm">Response Time</p>
                  <p className="text-white">{CONTACT_INFO.responseTime}</p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-[#FFD700]/10 to-purple-500/10 border border-[#FFD700]/20 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/docs" className="block text-gray-400 hover:text-[#FFD700] transition-colors text-sm">
                  → Documentation
                </Link>
                <Link href="/hackathons" className="block text-gray-400 hover:text-[#FFD700] transition-colors text-sm">
                  → Hackathons
                </Link>
                <Link href="/donate" className="block text-gray-400 hover:text-[#FFD700] transition-colors text-sm">
                  → Support Us
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              {isSubmitted ? (
                // Success State
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Message Ready!</h2>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Your email client should have opened with your message. 
                    If not, you can email us directly at <span className="text-[#FFD700]">{CONTACT_INFO.email}</span>
                  </p>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                // Form
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your name"
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:outline-none transition-colors"
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
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your@email.com"
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:outline-none transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Company */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Company / Organization
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Optional"
                          className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Inquiry Type */}
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Inquiry Type
                      </label>
                      <select
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFD700]/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                      >
                        {INQUIRY_TYPES.map(type => (
                          <option key={type.value} value={type.value} className="bg-[#1a1a1a]">
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Subject
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Brief subject of your message"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:outline-none transition-colors"
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
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#FFD700]/50 focus:outline-none transition-colors resize-none"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

                  <p className="text-center text-gray-500 text-sm">
                    By submitting, you agree to our{' '}
                    <Link href="/privacy" className="text-[#FFD700] hover:underline">Privacy Policy</Link>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">How can I sponsor a hackathon?</h3>
              <p className="text-gray-400 text-sm">
                Fill out the contact form with "Sponsorship" as the inquiry type, or reach out to us directly via email. We'd love to discuss partnership opportunities!
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">I found a bug. How do I report it?</h3>
              <p className="text-gray-400 text-sm">
                Select "Bug Report" from the inquiry type dropdown and provide as much detail as possible including steps to reproduce the issue.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">Can I collaborate with Gimme Idea?</h3>
              <p className="text-gray-400 text-sm">
                Absolutely! We're always looking for partners. Choose "Partnership / Collaboration" and tell us about your ideas.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">How do I get technical support?</h3>
              <p className="text-gray-400 text-sm">
                For technical questions, check our{' '}
                <Link href="/docs" className="text-[#FFD700] hover:underline">Documentation</Link> first. 
                If you still need help, reach out via the contact form.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
