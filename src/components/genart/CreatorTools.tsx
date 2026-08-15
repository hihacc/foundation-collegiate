"use client";

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Wand2, Layers, Maximize, Paintbrush, Zap, Lock, ChevronRight } from 'lucide-react';

const TOOLS = [
  {
    id: 'prompt',
    title: 'Advanced Prompting',
    description: 'Fine-tune your vision with negative prompts, aspect ratio controls, and weight modifiers.',
    icon: Wand2,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-500/50',
    previewGradient: 'from-violet-900 via-violet-600 to-fuchsia-600'
  },
  {
    id: 'img2img',
    title: 'Image to Image',
    description: 'Use a base image to guide the generation process, maintaining structure while changing style.',
    icon: Layers,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-500/50',
    previewGradient: 'from-pink-900 via-rose-600 to-orange-500'
  },
  {
    id: 'upscale',
    title: '4K AI Upscaling',
    description: 'Enhance your artwork to print-ready 4K and 8K resolutions without losing any detail.',
    icon: Maximize,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-500/50',
    previewGradient: 'from-cyan-900 via-cyan-600 to-blue-600'
  },
  {
    id: 'inpaint',
    title: 'Smart Inpainting',
    description: 'Fix or replace specific parts of your image seamlessly using AI-powered masking.',
    icon: Paintbrush,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-500/50',
    previewGradient: 'from-emerald-900 via-emerald-600 to-teal-500'
  }
];

export default function CreatorTools() {
  const [activeTool, setActiveTool] = useState(TOOLS[0]);

  return (
    <section className="py-24 px-4 bg-[#050505] relative border-y border-[#1a1a1a]">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <m.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              Built for <span className="text-gradient-primary">Creators</span>
            </m.h2>
            <m.p 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-neutral-400 text-lg"
            >
              Professional-grade tools that give you absolute control over the generation process. No more relying on luck.
            </m.p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar / Tools List */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {TOOLS.map((tool, index) => {
              const isActive = activeTool.id === tool.id;
              return (
                <m.button
                  key={tool.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTool(tool)}
                  className={`text-left p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                    isActive 
                      ? `glass border-[#404040] ${tool.bg}` 
                      : 'border-transparent hover:border-[#262626] hover:bg-[#111111]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? 'bg-black/50' : 'bg-[#171717] group-hover:bg-black'
                    }`}>
                      <tool.icon className={`w-6 h-6 ${isActive ? tool.color : 'text-neutral-500 group-hover:text-white'}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold mb-1 transition-colors ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`}>
                        {tool.title}
                      </h3>
                      <p className={`text-sm line-clamp-1 transition-colors ${isActive ? 'text-neutral-300' : 'text-neutral-600 group-hover:text-neutral-400'}`}>
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? `translate-x-0 ${tool.color}` : '-translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-white'}`} />
                </m.button>
              );
            })}
          </div>

          {/* Dynamic Preview Panel */}
          <div className="lg:col-span-7">
            <m.div 
              className="glass-card h-full min-h-[400px] rounded-3xl p-2 relative overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#262626]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="mx-auto text-xs font-mono text-neutral-500 bg-black/50 px-3 py-1 rounded-full">
                  studio.lumina.art/tools/{activeTool.id}
                </div>
              </div>

              {/* Dynamic Content */}
              <div className="flex-1 relative overflow-hidden rounded-b-[22px] bg-[#0a0a0a]">
                <AnimatePresence mode="wait">
                  <m.div
                    key={activeTool.id}
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 p-8 flex flex-col justify-center items-center text-center"
                  >
                    <div className={`w-full max-w-md aspect-video rounded-2xl bg-gradient-to-br ${activeTool.previewGradient} shadow-2xl relative overflow-hidden mb-8`}>
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <activeTool.icon className="w-20 h-20 text-white/50" />
                      </div>
                    </div>
                    
                    <h4 className="text-2xl font-bold text-white mb-2">{activeTool.title} Preview</h4>
                    <p className="text-neutral-400 max-w-sm mx-auto">
                      {activeTool.description} Interact with this tool in the studio workspace to see real-time updates.
                    </p>
                  </m.div>
                </AnimatePresence>
              </div>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}
