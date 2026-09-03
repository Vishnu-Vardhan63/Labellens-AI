import React from 'react';

type Status = 'success' | 'warning' | 'error' | 'processing' | 'idle';

const dotClasses: Record<Status, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  processing: 'bg-accent animate-pulse',
  idle: 'bg-gray-300',
};

export function StatusDot({ status }: { status: Status }) {
  return (
    <span
      className={['w-2 h-2 rounded-full inline-block', dotClasses[status]].join(' ')}
      aria-hidden
    />
  );
}
