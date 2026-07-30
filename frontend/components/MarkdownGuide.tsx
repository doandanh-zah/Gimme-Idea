'use client';

import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MarkdownGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-[40px] items-center gap-1 text-xs text-gray-400 transition-colors hover:text-[#FFD700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
      >
        <HelpCircle className="w-3 h-3" aria-hidden="true" />
        Formatting help
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close markdown guide"
              tabIndex={-1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 modal-overlay z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-frame fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-5 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="markdown-guide-title"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="ui-eyebrow mb-2">Editor</p>
                  <h2 id="markdown-guide-title" className="modal-title">Markdown Formatting Guide</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="modal-close"
                  aria-label="Close markdown guide"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Headings */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Headings</h3>
                  <div className="border border-white/10 bg-black/40 p-3 font-mono text-sm text-gray-300">
                    <div># Heading 1</div>
                    <div>## Heading 2</div>
                    <div>### Heading 3</div>
                  </div>
                </section>

                {/* Text Formatting */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Text Formatting</h3>
                  <div className="border border-white/10 bg-black/40 p-3 font-mono text-sm text-gray-300 space-y-1">
                    <div>**bold text**</div>
                    <div>*italic text*</div>
                    <div>~~strikethrough~~</div>
                    <div>`inline code`</div>
                  </div>
                </section>

                {/* Lists */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Lists</h3>
                  <div className="border border-white/10 bg-black/40 p-3 font-mono text-sm text-gray-300 space-y-2">
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
                  <div className="border border-white/10 bg-black/40 p-3 font-mono text-sm text-gray-300">
                    <div>[Link text](https://example.com)</div>
                  </div>
                </section>

                {/* Quotes */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Blockquotes</h3>
                  <div className="border border-white/10 bg-black/40 p-3 font-mono text-sm text-gray-300">
                    <div>&gt; This is a quote</div>
                    <div>&gt; Spanning multiple lines</div>
                  </div>
                </section>

                {/* Code Blocks */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Code Blocks</h3>
                  <div className="border border-white/10 bg-black/40 p-3 font-mono text-sm text-gray-300">
                    <div>```</div>
                    <div>Code block</div>
                    <div>Multiple lines</div>
                    <div>```</div>
                  </div>
                </section>

                {/* Horizontal Rule */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Horizontal Rule</h3>
                  <div className="border border-white/10 bg-black/40 p-3 font-mono text-sm text-gray-300">
                    <div>---</div>
                  </div>
                </section>

                {/* Tables */}
                <section>
                  <h3 className="text-lg font-bold text-[#FFD700] mb-2">Tables</h3>
                  <div className="border border-white/10 bg-black/40 p-3 font-mono text-sm text-gray-300">
                    <div>| Header 1 | Header 2 |</div>
                    <div>|----------|----------|</div>
                    <div>| Cell 1   | Cell 2   |</div>
                    <div>| Cell 3   | Cell 4   |</div>
                  </div>
                </section>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-gray-400">
                  Tip: Combine these formatting options to create rich, structured content.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
