import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glow = false, interactive = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl bg-[#0C1220]/80 border border-slate-800/80 backdrop-blur-xl p-5 text-slate-100 shadow-xl transition-all duration-200',
          glow && 'border-[#27E6B5]/30 shadow-lg shadow-[#27E6B5]/10',
          interactive && 'hover:bg-[#101827] hover:border-[#27E6B5]/30 hover:-translate-y-0.5 hover:shadow-2xl cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
