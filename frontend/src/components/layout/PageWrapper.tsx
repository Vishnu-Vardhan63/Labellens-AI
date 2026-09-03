import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function PageWrapper({ children, className = '', maxWidth = 'lg' }: PageWrapperProps) {
  return (
    <main className={['min-h-screen bg-white', className].join(' ')}>
      <div className={['mx-auto px-4 py-6 w-full', maxWidthClasses[maxWidth]].join(' ')}>
        {children}
      </div>
    </main>
  );
}
