'use client';

import { motion } from 'framer-motion';

export function Greeting() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full text-center"
    >
      {/* Logo glow */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[--primary]/10 border border-[--primary]/20 mb-6 glow-cyan">
        <span className="text-2xl font-bold text-[--cyan] font-[--font-display] text-glow-cyan" style={{ fontFamily: 'var(--font-display)' }}>H</span>
      </div>

      <div className="font-semibold text-2xl md:text-3xl text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        Harbinger
      </div>
      <div className="text-sm text-muted-foreground font-mono">
        Autonomous intelligence. What would you like to explore?
      </div>
    </motion.div>
  );
}
