import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Electric purple ("primary") is reserved for primary actions only (CLAUDE.md section 4).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-purple-600 text-white shadow-sm hover:bg-purple-700",
        secondary: "border border-sand-300 bg-sand-50 text-forest-900 hover:bg-sand-100",
        ghost: "text-forest-900 hover:bg-sand-100",
      },
      size: {
        md: "h-11 px-6",
        lg: "h-12 px-8 text-base",
        sm: "h-9 px-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
