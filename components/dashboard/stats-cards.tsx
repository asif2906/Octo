import {
  Briefcase,
  Clock,
  XCircle,
  Trophy,
  Gauge,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UsageSummary } from "@/lib/plans"

interface StatsCardsProps {
  totalApplications: number
  pendingReplies: number
  rejections: number
  hires: number
  usage: UsageSummary
}

export function StatsCards({
  totalApplications,
  pendingReplies,
  rejections,
  hires,
  usage,
}: StatsCardsProps) {
  const remainingToday = Math.max(
    0,
    usage.applicationsDailyLimit - usage.applicationsUsedToday
  )

  const items = [
    {
      label: "Applications Sent",
      value: String(totalApplications),
      subtext: "Total tracked applications",
      icon: Briefcase,
    },
    {
      label: "Pending Replies",
      value: String(pendingReplies),
      subtext: "Awaiting employer response",
      icon: Clock,
    },
    {
      label: "Rejections",
      value: String(rejections),
      subtext:
        totalApplications > 0
          ? `${Math.round((rejections / totalApplications) * 100)}% of total`
          : "No applications yet",
      icon: XCircle,
    },
    {
      label: "Hires",
      value: String(hires),
      subtext:
        totalApplications > 0
          ? `${Math.round((hires / totalApplications) * 100)}% success rate`
          : "No applications yet",
      icon: Trophy,
    },
    {
      label: "Daily Quota Left",
      value: `${remainingToday}/${usage.applicationsDailyLimit}`,
      subtext: `${usage.applicationsUsedToday} used today (${usage.timezone})`,
      icon: Gauge,
    },
  ]

  return (
    <section
      aria-label="Application statistics"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label} size="sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight text-foreground">
                {item.value}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {item.subtext}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}

