import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './utils';

export const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default'
    },
    variants: {
      size: {
        default: 'h-10 px-4 py-2',
        icon: 'h-10 w-10',
        sm: 'h-9 px-3'
      },
      variant: {
        default: 'bg-emerald-600 text-white hover:bg-emerald-700',
        ghost: 'hover:bg-slate-100 hover:text-slate-950',
        outline: 'border border-slate-300 bg-white hover:bg-slate-50',
        secondary: 'bg-slate-900 text-white hover:bg-slate-800'
      }
    }
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
};

export function Button({ asChild = false, className, size, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';

  return <Component className={cn(buttonVariants({ className, size, variant }))} {...props} />;
}
