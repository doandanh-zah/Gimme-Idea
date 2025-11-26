import React from 'react';
import { motion } from 'framer-motion';
import { JOURNEY_STEPS } from '../constants';
import { ArrowRight } from 'lucide-react';

const JourneyMap: React.FC = () => {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">From Napkin to <span className="text-gold">Mainnet</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto">The proven pipeline for turning raw concepts into battle-tested protocols.</p>
        </motion.div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
            {JOURNEY_STEPS.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="relative bg-black border border-white/10 p-6 rounded-2xl hover:border-gold/50 transition-colors duration-300 h-full flex flex-col items-center text-center">
                  
                  {/* Icon Step Badge */}
                  <div className="w-12 h-12 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-gold group-hover:text-black transition-colors duration-300 text-gold shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-bold font-display mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>

                  {/* Mobile Arrow */}
                  {index < JOURNEY_STEPS.length - 1 && (
                    <div className="lg:hidden mt-6 text-gray-600">
                      <ArrowRight className="w-6 h-6 mx-auto rotate-90 lg:rotate-0" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JourneyMap;