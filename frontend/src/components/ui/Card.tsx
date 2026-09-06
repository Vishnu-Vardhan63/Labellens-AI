import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div
      className={[
        'bg-white border border-[#E2E8F0] rounded-xl shadow-xs transition-shadow',
        paddingClasses[padding],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
