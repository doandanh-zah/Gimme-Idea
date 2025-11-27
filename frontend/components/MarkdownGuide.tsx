'use client';

import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MarkdownGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#FFD700] transition-colors"
      >
        <HelpCircle className="w-3 h-3" />
        Formatting help
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 z-50 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Markdown Formatting Guide</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Headings */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Headings</h3>
                  <div className="bg-black/50 p-3 rounded-lg font-mono text-sm text-gray-300">
                    <div># Heading 1</div>
                    <div>## Heading 2</div>
                    <div>### Heading 3</div>
                  </div>
                </section>

                {/* Text Formatting */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Text Formatting</h3>
                  <div className="bg-black/50 p-3 rounded-lg font-mono text-sm text-gray-300 space-y-1">
                    <div>**bold text**</div>
                    <div>*italic text*</div>
                    <div>~~strikethrough~~</div>
                    <div>`inline code`</div>
                  </div>
                </section>

                {/* Lists */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Lists</h3>
                  <div className="bg-black/50 p-3 rounded-lg font-mono text-sm text-gray-300 space-y-2">
                    <div>
                      <div className="text-gray-500">Bullet list:</div>
                      <div>- Item 1</div>
                      <div>- Item 2</div>
                      <div>- Item 3</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mt-2">Numbered list:</div>
                      <div>1. First item</div>
                      <div>2. Second item</div>
                      <div>3. Third item</div>
                    </div>
                  </div>
                </section>

                {/* Links */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Links</h3>
                  <div className="bg-black/50 p-3 rounded-lg font-mono text-sm text-gray-300">
                    <div>[Link text](https://example.com)</div>
                  </div>
                </section>

                {/* Quotes */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Blockquotes</h3>
                  <div className="bg-black/50 p-3 rounded-lg font-mono text-sm text-gray-300">
                    <div>&gt; This is a quote</div>
                    <div>&gt; Spanning multiple lines</div>
                  </div>
                </section>

                {/* Code Blocks */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Code Blocks</h3>
                  <div className="bg-black/50 p-3 rounded-lg font-mono text-sm text-gray-300">
                    <div>```</div>
                    <div>Code block</div>
                    <div>Multiple lines</div>
                    <div>```</div>
                  </div>
                </section>

                {/* Horizontal Rule */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Horizontal Rule</h3>
                  <div className="bg-black/50 p-3 rounded-lg font-mono text-sm text-gray-300">
                    <div>---</div>
                  </div>
                </section>

                {/* Tables */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Tables</h3>
                  <div className="bg-black/50 p-3 rounded-lg font-mono text-sm text-gray-300">
                    <div>| Header 1 | Header 2 |</div>
                    <div>|----------|----------|</div>
                    <div>| Cell 1   | Cell 2   |</div>
                    <div>| Cell 3   | Cell 4   |</div>
                  </div>
                </section>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-gray-400">
                  💡 Tip: You can combine these formatting options to create rich, well-structured content!
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
