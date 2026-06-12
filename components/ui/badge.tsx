import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/formatting"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-green-100 text-green-800 border-green-200",
        sale: "bg-orange-100 text-orange-800 border-orange-200",
        secondary: "bg-gray-100 text-gray-700 border-gray-200",
        premium: "bg-amber-100 text-amber-800 border-amber-200",
        family: "bg-purple-100 text-purple-800 border-purple-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
