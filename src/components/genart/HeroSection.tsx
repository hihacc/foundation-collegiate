"use client";

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Loader2, Download, Share2 } from 'lucide-react';

export default function HeroSection() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);

  const handleGenerate = (e?: React.FormEvent, overridePrompt?: string) => {
    if (e) e.preventDefault();
    const activePrompt = overridePrompt || prompt;
    if (!activePrompt.trim()) return;
    
    setPrompt(activePrompt);
    setIsGenerating(true);
    setGeneratedResult(null);
    
    setTimeout(() => {
      setIsGenerating(false);
      const hue1 = (activePrompt.length * 15) % 360;
      const hue2 = (activePrompt.length * 25 + 100) % 360;
      setGeneratedResult(`linear-gradient(135deg, hsl(${hue1}, 80%, 60%), hsl(${hue2}, 80%, 40%))`);
    }, 2500); 
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#0a0a0a] z-0" />
        <div className="absolute inset-0 hero-grid opacity-40 z-10" />
        <div className="glow-orb glow-orb-primary w-[500px] h-[500px] top-[-10%] left-[-10%]" />
        <div className="glow-orb glow-orb-secondary w-[400px] h-[400px] bottom-[10%] right-[-5%]" />
      </div>

      <div className="relative z-20 max-w-5xl mx-auto text-center w-full">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 border border-[#262626]"
        >
          <Sparkles className="w-4 h-4 text-[#d946ef]" />
          <span className="text-sm text-neutral-300 font-medium">Next-Gen AI Art Engine</span>
        </m.div>

        <m.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight"
        >
          Imagine it. <br className="hidden md:block" />
          <span className="text-gradient-neon">We&apos;ll create it.</span>
        </m.h1>

        <m.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto"
        >
          Generate breathtaking artwork with AI in seconds. Transform prompts into high-resolution visuals.
        </m.p>

        {/* Prompt Input Area */}
        <m.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-3xl mx-auto relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#06b6d4] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          
          <form onSubmit={(e) => handleGenerate(e)} className="relative glass-card p-2 rounded-2xl flex flex-col md:flex-row items-center gap-2">
            <div className="pl-4 hidden md:block">
              <ImageIcon className="w-6 h-6 text-neutral-500" />
            </div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic cyber city bathed in neon pink and cyan light..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-neutral-500 py-4 px-4 md:px-2 text-lg w-full"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="bg-white text-black font-semibold px-8 py-4 rounded-xl transition-all hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[160px] justify-center w-full md:w-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Create Art
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </m.div>
        
        {/* Sample Prompts */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm"
        >
          <span className="text-neutral-500">Try these:</span>
          {['Ethereal crystal forest', 'Steampunk mechanical owl', 'Abstract fluid simulation'].map((sample, i) => (
            <button 
              key={i}
              onClick={() => handleGenerate(undefined, sample)}
              disabled={isGenerating}
              className="px-4 py-1.5 rounded-full border border-[#262626] bg-[#171717]/50 text-neutral-300 hover:border-[#8b5cf6] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sample}
            </button>
          ))}
        </m.div>

        {/* Result Reveal */}
        <AnimatePresence>
          {generatedResult && (
            <m.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="mt-12 max-w-3xl mx-auto p-4 glass-card relative group overflow-hidden"
            >
              <div 
                className="w-full aspect-video rounded-xl relative overflow-hidden flex items-center justify-center"
                style={{ background: generatedResult }}
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                  <button className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] font-semibold rounded-full text-white transition-transform hover:scale-105">
                    Mint NFT
                  </button>
                </div>
              </div>
              <p className="mt-4 text-sm text-neutral-400 italic font-mono text-left px-2 border-l-2 border-[#8b5cf6]">
                &quot;{prompt}&quot;
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
