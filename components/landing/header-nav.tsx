"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "cn"

export interface HeaderUser {
  email: string
  fullName?: string | null
  avatarUrl?: string | null
}

export interface NavItem {
  label: string
  href: string
}

function getUserInitials(user: HeaderUser): string {
  const source = user.fullName?.trim() || user.email
  if (!source) return "OT"

  if (user.fullName?.trim()) {
    const parts = user.fullName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

export function HeaderAuthControls({ user }: { user: HeaderUser | null }) {
  if (!user) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          )}
        >
          Login
        </Link>
        <Link
          href="/signup"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "h-8 px-3.5 text-sm font-medium"
          )}
        >
          Get Started
        </Link>
      </div>
    )
  }

  const displayName = user.fullName?.trim() || user.email.split("@")[0]
  const initials = getUserInitials(user)

  return (
    <div className="hidden items-center md:flex">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="flex items-center gap-2 rounded-full border border-border/80 bg-background py-1 pr-2.5 pl-1 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar size="sm">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-zinc-900 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[130px] truncate text-xs font-medium text-foreground">
            {displayName}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-56! p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1.5 font-normal">
              <div className="flex flex-col space-y-0.5">
                {user.fullName ? (
                  <p className="truncate text-xs font-medium text-foreground">
                    {user.fullName}
                  </p>
                ) : null}
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard" />} className="cursor-pointer">
              <LayoutDashboard className="size-4 text-muted-foreground" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => window.location.assign("/logout")}
              className="cursor-pointer"
            >
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function MobileNav({
  user,
  navItems,
}: {
  user: HeaderUser | null
  navItems: readonly NavItem[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background text-foreground transition-colors hover:bg-muted"
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full border-b border-border bg-background/95 px-4 pt-3 pb-5 shadow-lg backdrop-blur-md sm:px-6">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-4 border-t border-border pt-4">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 px-2 py-1">
                  <Avatar size="sm">
                    {user.avatarUrl ? (
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user.fullName || user.email}
                      />
                    ) : null}
                    <AvatarFallback className="bg-zinc-900 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    {user.fullName ? (
                      <p className="truncate text-xs font-medium text-foreground">
                        {user.fullName}
                      </p>
                    ) : null}
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-9 justify-center"
                    )}
                  >
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Link>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => window.location.assign("/logout")}
                    className="h-9 justify-center"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-9 justify-center"
                  )}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "h-9 justify-center"
                  )}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

