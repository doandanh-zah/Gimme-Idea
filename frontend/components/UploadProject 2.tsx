
'use client';

import React, { useState, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { Upload, Rocket, CheckCircle2, X, Image as ImageIcon, Tag, Zap, Box, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Project } from '../lib/types';
import { LoadingLightbulb, LoadingStatus } from './LoadingLightbulb';

export const UploadProject = () => {
  const { addProject, user } = useAppStore();
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
    if (!user) {
        toast.error('Please connect wallet first');
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
      {/* Full Screen Loading/Success Overlay */}
      <AnimatePresence>
      {isSubmitting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020105]/95 backdrop-blur-xl"
        >
          {status === 'success' ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent animate-pulse-slow" />
                
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

      {/* Fixed Background */}
      <div className="fixed inset-0 z-[-1] bg-black bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(153,69,255,0.15),rgba(255,255,255,0))]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-10">
            <h1 className="text-3xl font-display font-bold mb-2">Submit your Build</h1>
            <p className="text-gray-400">Get validated by the best builders on Solana.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-[#0A0A0A]/80 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
            
            {/* Project Name */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                <input 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors text-white"
                    placeholder="e.g. SolStream"
                />
            </div>

            {/* Category & Stage Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-white appearance-none"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stage</label>
                    <select 
                        value={formData.stage}
                        onChange={(e) => setFormData({...formData, stage: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent text-white appearance-none"
                    >
                        {stages.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Elevator Pitch</label>
                <textarea 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 h-32 outline-none focus:border-accent transition-colors resize-none text-white"
                    placeholder="Describe your project in 2-3 sentences..."
                />
            </div>

            {/* Tags Input */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags (Press Enter)</label>
                <div className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 flex flex-wrap gap-2 min-h-[50px] focus-within:border-accent transition-colors">
                    {tags.map(tag => (
                        <span key={tag} className="bg-white/10 text-xs px-2 py-1 rounded-md flex items-center gap-1 border border-white/5">
                            #{tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                    <input 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="bg-transparent outline-none text-white flex-grow min-w-[100px]"
                        placeholder={tags.length === 0 ? "e.g. Rust, ZK, Mobile..." : ""}
                    />
                </div>
            </div>

            {/* Website & Bounty Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website / Repo</label>
                    <input 
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors text-white"
                        placeholder="https://..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bounty (Optional)</label>
                    <div className="relative">
                        <input 
                            type="number"
                            value={formData.bounty}
                            onChange={(e) => setFormData({...formData, bounty: e.target.value})}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent transition-colors text-white"
                            placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-mono">USDC</span>
                    </div>
                </div>
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Banner</label>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                />
                
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer overflow-hidden ${
                        imagePreview ? 'border-accent/50' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                    }`}
                    style={{ height: '200px' }}
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 text-gray-400">
                                <ImageIcon className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-gray-400">Click to upload banner image</p>
                            <p className="text-xs text-gray-600 mt-2">Recommend 1200x600</p>
                        </div>
                    )}
                    
                    {imagePreview && (
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                             <p className="text-white font-bold">Change Image</p>
                         </div>
                    )}
                </div>
            </div>

            <button 
                type="submit" 
                className="w-full py-4 bg-[#9945FF] border-none text-white font-bold rounded-full hover:bg-[#7c3aed] hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(153,69,255,0.4)] flex items-center justify-center gap-2"
            >
                <Rocket className="w-5 h-5" /> Launch Project
            </button>
        </form>
      </motion.div>
    </div>
  );
};
