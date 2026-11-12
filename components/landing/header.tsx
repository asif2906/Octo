import { Suspense } from "react"
import { connection } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { OctoLogo } from "@/components/octo-logo"
import {
  HeaderAuthControls,
  MobileNav,
  type HeaderUser,
  type NavItem,
} from "@/components/landing/header-nav"

const LANDING_NAV_ITEMS: readonly NavItem[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

async function getAuthenticatedHeaderUser(): Promise<HeaderUser | null> {
  try {
    await connection()
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return null
    }

    const fullName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null

    const avatarUrl =
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null

    return {
      email: user.email,
      fullName,
      avatarUrl,
    }
  } catch {
    return null
  }
}

async function HeaderRightAsync() {
  const user = await getAuthenticatedHeaderUser()
  return (
    <>
      <HeaderAuthControls user={user} />
      <MobileNav user={user} navItems={LANDING_NAV_ITEMS} />
    </>
  )
}

function HeaderRightFallback() {
  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        <div className="h-8 w-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="size-9 animate-pulse rounded-lg bg-muted md:hidden" />
    </>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <OctoLogo />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 md:flex"
        >
          {LANDING_NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Suspense fallback={<HeaderRightFallback />}>
          <HeaderRightAsync />
        </Suspense>
      </div>
    </header>
  )
}

