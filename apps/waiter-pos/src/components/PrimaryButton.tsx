import type { ButtonHTMLAttributes } from 'react';

export function PrimaryButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-primary py-4 text-lg font-semibold text-white transition-colors active:bg-primary-dark disabled:opacity-40 ${className}`}
    />
  );
}
