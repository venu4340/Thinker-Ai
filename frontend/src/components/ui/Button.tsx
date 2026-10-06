import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'glow' | 'tealOutline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#27E6B5] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const variants = {
    primary: 'bg-gradient-to-r from-[#20D9B0] to-[#159FB5] text-[#03110F] font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 hover:brightness-105 border-0 active:scale-[0.98]',
    glow: 'bg-gradient-to-r from-[#20D9B0] via-[#19C7D9] to-[#8B5CF6] text-[#03110F] font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 border-0 active:scale-[0.98]',
    secondary: 'bg-[#101827] hover:bg-[#162236] text-[#F1F5F9] border border-slate-700/60 shadow-md active:scale-[0.98]',
    outline: 'border border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/60 text-slate-300 hover:text-white active:scale-[0.98]',
    tealOutline: 'border border-[#27E6B5]/30 hover:border-[#27E6B5]/60 hover:bg-[#27E6B5]/10 text-[#27E6B5] active:scale-[0.98]',
    danger: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 active:scale-[0.98]',
    ghost: 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
    icon: 'p-2',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};
