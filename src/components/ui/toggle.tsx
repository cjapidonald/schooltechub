import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-lg border-2 border-transparent bg-transparent text-sm font-semibold text-muted-foreground ring-offset-background transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-primary/15 data-[state=on]:text-primary data-[state=on]:shadow-[0_0_15px_hsl(var(--glow-primary)/0.25)]",
  {
    variants: {
      variant: {
        default: "",
        outline: "bg-background/80",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
