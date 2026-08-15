"use client";

import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Palette, BoxSelect, Coins, Wallet, CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = [
  {
    icon: Palette,
    title: 'Generate & Refine',
    description: 'Use our AI to generate hundreds of variations. Select the best ones and refine them.',
    color: 'text-[#06b6d4]',
    bg: 'bg-[#06b6d4]/10',
    border: 'border-[#06b6d4]'
  },
  {
    icon: BoxSelect,
    title: 'Curate Collection',
    description: 'Group your best pieces into a cohesive collection. Add metadata and traits.',
    color: 'text-[#8b5cf6]',
    bg: 'bg-[#8b5cf6]/10',
    border: 'border-[#8b5cf6]'
  },
  {
    icon: Coins,
    title: 'Mint & Sell',
    description: 'Deploy a smart contract with one click directly to Ethereum, Polygon, or Solana.',
    color: 'text-[#ec4899]',
    bg: 'bg-[#ec4899]/10',
    border: 'border-[#ec4899]'
  }
];

export default function MintingFlow() {
  const [walletState, setWalletState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [activeStep, setActiveStep] = useState(0);

  // Auto-progress steps for demonstration when wallet is connected
  useEffect(() => {
    if (walletState !== 'connected') return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < 2 ? prev + 1 : 0));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [walletState]);

  const handleConnect = () => {
    setWalletState('connecting');
    setTimeout(() => {
      setWalletState('connected');
      setActiveStep(0);
    }, 1500);
  };

  return (
    <section className="py-24 px-4 overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <div className="glow-orb glow-orb-secondary w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20 flex flex-col items-center">
          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 text-sm text-neutral-300"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Web3 Ready</span>
          </m.div>
          
          <m.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            From Prompt to <span className="text-gradient-gold">Blockchain</span>
          </m.h2>

          {/* Interactive Wallet Button */}
          <m.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            onClick={walletState === 'disconnected' ? handleConnect : undefined}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              walletState === 'disconnected' 
                ? 'bg-white text-black hover:bg-neutral-200' 
                : walletState === 'connecting'
                ? 'bg-neutral-800 text-white cursor-wait border border-[#262626]'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {walletState === 'disconnected' && <><Wallet className="w-5 h-5" /> Connect Wallet</>}
            {walletState === 'connecting' && <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</>}
            {walletState === 'connected' && <><CheckCircle2 className="w-5 h-5" /> 0x71C...97d1 Connected</>}
          </m.button>
        </div>

        <div className="relative mt-12">
          {/* Animated Connecting Line */}
          <div className="hidden md:block absolute top-10 left-[10%] w-[80%] h-1 bg-[#1a1a1a] rounded-full z-0 overflow-hidden">
             <m.div 
               className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#ec4899]"
               initial={{ width: '0%' }}
               animate={{ 
                 width: walletState === 'connected' 
                   ? activeStep === 0 ? '33%' : activeStep === 1 ? '66%' : '100%' 
                   : '0%' 
               }}
               transition={{ duration: 1, ease: "easeInOut" }}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {STEPS.map((step, index) => {
              const isPast = walletState === 'connected' && index < activeStep;
              const isCurrent = walletState === 'connected' && index === activeStep;
              const isFuture = walletState === 'disconnected' || index > activeStep;

              return (
                <m.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative group"
                >
                  <div className={`glass-card p-8 text-center h-full flex flex-col items-center transition-all duration-500 ${
                    isCurrent ? `border-t-4 ${step.border} transform -translate-y-2 shadow-2xl` : 
                    isPast ? 'opacity-70 border-t-4 border-emerald-500/50' : 'border-t-4 border-transparent opacity-50'
                  }`}>
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                       {isPast && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                       {isCurrent && <Loader2 className={`w-5 h-5 animate-spin ${step.color}`} />}
                    </div>

                    <div className={`w-20 h-20 rounded-2xl ${isCurrent ? step.bg : 'bg-[#171717]'} border border-white/5 flex items-center justify-center mb-6 transition-colors duration-500`}>
                      <step.icon className={`w-10 h-10 ${isCurrent ? step.color : 'text-neutral-500'}`} />
                    </div>
                    <h3 className={`text-2xl font-bold mb-3 transition-colors ${isCurrent || isPast ? 'text-white' : 'text-neutral-400'}`}>
                      {index + 1}. {step.title}
                    </h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </m.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
