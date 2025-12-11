'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Move, Check, RotateCcw } from 'lucide-react';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File;
  aspectRatio: number; // width/height, e.g., 1 for avatar, 3 for cover
  onCropComplete: (croppedImageUrl: string) => void;
  title?: string;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  isOpen,
  onClose,
  imageFile,
  aspectRatio,
  onCropComplete,
  title = 'Crop Image'
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load image when file changes
  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setScale(1);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const cropImage = async () => {
    if (!imageRef.current || !containerRef.current) return;

    setIsProcessing(true);

    try {
      const container = containerRef.current;
      const image = imageRef.current;
      
      // Get container dimensions (the crop area)
      const containerRect = container.getBoundingClientRect();
      const cropWidth = containerRect.width;
      const cropHeight = containerRect.height;

      // Create canvas with the crop dimensions
      const canvas = document.createElement('canvas');
      const outputWidth = aspectRatio >= 1 ? 800 : 400;
      const outputHeight = outputWidth / aspectRatio;
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Calculate the actual image dimensions after scaling
      const scaledWidth = image.naturalWidth * scale;
      const scaledHeight = image.naturalHeight * scale;

      // Calculate the visible portion of the image
      // The position is the offset from center
      const centerX = cropWidth / 2;
      const centerY = cropHeight / 2;

      // Source coordinates on the original image
      const sourceX = (centerX - position.x - (scaledWidth / 2)) / scale;
      const sourceY = (centerY - position.y - (scaledHeight / 2)) / scale;
      const sourceWidth = cropWidth / scale;
      const sourceHeight = cropHeight / scale;

      // Draw the cropped portion
      ctx.drawImage(
        image,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, outputWidth, outputHeight
      );

      // Convert to blob and create URL
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          0.9
        );
      });

      // Create a new File from the blob
      const croppedFile = new File([blob], imageFile.name, { type: 'image/jpeg' });
      
      // Convert to base64 for preview and upload
      const reader = new FileReader();
      reader.onload = () => {
        onCropComplete(reader.result as string);
        onClose();
      };
      reader.readAsDataURL(croppedFile);

    } catch (error) {
      console.error('Crop error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate crop area dimensions based on aspect ratio
  const getCropAreaStyle = () => {
    if (aspectRatio >= 1) {
      // Landscape or square (cover image)
      return {
        width: '100%',
        maxWidth: '400px',
        aspectRatio: `${aspectRatio}`
      };
    } else {
      // Portrait (unlikely for our use case)
      return {
        height: '300px',
        aspectRatio: `${aspectRatio}`
      };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1a1a1a] rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Crop Area */}
          <div className="p-4">
            <div className="flex flex-col items-center">
              {/* Instructions */}
              <p className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                <Move className="w-4 h-4" /> Drag to position • Zoom to adjust
              </p>

              {/* Crop Container */}
              <div
                ref={containerRef}
                className="relative overflow-hidden bg-black/50 border-2 border-dashed border-white/30 rounded-xl cursor-move"
                style={getCropAreaStyle()}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {imageSrc && (
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Crop preview"
                    className="absolute pointer-events-none select-none"
                    style={{
                      transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                      left: '50%',
                      top: '50%',
                      maxWidth: 'none',
                      maxHeight: 'none'
                    }}
                    draggable={false}
                  />
                )}

                {/* Grid overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                  <div className="absolute right-1/3 top-0 bottom-0 w-px bg-white/20" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                  <div className="absolute bottom-1/3 left-0 right-0 h-px bg-white/20" />
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2 text-sm text-gray-400 min-w-[80px] justify-center">
                  <span>{Math.round(scale * 100)}%</span>
                </div>
                
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  disabled={scale >= 3}
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleReset}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors ml-2"
                  title="Reset"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={cropImage}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <>
                  <Check className="w-4 h-4" /> Apply
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
