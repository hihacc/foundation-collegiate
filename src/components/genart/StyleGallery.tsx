"use client";

import { m, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const STYLES = [
  {
    id: 1,
    name: 'Cyberpunk Neon',
    gradient: 'from-[#06b6d4] via-[#7c3aed] to-[#ec4899]',
    description: 'High-contrast futuristic cityscapes and neon-lit characters.',
    params: 'Settings: CFG 7, Steps 50, Sampler Euler a'
  },
  {
    id: 2,
    name: 'Ethereal Fantasy',
    gradient: 'from-[#a78bfa] via-[#c084fc] to-[#f472b6]',
    description: 'Dreamlike landscapes, mythical creatures, soft lighting.',
    params: 'Settings: CFG 9, Steps 40, Sampler DPM++ 2M'
  },
  {
    id: 3,
    name: 'Abstract Fluid',
    gradient: 'from-[#f59e0b] via-[#ef4444] to-[#ec4899]',
    description: 'Mesmerizing liquid simulations and vibrant color mixing.',
    params: 'Settings: CFG 5, Steps 30, Sampler DDIM'
  },
  {
    id: 4,
    name: 'Cinematic Sci-Fi',
    gradient: 'from-[#0ea5e9] via-[#3b82f6] to-[#4f46e5]',
    description: 'Epic space vistas, massive structures, dramatic shadows.',
    params: 'Settings: CFG 8, Steps 60, Sampler Heun'
  },
  {
    id: 5,
    name: 'Synthwave Retro',
    gradient: 'from-[#f43f5e] via-[#db2777] to-[#7c3aed]',
    description: '80s inspired grids, outrun sunsets, low-poly mountains.',
    params: 'Settings: CFG 10, Steps 45, Sampler Euler'
  },
  {
    id: 6,
    name: 'Biomechanical',
    gradient: 'from-[#10b981] via-[#059669] to-[#0f766e]',
    description: 'Organic and mechanical fusions, H.R. Giger inspired.',
    params: 'Settings: CFG 7.5, Steps 55, Sampler LMS'
  }
];

export default function StyleGallery() {
  const [activeStyle, setActiveStyle] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <m.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Explore <span className="text-gradient-neon">Infinite Styles</span>
          </m.h2>
          <m.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 max-w-2xl mx-auto text-lg"
          >
            Our engine supports over 50+ distinct art styles. Mix and match to create something entirely unique.
          </m.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STYLES.map((style, index) => (
            <m.div
              key={style.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onHoverStart={() => setActiveStyle(style.id)}
              onHoverEnd={() => setActiveStyle(null)}
              className="group cursor-pointer perspective-1000"
            >
              <m.div 
                className="glass-card overflow-hidden h-[300px] relative flex flex-col justify-end p-6 border-[#262626]"
                animate={{ 
                  scale: activeStyle === style.id ? 1.02 : 1,
                  y: activeStyle === style.id ? -5 : 0
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Simulated Image Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-40 group-hover:opacity-70 transition-opacity duration-500`}></div>
                
                {/* Noise overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                <div className="relative z-10 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-bold text-white mb-2">{style.name}</h3>
                  <p className="text-neutral-300 text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    {style.description}
                  </p>
                  
                  <div className="h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 overflow-hidden transition-all duration-300 delay-150">
                    <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                      <span className="font-mono text-xs text-white/70">{style.params}</span>
                      <button className="bg-white text-black p-1.5 rounded-full hover:bg-neutral-200 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Hover border glow */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-2xl transition-colors duration-300 z-20 pointer-events-none"></div>
              </m.div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
