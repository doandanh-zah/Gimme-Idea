'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
        // Headings
        h1: ({ node, ...props }) => (
          <h1 className="text-3xl font-bold mb-4 mt-6 text-white" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-2xl font-bold mb-3 mt-5 text-white" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-xl font-bold mb-2 mt-4 text-white" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="text-lg font-bold mb-2 mt-3 text-gray-200" {...props} />
        ),
        h5: ({ node, ...props }) => (
          <h5 className="text-base font-bold mb-2 mt-3 text-gray-200" {...props} />
        ),
        h6: ({ node, ...props }) => (
          <h6 className="text-sm font-bold mb-2 mt-3 text-gray-300" {...props} />
        ),

        // Paragraphs
        p: ({ node, ...props }) => (
          <p className="mb-4 leading-relaxed" {...props} />
        ),

        // Lists
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside mb-4 space-y-2 pl-4" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2 pl-4" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="text-gray-300" {...props} />
        ),

        // Links
        a: ({ node, ...props }) => (
          <a
            className="text-[#FFD700] hover:text-[#FFC700] underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),

        // Text formatting
        strong: ({ node, ...props }) => (
          <strong className="font-bold text-white" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic text-gray-200" {...props} />
        ),
        del: ({ node, ...props }) => (
          <del className="line-through text-gray-500" {...props} />
        ),

        // Code
        code: ({ node, inline, ...props }: any) =>
          inline ? (
            <code
              className="bg-white/10 text-[#FFD700] px-1.5 py-0.5 rounded text-sm font-mono"
              {...props}
            />
          ) : (
            <code
              className="block bg-black/50 text-gray-300 p-4 rounded-lg overflow-x-auto font-mono text-sm mb-4"
              {...props}
            />
          ),
        pre: ({ node, ...props }) => (
          <pre className="bg-black/50 rounded-lg overflow-x-auto mb-4" {...props} />
        ),

        // Blockquotes
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-[#FFD700] pl-4 py-2 my-4 bg-white/5 rounded-r-lg text-gray-300 italic"
            {...props}
          />
        ),

        // Horizontal rule
        hr: ({ node, ...props }) => (
          <hr className="border-t border-white/10 my-8" {...props} />
        ),

        // Tables
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border border-white/10 rounded-lg" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-white/5" {...props} />
        ),
        tbody: ({ node, ...props }) => (
          <tbody className="divide-y divide-white/10" {...props} />
        ),
        tr: ({ node, ...props }) => (
          <tr className="hover:bg-white/5 transition-colors" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="px-4 py-2 text-left font-bold text-white border-b border-white/20" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="px-4 py-2 text-gray-300" {...props} />
        ),

        // Images
        img: ({ node, ...props }) => (
          <img className="max-w-full h-auto rounded-lg my-4" {...props} />
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
