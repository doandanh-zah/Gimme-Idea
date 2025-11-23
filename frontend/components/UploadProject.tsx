
'use client';

import React, { useState, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { Upload, Rocket, CheckCircle2, X, Image as ImageIcon, Tag, Zap, Box, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Project } from '../lib/types';
import { LoadingLightbulb, LoadingStatus } from './LoadingLightbulb';

export const UploadProject = () => {
  const { addProject, user, openWalletModal } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<LoadingStatus>('loading');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'DeFi',
    stage: 'Idea',
    website: '',
    bounty: ''
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = [
    'DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'DePIN', 'Social', 'Mobile', 'Security'
  ];

  const stages = ['Idea', 'Prototype', 'Devnet', 'Mainnet'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const newTag = tagInput.trim();
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
            setTagInput('');
        }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Check Wallet Connection
    if (!user) {
        toast.error('Connect wallet to launch project!');
        openWalletModal();
        return;
    }

    // 2. Validate Inputs (Manual check instead of native 'required' for better UX)
    if (!formData.title.trim()) {
        toast.error('Please enter a project name');
        return;
    }

    if (!formData.description.trim()) {
        toast.error('Please describe your project');
        return;
    }
    
    setIsSubmitting(true);
    setStatus('loading');
    
    // Simulate Network Request + AI Analysis time
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Show Success State
    setStatus('success');
    
    const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'project',
        title: formData.title,
        description: formData.description,
        category: formData.category as any,
        stage: formData.stage as any,
        votes: 0,
        feedbackCount: 0,
        tags: tags.length > 0 ? tags : ['New', 'Solana'],
        website: formData.website,
        image: imagePreview || undefined,
        bounty: formData.bounty ? Number(formData.bounty) : undefined,
        author: {
            username: user.username,
            wallet: user.wallet,
            avatar: user.avatar
        },
        createdAt: new Date().toISOString(),
        comments: []
    };

    // Delay actual addition to let user see the celebration
    setTimeout(() => {
        addProject(newProject);
        toast.success('Project live on network!');
        setIsSubmitting(false);
    }, 3500);
  };

  return (
    <div className="min-h-screen relative pt-32 pb-20 px-6">
      
      {/* Dynamic Background for Upload Page - BRIGHTER & CLEANER */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
         {/* Lighter deep background */}
         <div className="absolute inset-0 bg-gradient-to-br from-[#121420] via-[#0f111a] to-[#050508]" />
         
         {/* Top Right Green Glow (Success/Launch theme) - Brighter */}
         <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#14F195]/15 rounded-full blur-[100px] mix-blend-screen" />
         
         {/* Bottom Left Purple Glow - Brighter */}
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#9945FF]/15 rounded-full blur-[120px] mix-blend-screen" />
         
         {/* Digital Rain / Grid Effect - Reduced opacity for cleaner look */}
         <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,241,149,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,241,149,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)] opacity-30" />
      </div>

      {/* Full Screen Loading/Success Overlay */}
      <AnimatePresence>
      {isSubmitting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050508]/95 backdrop-blur-xl"
        >
          {status === 'success' ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent animate-pulse" />
                
                {/* Scanning Grid Background */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#14F195_1px,transparent_1px),linear-gradient(to_bottom,#14F195_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

                <motion.div 
                   initial={{ scale: 0.5, opacity: 0, y: 50 }}
                   animate={{ scale: 1, opacity: 1, y: 0 }}
                   transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
                   className="relative z-10 bg-black/40 border border-white/10 p-1 rounded-3xl backdrop-blur-2xl shadow-[0_0_100px_rgba(20,241,149,0.2)]"
                >
                   {/* Main Card Content */}
                   <div className="bg-[#0A0A0A] rounded-[20px] p-12 text-center relative overflow-hidden w-[90vw] max-w-md">
                       
                       {/* Shimmer Effect */}
                       <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-20 pointer-events-none" />

                       {/* Success Icon Construction */}
                       <div className="relative w-24 h-24 mx-auto mb-8">
                           <motion.div 
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="absolute inset-0 bg-green-500 rounded-2xl rotate-3"
                           />
                           <motion.div 
                              initial={{ scale: 0, rotate: 180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.5, delay: 0.3 }}
                              className="absolute inset-0 bg-[#0A0A0A] border-2 border-green-400 rounded-2xl flex items-center justify-center z-10"
                           >
                              <Rocket className="w-10 h-10 text-green-400" />
                           </motion.div>
                           
                           {/* Orbiting Particles */}
                           {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute inset-0 border border-green-500/30 rounded-full"
                                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: "linear" }}
                              />
                           ))}
                       </div>

                       <motion.h2 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="text-3xl font-display font-bold text-white mb-2"
                       >
                          DEPLOYED
                       </motion.h2>
                       
                       <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                          className="flex items-center justify-center gap-2 text-green-400 font-mono text-sm mb-6 bg-green-900/20 py-1 px-3 rounded-full mx-auto w-fit border border-green-500/20"
                       >
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          On-Chain: Success
                       </motion.div>

                       <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.9 }}
                          className="text-gray-400"
                       >
                          <span className="text-white font-bold">{formData.title}</span> is now live for community review.
                       </motion.p>
                   </div>

                   {/* Decorative Corner Accents */}
                   <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-green-500 rounded-tl-lg" />
                   <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-green-500 rounded-br-lg" />
                </motion.div>

                 {/* Floating Elements for Depth */}
                 {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute text-green-500/20 font-mono text-xs pointer-events-none"
                      initial={{ 
                        x: Math.random() * window.innerWidth, 
                        y: window.innerHeight + 100,
                        opacity: 0
                      }}
                      animate={{ 
                        y: -100,
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: Math.random() * 5 + 3,
                        repeat: Infinity,
                        delay: Math.random() * 2
                      }}
                    >
                      {Math.random() > 0.5 ? "01" : "TX"}
                    </motion.div>
                 ))}
            </div>
          ) : (
            <LoadingLightbulb 
                text="Minting Idea on Solana..." 
                status={status}
            />
          )}
        </motion.div>
      )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto relative z-10"
      >
        <div className="text-center mb-10">
            <h1 className="text-4xl font-display font-bold mb-3 tracking-tight">Submit your <span className="text-[#14F195] drop-shadow-[0_0_10px_rgba(20,241,149,0.5)]">Build</span></h1>
            <p className="text-gray-300 text-lg">Get validated by the best builders on Solana.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-[#0F0F1A]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
            {/* Subtle Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#FFD700] opacity-50 group-hover:opacity-100 transition-opacity" />

            {/* Project Name */}
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Project Name <span className="text-red-500">*</span></label>
                <input 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-[#9945FF] focus:bg-black/60 transition-all text-white placeholder:text-gray-500 font-display"
                    placeholder="e.g. SolStream Protocol"
                />
            </div>

            {/* Category & Stage Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Category</label>
                    <div className="relative">
                        <select 
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-[#9945FF] focus:bg-black/60 transition-all text-white appearance-none cursor-pointer"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                             <Layers className="w-4 h-4" />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Development Stage</label>
                    <div className="relative">
                        <select 
                            value={formData.stage}
                            onChange={(e) => setFormData({...formData, stage: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-[#9945FF] focus:bg-black/60 transition-all text-white appearance-none cursor-pointer"
                        >
                            {stages.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                        </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                             <Box className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Elevator Pitch <span className="text-red-500">*</span></label>
                <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 h-32 outline-none focus:border-[#9945FF] focus:bg-black/60 transition-all resize-none text-white placeholder:text-gray-500 leading-relaxed"
                    placeholder="Describe your project's value proposition in 2-3 sentences..."
                />
            </div>

            {/* Tags Input */}
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Tags</label>
                <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 flex flex-wrap gap-2 min-h-[52px] focus-within:border-[#9945FF] focus-within:bg-black/60 transition-all">
                    {tags.map(tag => (
                        <span key={tag} className="bg-[#9945FF]/20 text-[#d8b4fe] text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#9945FF]/30">
                            #{tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                    <input 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="bg-transparent outline-none text-white flex-grow min-w-[120px] placeholder:text-gray-500 text-sm py-1"
                        placeholder={tags.length === 0 ? "Type tag & press Enter (e.g. ZK, Rust)" : ""}
                    />
                </div>
            </div>

            {/* Website & Bounty Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Website / Repo</label>
                    <input 
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-[#9945FF] focus:bg-black/60 transition-all text-white placeholder:text-gray-500"
                        placeholder="https://..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Bounty Pool (Optional)</label>
                    <div className="relative">
                        <input 
                            type="number"
                            value={formData.bounty}
                            onChange={(e) => setFormData({...formData, bounty: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 outline-none focus:border-[#9945FF] focus:bg-black/60 transition-all text-white placeholder:text-gray-500 font-mono pr-24"
                            placeholder="0.00"
                        />
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 px-3 py-1 rounded-lg text-gold font-bold flex items-center gap-1 border border-white/5 pointer-events-none">
                             <span className="text-sm">USDC</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 ml-1">Project Banner</label>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                />
                
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer overflow-hidden group/upload ${
                        imagePreview ? 'border-accent/50 bg-black/60' : 'border-white/10 hover:border-white/30 hover:bg-white/10 bg-black/20'
                    }`}
                    style={{ height: '220px' }}
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/upload:opacity-40 transition-opacity" />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center relative z-10">
                            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-4 text-gray-400 group-hover/upload:text-white group-hover/upload:scale-110 transition-all duration-300">
                                <ImageIcon className="w-7 h-7" />
                            </div>
                            <p className="text-sm text-gray-300 font-bold mb-1">Click to upload banner</p>
                            <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (Max 800x400px)</p>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity z-20">
                         {imagePreview && <p className="text-white font-bold bg-black/60 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">Change Image</p>}
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-r from-[#9945FF] to-[#7c3aed] border-none text-white font-bold text-lg rounded-full hover:shadow-[0_0_30px_rgba(153,69,255,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn z-20 cursor-pointer"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 rounded-full" />
                <Rocket className="w-5 h-5 group-hover/btn:rotate-45 transition-transform duration-300" /> 
                <span className="relative z-10">Launch Project</span>
            </button>
        </form>
      </motion.div>
    </div>
  );
};
