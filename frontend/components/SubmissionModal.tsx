
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { useRouter } from 'next/navigation';
import { Upload, Rocket, X, Image as ImageIcon, Lightbulb, Box, Layers, EyeOff, Eye, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Project } from '../lib/types';
import { LoadingLightbulb, LoadingStatus } from './LoadingLightbulb';
import { MarkdownGuide } from './MarkdownGuide';
import { uploadProjectImage } from '../lib/imgbb';
import { sanitizeText, sanitizeUrl, hasDangerousContent } from '../lib/sanitize';

export const SubmissionModal = () => {
  const { isSubmitModalOpen, submitType, closeSubmitModal, addProject, user, openConnectReminder } = useAppStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<LoadingStatus>('loading');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Unified Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categories: [] as string[],
    stage: 'Idea',
    website: '',
    bounty: '',
    // Idea specific
    problem: '',
    opportunity: '',
    solution: '',
    isAnonymous: false
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Reset form on open
  useEffect(() => {
    if (isSubmitModalOpen) {
        setFormData({
            title: '', description: '', categories: [], stage: 'Idea', website: '', bounty: '',
            problem: '', opportunity: '', solution: '', isAnonymous: false
        });
        setTags([]);
        setImagePreview(null);
        setIsSubmitting(false);
        setIsUploadingImage(false);
    }
  }, [isSubmitModalOpen]);

  const categories = [
    'DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'DePIN', 'Social', 'Mobile', 'Security',
    'Payment', 'Developer Tooling', 'ReFi', 'Content', 'Dapp', 'Blinks'
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB for imgBB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setIsUploadingImage(true);
      try {
        // Upload to imgBB
        const imageUrl = await uploadProjectImage(file);
        setImagePreview(imageUrl);
        toast.success('Image uploaded!');
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('Failed to upload image. Please try again.');
      } finally {
        setIsUploadingImage(false);
      }
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

  const toggleCategory = (category: string) => {
    if (formData.categories.includes(category)) {
      // Remove category
      setFormData({...formData, categories: formData.categories.filter(c => c !== category)});
    } else {
      // Add category (max 3)
      if (formData.categories.length < 3) {
        setFormData({...formData, categories: [...formData.categories, category]});
      } else {
        toast.error('You can select up to 3 categories');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check wallet connection with the new reminder popup
    if (!user) {
        closeSubmitModal();
        openConnectReminder();
        return;
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeText(formData.title, 200);
    const sanitizedDescription = sanitizeText(formData.description, 5000);
    const sanitizedProblem = sanitizeText(formData.problem, 3000);
    const sanitizedSolution = sanitizeText(formData.solution, 3000);
    const sanitizedOpportunity = sanitizeText(formData.opportunity, 3000);
    const sanitizedWebsite = sanitizeUrl(formData.website);

    // Check for dangerous content
    if (hasDangerousContent(formData.title) || 
        hasDangerousContent(formData.description) || 
        hasDangerousContent(formData.problem) || 
        hasDangerousContent(formData.solution)) {
        toast.error('Invalid content detected. Please remove any HTML or scripts.');
        return;
    }

    if (!sanitizedTitle) {
        toast.error('Please enter a title');
        return;
    }

    if (formData.categories.length === 0) {
        toast.error('Please select at least one category');
        return;
    }

    if (submitType === 'project' && !sanitizedDescription) {
        toast.error('Please describe your project');
        return;
    }

    // Idea validation
    if (submitType === 'idea') {
        if (!sanitizedProblem || !sanitizedSolution) {
            toast.error('Please fill in Problem and Solution fields');
            return;
        }
    }
    
    setIsSubmitting(true);
    setStatus('loading');

    try {
        // Sanitize tags
        const sanitizedTags = tags.map(tag => sanitizeText(tag, 50)).filter(Boolean);
        
        // Prepare project data for API with sanitized values
        const projectData = {
            type: submitType,
            title: sanitizedTitle,
            description: submitType === 'project' ? sanitizedDescription : sanitizedProblem.substring(0, 100) + '...',
            category: formData.categories[0] as Project['category'],
            stage: formData.stage as Project['stage'],
            tags: sanitizedTags.length > 0 ? sanitizedTags : [...formData.categories.slice(1), 'New', 'Solana'],
            // Project Specific
            website: sanitizedWebsite,
            imageUrl: imagePreview || undefined,
            bounty: formData.bounty ? Number(formData.bounty) : undefined,
            // Idea Specific
            problem: sanitizedProblem,
            opportunity: sanitizedOpportunity,
            solution: sanitizedSolution,
            // Anonymous idea/project submission is disabled (anonymous comments still supported)
            isAnonymous: false
        };

        await addProject(projectData);
        setStatus('success');

        setTimeout(() => {
            toast.success(`${submitType === 'project' ? 'Project' : 'Idea'} submitted successfully!`);
            setIsSubmitting(false);
            closeSubmitModal();
            // Navigate to appropriate page after submission
            router.push(submitType === 'project' ? '/projects' : '/idea');
        }, 2000);
    } catch (error) {
        setStatus('error');
        setIsSubmitting(false);
        toast.error(`Failed to submit ${submitType}`);
    }
  };

  if (!isSubmitModalOpen) return null;

  // Visual Theme Constants
  const isProject = submitType === 'project';
  const themeColor = isProject ? 'from-[#9945FF] to-[#7c3aed]' : 'from-[#FFD700] to-[#FDB931]';
  const borderColor = isProject ? 'border-[#9945FF]/30' : 'border-[#FFD700]/30';
  const shadowColor = isProject ? 'shadow-[#9945FF]/20' : 'shadow-[#FFD700]/20';
  
  // Dynamic Styles for Success State
  const gridColor = isProject ? 'rgba(20, 241, 149, 0.2)' : 'rgba(255, 215, 0, 0.2)';
  const glowColor = isProject ? '#14F195' : '#FFD700';
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={closeSubmitModal}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <AnimatePresence mode="wait">
        {isSubmitting ? (
             <motion.div 
                key="loading-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[101] flex items-center justify-center bg-[#050508]/95 backdrop-blur-xl"
             >
                 {status === 'success' ? (
                     <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        {/* Dynamic Background Effects */}
                         <div className="absolute inset-0 z-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-black via-[#050505] to-[#101010]" />
                            {/* Scanning Grid */}
                            <div 
                                className="absolute inset-0 opacity-30"
                                style={{
                                    backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
                                    backgroundSize: '40px 40px',
                                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
                                    WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
                                }}
                            />
                            {/* Pulse Glow */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-radial-gradient"
                                style={{
                                    background: `radial-gradient(circle at center, ${glowColor}00 0%, ${glowColor}10 50%, transparent 70%)`
                                }}
                            />
                         </div>

                        <motion.div 
                           initial={{ scale: 0.5, opacity: 0, y: 50 }}
                           animate={{ scale: 1, opacity: 1, y: 0 }}
                           transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
                           className="relative z-10 bg-[#0F0F0F] border border-white/10 p-1 rounded-3xl backdrop-blur-2xl"
                           style={{
                               boxShadow: `0 0 100px ${glowColor}40`
                           }}
                        >
                           <div className="bg-[#0A0A0A] rounded-[20px] p-12 text-center relative overflow-hidden w-[90vw] max-w-md">
                               {/* Shimmer on Card */}
                               <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-20 pointer-events-none" />

                               <div className="relative w-24 h-24 mx-auto mb-8">
                                   <motion.div 
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      transition={{ duration: 0.5, delay: 0.2 }}
                                      className={`absolute inset-0 rounded-2xl rotate-3`}
                                      style={{ backgroundColor: glowColor }}
                                   />
                                   <div 
                                      className={`absolute inset-0 bg-[#0A0A0A] border-2 rounded-2xl flex items-center justify-center z-10`}
                                      style={{ borderColor: glowColor }}
                                   >
                                      {isProject ? <Rocket className="w-10 h-10" style={{color: glowColor}} /> : <Lightbulb className="w-10 h-10" style={{color: glowColor}} />}
                                   </div>
                                    
                                   {/* Orbiting Particles */}
                                   {[...Array(3)].map((_, i) => (
                                      <motion.div
                                        key={i}
                                        className="absolute inset-0 border rounded-full"
                                        style={{ borderColor: `${glowColor}60` }}
                                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                                        transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: "linear" }}
                                      />
                                   ))}
                               </div>

                               <h2 className="text-3xl font-display font-bold text-white mb-2 uppercase tracking-tight">
                                  {isProject ? 'DEPLOYED' : 'PUBLISHED'}
                               </h2>
                               <p className="text-gray-400">Your {isProject ? 'project' : 'idea'} is now live.</p>
                           </div>
                        </motion.div>
                     </div>
                 ) : (
                     <LoadingLightbulb 
                        text={status === 'loading' ? `Submitting ${submitType}...` : "Success!"} 
                        status={status}
                    />
                 )}
             </motion.div>
        ) : (
            <motion.div 
                key="submission-form"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden mx-2 sm:mx-4"
            >
                {/* Main Container */}
                <div className="relative bg-[#0D0D12] border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-white/10 flex-shrink-0">
                        <div className="relative z-10 flex justify-between items-center gap-3">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                <div 
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${themeColor} text-white flex-shrink-0`}
                                >
                                    {isProject ? <Rocket className="w-5 h-5 sm:w-6 sm:h-6" /> : <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base sm:text-xl font-bold text-white truncate">
                                        {isProject ? 'Launch Project' : 'Share Your Idea'}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
                                        {isProject ? 'Showcase your build' : 'Validate your concept'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={closeSubmitModal} 
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-gray-400 hover:text-white border border-white/10 hover:border-white/20 flex-shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="overflow-y-auto p-4 sm:p-8 custom-scrollbar flex-1">
                        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                            
                            {/* Common Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                        {submitType === 'idea' ? 'Idea Name' : 'Project Name'}
                                        <span className="text-red-400">*</span>
                                    </label>
                                    <input 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-[#141419] border border-white/10 rounded-xl px-4 sm:px-5 py-3 sm:py-4 outline-none focus:border-white/30 text-white placeholder:text-gray-600 transition-all font-medium hover:border-white/20 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] text-sm sm:text-base"
                                        placeholder={submitType === 'idea' ? "e.g. Decentralized Uber for Solana" : "e.g. SolStream Protocol"}
                                    />
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                        Categories
                                        <span className="text-red-400">*</span>
                                        <span className="text-gray-600 font-normal text-[10px]">(Select up to 3)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => toggleCategory(cat)}
                                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                                    formData.categories.includes(cat)
                                                        ? isProject
                                                            ? 'bg-[#9945FF] text-white border border-[#9945FF]'
                                                            : 'bg-[#FFD700] text-black border border-[#FFD700]'
                                                        : 'bg-[#141419] text-gray-400 border border-white/10 hover:border-white/25 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        {/* Project Specific */}
                        {isProject && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Elevator Pitch *</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-white/30 text-white h-32 resize-none placeholder:text-gray-600 leading-relaxed"
                                        placeholder="Describe your project's value proposition in 2-3 sentences..."
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Project Banner</label>
                                    <div 
                                        onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all relative h-48 flex flex-col items-center justify-center overflow-hidden group/upload bg-[#1A1A1A] ${
                                            isUploadingImage ? 'border-accent/50 cursor-wait' : 'border-white/10 hover:bg-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                                        {isUploadingImage ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <Loader2 className="w-10 h-10 text-accent animate-spin mb-3" />
                                                <p className="text-gray-300 font-bold text-sm">Uploading image...</p>
                                            </div>
                                        ) : imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover/upload:opacity-40 transition-opacity" />
                                                <div className="relative z-10 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md opacity-0 group-hover/upload:opacity-100 transition-opacity">
                                                    <span className="text-white font-bold text-sm">Change Image</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-gray-500 group-hover/upload:text-white group-hover/upload:scale-110 transition-all">
                                                    <ImageIcon className="w-6 h-6" />
                                                </div>
                                                <p className="text-gray-300 font-bold text-sm">Click to upload banner</p>
                                                <p className="text-gray-600 text-xs mt-1">Max 5MB • Recommended: 1200x600px</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Website / Repo</label>
                                        <input 
                                            value={formData.website}
                                            onChange={(e) => setFormData({...formData, website: e.target.value})}
                                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-white/30 text-white placeholder:text-gray-600"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Bounty (USDC)</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={formData.bounty}
                                                onChange={(e) => setFormData({...formData, bounty: e.target.value})}
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-white/30 text-white placeholder:text-gray-600 pr-16"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">USDC</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Idea Specific */}
                        {!isProject && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <p className="text-xs text-gray-400">✨ Markdown formatting supported</p>
                                    <MarkdownGuide />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">The Problem *</label>
                                    <textarea 
                                        value={formData.problem}
                                        onChange={(e) => setFormData({...formData, problem: e.target.value})}
                                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-white/30 text-white h-24 resize-none placeholder:text-gray-600"
                                        placeholder="What pain point are you solving?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">The Solution *</label>
                                    <textarea 
                                        value={formData.solution}
                                        onChange={(e) => setFormData({...formData, solution: e.target.value})}
                                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-white/30 text-white h-24 resize-none placeholder:text-gray-600"
                                        placeholder="How does your idea solve this?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Opportunity</label>
                                    <textarea
                                        value={formData.opportunity}
                                        onChange={(e) => setFormData({...formData, opportunity: e.target.value})}
                                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-white/30 text-white h-24 resize-none placeholder:text-gray-600"
                                        placeholder="Market size, timing, potential..."
                                    />
                                </div>

                                {/* Anonymous posting for ideas is disabled. (Anonymous comments are still supported.) */}
                            </div>
                        )}

                        {/* Tags */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Tags</label>
                            <div className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 flex flex-wrap gap-2 min-h-[56px] focus-within:border-white/30 transition-colors">
                                {tags.map(tag => (
                                    <span key={tag} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold ${isProject ? 'bg-purple-500/20 text-purple-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                        #{tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                                <input 
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    className="bg-transparent outline-none text-white flex-grow text-sm min-w-[100px] placeholder:text-gray-600 py-1"
                                    placeholder={tags.length === 0 ? "Add tags (press Enter)" : ""}
                                />
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-white/10 bg-[#0A0A0F] flex-shrink-0">
                    <button 
                        onClick={handleSubmit}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:opacity-90 ${
                            isProject 
                                ? 'bg-[#9945FF] text-white' 
                                : 'bg-[#FFD700] text-black'
                        }`}
                    >
                        {isProject ? <Rocket className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
                        <span>{isProject ? 'Launch Project' : 'Publish Idea'}</span>
                    </button>
                </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
