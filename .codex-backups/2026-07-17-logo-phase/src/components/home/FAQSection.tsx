'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: 'How do I check my monthly test results?',
    a: 'You can check your results by visiting our Result Checker page. Enter your assigned Roll Number and PIN to view your detailed mark sheet.'
  },
  {
    q: 'What is the admission procedure?',
    a: 'You can apply online through our Admissions page by filling out the form and uploading required documents, or visit our campus at Muslim Town, North Karachi for an in-person registration.'
  },
  {
    q: 'Do you offer scholarships?',
    a: 'Yes, we offer merit-based scholarships to students who achieve an A-1 grade in their board exams or perform exceptionally well in our internal assessment tests.'
  },
  {
    q: 'What are the timing for classes?',
    a: 'Classes are generally held in two shifts: Afternoon (3:00 PM - 5:30 PM) and Evening (6:00 PM - 8:30 PM). Specific timings depend on your selected courses.'
  }
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <SectionHeader 
          title="Frequently Asked" 
          titleHighlight="Questions" 
          description="Find quick answers to common questions about our coaching programs, admissions, and policies."
          className="mb-12"
        />

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                className={cn(
                  'rounded-2xl border transition-all duration-300 overflow-hidden',
                  isOpen ? 'bg-primary/5 border-primary/20 shadow-md' : 'bg-card border-border hover:border-primary/20'
                )}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
                >
                  <span className="font-semibold text-lg pr-8 text-foreground">{faq.q}</span>
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300',
                    isOpen ? 'bg-primary text-white rotate-180' : 'bg-muted-bg text-muted'
                  )}>
                    <ChevronDown size={18} />
                  </div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-2 text-muted leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
