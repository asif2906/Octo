"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, Plus, Sparkles, LogOut, User, CreditCard, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PLAN_DEFINITIONS, type UsageSummary } from "@/lib/plans"

interface DashboardHeaderProps {
  fullName: string | null
  email: string
  usage: UsageSummary
  onOpenMobileMenu: () => void
}

function getInitials(fullName: string | null, email: string): string {
  const source = fullName?.trim() || email
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export function DashboardHeader({
  fullName,
  email,
  usage,
  onOpenMobileMenu,
}: DashboardHeaderProps) {
  const router = useRouter()
  const planDef = PLAN_DEFINITIONS[usage.plan]
  const displayName = fullName?.trim() || email

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6 print:hidden">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onOpenMobileMenu}
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-4" />
        </Button>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-muted-foreground">
            Workspace
          </span>
          <Link href="/dashboard/subscription">
            <Badge variant={usage.plan === "free" ? "outline" : "default"}>
              {planDef.name} Plan
            </Badge>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          nativeButton={false}
          render={<Link href="/dashboard/resumes/tailor" />}
        >
          <Sparkles className="size-3.5" />
          Tailor Resume
        </Button>

        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/resumes/new" />}
        >
          <Plus className="size-3.5" />
          New Resume
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-full border border-border p-1 pr-2.5 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Account menu"
          >
            <Avatar className="size-7">
              <AvatarFallback className="text-xs font-semibold">
                {getInitials(fullName, email)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-xs font-medium md:inline">
              {displayName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="border-b border-border px-2.5 py-2">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/subscription")}>
              <CreditCard className="size-4" />
              Subscription
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => window.location.assign("/logout")}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
