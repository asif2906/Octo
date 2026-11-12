import Link from "next/link"
import { cn } from "cn"

interface OctoLogoProps {
  href?: string
  inverted?: boolean
  className?: string
}

export function OctoLogo({
  href = "/",
  inverted = false,
  className,
}: OctoLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 text-base font-semibold tracking-tight transition-opacity hover:opacity-85",
        inverted ? "text-white" : "text-foreground",
        className
      )}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-lg border shadow-xs",
          inverted
            ? "border-white/15 bg-white text-zinc-950"
            : "border-zinc-900/10 bg-zinc-950 text-white dark:border-white/15 dark:bg-white dark:text-zinc-950"
        )}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <circle cx="12" cy="9.5" r="5" stroke="currentColor" strokeWidth="2.1" />
          <path
            d="M7 14.5c-1.8 1.4-2.5 3.2-2.2 5M10 14.5c-.4 1.8-.3 3.5.3 5M14 14.5c.4 1.8.3 3.5-.3 5M17 14.5c1.8 1.4 2.5 3.2 2.2 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>
        Octo<span className={inverted ? "text-zinc-400" : "text-muted-foreground"}>.tech</span>
      </span>
    </Link>
  )
}

