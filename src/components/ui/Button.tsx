'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'default';
  isLoading?: boolean;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary text-white hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0',
  secondary: 'bg-secondary text-white hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5',
  ghost: 'bg-transparent text-primary hover:bg-primary/10',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30',
};

const sizeStyles: Record<string, string> = {
  sm: 'text-xs px-4 py-2 rounded-lg',
  md: 'text-sm px-5 py-2.5 rounded-xl',
  default: 'text-sm px-5 py-2.5 rounded-xl',
  lg: 'text-base px-7 py-3.5 rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 size={16} className="animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
