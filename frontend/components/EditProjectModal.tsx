'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Rocket, Lightbulb, Image as ImageIcon, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Project } from '../lib/types';
import { uploadProjectImage } from '../lib/imgbb';
import { MarkdownGuide } from './MarkdownGuide';
import toast from 'react-hot-toast';

interface EditProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
}

export const EditProjectModal = ({ project, isOpen, onClose, onSave }: EditProjectModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categories: [] as string[],
    stage: 'Idea',
    website: '',
    bounty: '',
    problem: '',
    opportunity: '',
    solution: '',
    isAnonymous: false,
    imageUrl: ''
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const categories = [
    'DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO', 'DePIN', 'Social', 'Mobile', 'Security',
    'Payment', 'Developer Tooling', 'ReFi', 'Content', 'Dapp', 'Blinks'
  ];

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        categories: project.category ? [project.category] : [],
        stage: project.stage || 'Idea',
        website: project.website || '',
        bounty: project.bounty?.toString() || '',
        problem: project.problem || '',
        opportunity: project.opportunity || '',
        solution: project.solution || '',
        isAnonymous: project.isAnonymous || false,
        imageUrl: project.image || ''
      });
      setTags(project.tags || []);
    }
  }, [project, isOpen]);

  const isIdea = project?.type === 'idea';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setIsUploadingImage(true);
      try {
        const imageUrl = await uploadProjectImage(file);
        setFormData({ ...formData, imageUrl });
        toast.success('Image uploaded!');
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('Failed to upload image');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const toggleCategory = (category: string) => {
    if (formData.categories.includes(category)) {
      setFormData({ ...formData, categories: formData.categories.filter(c => c !== category) });
    } else {
      if (formData.categories.length < 3) {
        setFormData({ ...formData, categories: [...formData.categories, category] });
      } else {
        toast.error('You can select up to 3 categories');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (formData.categories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    if (isIdea) {
      if (!formData.problem.trim() || !formData.solution.trim()) {
        toast.error('Please fill in Problem and Solution fields');
        return;
      }
    } else {
      if (!formData.description.trim()) {
        toast.error('Please describe your project');
        return;
      }
    }

    setIsSaving(true);

    try {
      const updateData: Partial<Project> = {
        id: project?.id,
        title: formData.title,
        description: isIdea ? formData.problem.substring(0, 100) + '...' : formData.description,
        category: formData.categories[0] as Project['category'],
        stage: formData.stage as Project['stage'],
        tags: tags.length > 0 ? tags : [...formData.categories.slice(1), 'Solana'],
        website: formData.website,
        image: formData.imageUrl || undefined,
        bounty: formData.bounty ? Number(formData.bounty) : undefined,
        problem: formData.problem,
        opportunity: formData.opportunity,
        solution: formData.solution,
        // Anonymous idea/project submission is disabled (anonymous comments still supported)
        isAnonymous: false
      };

      onSave(updateData);
      toast.success(`${isIdea ? 'Idea' : 'Project'} updated!`);
      onClose();
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 modal-overlay"
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-title"
      >
        <div className="modal-frame flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="modal-header flex-shrink-0">
            <div className="relative z-10 flex justify-between items-center">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`modal-icon ${isIdea ? '' : 'text-[#9945FF]'}`}>
                  {isIdea ? <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" /> : <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                <div>
                  <p className="ui-eyebrow mb-2">{isIdea ? 'Idea' : 'Project'}</p>
                  <h2 id="edit-project-title" className="modal-title">
                    Edit {isIdea ? 'Idea' : 'Project'}
                  </h2>
                  <p className="modal-description hidden sm:block">
                    Update your {isIdea ? 'idea' : 'project'} details
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="modal-close"
                aria-label={`Close edit ${isIdea ? 'idea' : 'project'} dialog`}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Form Area */}
          <div className="overflow-y-auto p-4 sm:p-8 custom-scrollbar flex-1">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              
              {/* Title */}
              <div className="space-y-2">
                <label className="field-label flex items-center gap-2">
                  {isIdea ? 'Idea Name' : 'Project Name'}
                  <span className="text-red-400">*</span>
                </label>
                <input 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="field-input font-medium"
                  placeholder={isIdea ? "e.g. Decentralized Uber for Solana" : "e.g. SolStream Protocol"}
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="field-label flex items-center gap-2">
                  Categories
                  <span className="text-red-400">*</span>
                  <span className="text-gray-600 font-normal text-[10px]">(Up to 3)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`min-h-[40px] border px-2.5 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] sm:px-4 sm:py-2.5 sm:text-sm ${
                        formData.categories.includes(cat)
                          ? isIdea
                            ? 'bg-[#FFD700] text-black border border-[#FFD700]'
                            : 'bg-[#9945FF] text-white border border-[#9945FF]'
                          : 'bg-[#141419] text-gray-400 border border-white/10 hover:border-white/25 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Idea-specific fields */}
              {isIdea && (
                <>
                  <div className="space-y-2">
                    <label className="field-label flex items-center gap-2">
                      Problem <span className="text-red-400">*</span>
                      <MarkdownGuide />
                    </label>
                    <textarea 
                      value={formData.problem}
                      onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                      className="field-input field-textarea h-32 leading-relaxed"
                      placeholder="What problem does this idea solve?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="field-label flex items-center gap-2">
                      Opportunity
                      <MarkdownGuide />
                    </label>
                    <textarea 
                      value={formData.opportunity}
                      onChange={(e) => setFormData({ ...formData, opportunity: e.target.value })}
                      className="field-input field-textarea h-24 leading-relaxed"
                      placeholder="Why is this a good opportunity? (Market size, timing, etc.)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="field-label flex items-center gap-2">
                      Solution <span className="text-red-400">*</span>
                      <MarkdownGuide />
                    </label>
                    <textarea 
                      value={formData.solution}
                      onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                      className="field-input field-textarea h-32 leading-relaxed"
                      placeholder="How does your idea solve this problem?"
                    />
                  </div>

                  {/* Anonymous idea/project submission is disabled (anonymous comments still supported). */}
                </>
              )}

              {/* Project-specific fields */}
              {!isIdea && (
                <>
                  <div className="space-y-2">
                    <label className="field-label flex items-center gap-2">
                      Description <span className="text-red-400">*</span>
                      <MarkdownGuide />
                    </label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="field-input field-textarea h-32 leading-relaxed"
                      placeholder="Describe your project..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="field-label">Website</label>
                    <input 
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="field-input"
                      placeholder="https://your-project.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="field-label">Bounty (USDC)</label>
                    <input 
                      type="number"
                      value={formData.bounty}
                      onChange={(e) => setFormData({ ...formData, bounty: e.target.value })}
                      className="field-input"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="field-label">Project Banner</label>
                    <div 
                      onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all relative h-48 flex flex-col items-center justify-center overflow-hidden bg-[#141419] ${
                        isUploadingImage ? 'border-purple-500/50 cursor-wait' : 'border-white/10 hover:bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-3" />
                          <p className="text-gray-300 font-bold text-sm">Uploading...</p>
                        </div>
                      ) : formData.imageUrl ? (
                        <>
                          <img src={formData.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 hover:opacity-40 transition-opacity" />
                          <div className="relative z-10 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">
                            <span className="text-white font-bold text-sm">Change Image</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-gray-500">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <p className="text-gray-400 text-sm">Click to upload image</p>
                          <p className="text-gray-600 text-xs mt-1">Max 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Tags */}
              <div className="space-y-2">
                <label className="field-label">Tags</label>
                <div className="field-input flex flex-wrap gap-2 items-center min-h-[52px]">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="flex-shrink-0 ml-1 text-gray-400 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
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

          {/* Footer */}
          <div className="modal-footer flex-shrink-0">
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className={`w-full font-bold text-base sm:text-lg disabled:opacity-50 ${isIdea ? 'btn-primary' : 'btn-ghost !border-[#9945FF]/45 !text-white hover:!bg-[#9945FF]/15'}`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <>
                  {isIdea ? <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" /> : <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />}
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
