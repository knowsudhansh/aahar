import { cn } from '@/lib/utils';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode
} from 'react';

export const Input = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      className={cn(
        'h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<'select'>>(
  ({ className, children, ...props }, ref) => (
    <select
      className={cn(
        'h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = 'Select';

export function Label({ className, ...props }: ComponentPropsWithoutRef<'label'>) {
  return (
    <label
      className={cn('text-sm font-medium leading-none text-slate-700', className)}
      {...props}
    />
  );
}

export function FieldError({ children }: Readonly<{ children?: ReactNode }>) {
  if (!children) {
    return null;
  }

  return <p className="text-sm font-medium text-red-600">{children}</p>;
}

interface FieldProps {
  children: ReactNode;
  error?: ReactNode;
  label: string;
  name: string;
}

export function Field({ children, error, label, name }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'danger' | 'neutral' | 'success';
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center rounded-full border px-2.5 text-xs font-semibold',
        variant === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        variant === 'danger' && 'border-red-200 bg-red-50 text-red-700',
        variant === 'neutral' && 'border-slate-200 bg-slate-100 text-slate-700',
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border bg-white shadow-sm shadow-slate-900/5', className)}
      {...props}
    />
  );
}
