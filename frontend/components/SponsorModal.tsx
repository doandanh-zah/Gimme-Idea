'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, DollarSign, Upload, Send, CheckCircle2, User, Mail, Link as LinkIcon, FileText } from 'lucide-react';

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SponsorModal({ isOpen, onClose }: SponsorModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    // Hackathon Details (Main)
    title: '',
    description: '',
    prizePool: '',
    startDate: '',
    endDate: '',
    tags: '',
    
    // Contact / Meta (Secondary)
    contactName: '',
    contactEmail: '',
    organization: '',
    slug: '', // Auto-generated or manual
    bannerUrl: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to a backend endpoint
    console.log('Submitting Proposal:', formData);
    
    // Simulate loading/success
    setTimeout(() => {
      setStep('success');
    }, 800);
  };

  const handleClose = () => {
    onClose();
    // Reset form after closing animation
    setTimeout(() => {
      setStep('form');
      setFormData({
        title: '', description: '', prizePool: '', startDate: '', endDate: '',
        tags: '', contactName: '', contactEmail: '', organization: '', slug: '', bannerUrl: ''
      });
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#151515]">
              <div>
                <h3 className="text-xl font-bold text-white font-quantico">Apply as Sponsor</h3>
                <p className="text-xs text-gray-500 mt-1">Host your own Hackathon on GimmeIdea</p>
              </div>
              <button 
                onClick={handleClose} 
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {step === 'form' ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* SECTION 1: Hackathon Content */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#FFD700] text-sm font-bold uppercase tracking-wide border-b border-white/5 pb-2">
                       <FileText className="w-4 h-4" /> Hackathon Details
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1.5">Event Title <span className="text-red-500">*</span></label>
                        <input 
                          required
                          type="text" 
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] outline-none transition-all placeholder:text-gray-700"
                          placeholder="e.g. Solana Summer Hackathon 2025"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1.5">Total Prize Pool <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                              required
                              type="text" 
                              name="prizePool"
                              value={formData.prizePool}
                              onChange={handleInputChange}
                              className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-3 text-white focus:border-[#FFD700] outline-none transition-all placeholder:text-gray-700"
                              placeholder="50,000"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1.5">Tags</label>
                          <input 
                            type="text" 
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFD700] outline-none transition-all placeholder:text-gray-700"
                            placeholder="DeFi, NFT, Gaming..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5">Start Date <span className="text-red-500">*</span></label>
                            <input 
                              required
                              type="date" 
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleInputChange}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFD700] outline-none transition-all [color-scheme:dark]"
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5">End Date <span className="text-red-500">*</span></label>
                            <input 
                              required
                              type="date" 
                              name="endDate"
                              value={formData.endDate}
                              onChange={handleInputChange}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFD700] outline-none transition-all [color-scheme:dark]"
                            />
                         </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1.5">Description <span className="text-red-500">*</span></label>
                        <textarea 
                          required
                          rows={4}
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#FFD700] outline-none transition-all placeholder:text-gray-700 resize-none"
                          placeholder="Describe the main goal and theme of the hackathon..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: Admin / Meta Data (Secondary) */}
                  <div className="space-y-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wide border-b border-white/5 pb-2">
                       <User className="w-4 h-4" /> Admin & Contact Info
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Contact Name</label>
                          <input 
                            type="text" 
                            name="contactName"
                            value={formData.contactName}
                            onChange={handleInputChange}
                            className="w-full bg-black/30 border border-white/5 rounded px-3 py-2 text-sm text-gray-300 focus:border-gray-500 outline-none"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Contact Email <span className="text-red-500">*</span></label>
                          <input 
                            required
                            type="email" 
                            name="contactEmail"
                            value={formData.contactEmail}
                            onChange={handleInputChange}
                            className="w-full bg-black/30 border border-white/5 rounded px-3 py-2 text-sm text-gray-300 focus:border-gray-500 outline-none"
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Organization</label>
                          <input 
                            type="text" 
                            name="organization"
                            value={formData.organization}
                            onChange={handleInputChange}
                            className="w-full bg-black/30 border border-white/5 rounded px-3 py-2 text-sm text-gray-300 focus:border-gray-500 outline-none"
                            placeholder="Company / DAO Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Preferred Slug (Optional)</label>
                          <input 
                            type="text" 
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            className="w-full bg-black/30 border border-white/5 rounded px-3 py-2 text-sm text-gray-300 focus:border-gray-500 outline-none font-mono"
                            placeholder="e.g. spring-2025"
                          />
                        </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-2.5 rounded-lg text-sm font-bold text-black bg-[#FFD700] hover:bg-[#FFD700]/90 transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Submit Proposal
                    </button>
                  </div>

                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center h-full min-h-[400px]">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-2"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Proposal Submitted!</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                      Thank you for your interest in hosting a Hackathon with us. 
                      We have received your details and will contact <span className="text-white font-medium">{formData.contactEmail}</span> shortly.
                    </p>
                  </div>

                  <button 
                    onClick={handleClose}
                    className="mt-6 px-8 py-2.5 rounded-lg text-sm font-bold text-white bg-white/10 hover:bg-white/20 transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
