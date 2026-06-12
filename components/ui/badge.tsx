import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        /** Neutral chip — general use */
        default: "rounded-md border-sheet-border bg-sheet-cream text-sheet-ink",
        secondary: "rounded-md border-transparent bg-[#ebe6dc] text-sheet-ink",
        outline: "rounded-md border-sheet-border bg-transparent text-sheet-ink",
        /** Instrument / primary facet — crisp contrast vs vibes */
        instrument:
          "rounded-md border-black/20 bg-white text-sheet-ink shadow-[0_1px_0_rgba(0,0,0,0.06)] ring-1 ring-black/5",
        /** Vibe / mood — soft purple pill (distinct from cream + instrument) */
        vibe: "rounded-full border border-sheet-accent/20 bg-sheet-accent/10 px-3 py-1 text-xs font-semibold text-[#5b21b6]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
