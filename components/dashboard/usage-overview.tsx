import Link from "next/link"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PLAN_DEFINITIONS, type UsageSummary } from "@/lib/plans"

function UsageMeter({
  label,
  used,
  limit,
  suffix,
  disabledNote,
}: {
  label: string
  used: number
  limit: number
  suffix: string
  disabledNote?: string
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {disabledNote ?? `${used} / ${limit} ${suffix}`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: disabledNote ? "0%" : `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function UsageOverview({ usage }: { usage: UsageSummary }) {
  const planDef = PLAN_DEFINITIONS[usage.plan]

  return (
    <Card>
      <CardHeader>
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Plan & Usage Limits</CardTitle>
            <Badge variant="default" className="capitalize">
              {planDef.name} Plan
            </Badge>
          </div>
          <CardDescription>
            Server-tracked limits using your profile timezone ({usage.timezone})
          </CardDescription>
        </div>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/subscription" />}
          >
            Manage Plan
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageMeter
          label="Applications"
          used={usage.applicationsUsedToday}
          limit={usage.applicationsDailyLimit}
          suffix="today"
        />
        <UsageMeter
          label="Cold Outreach"
          used={usage.coldEmailsUsedInPeriod}
          limit={usage.coldEmailsLimit}
          suffix="today"
        />
        <UsageMeter
          label="AI Resume Tailoring"
          used={usage.aiTailoringUsedToday}
          limit={usage.aiTailoringDailyLimit}
          suffix="today (soft limit)"
          disabledNote={
            usage.aiTailoringEnabled
              ? undefined
              : "Active subscription required"
          }
        />
      </CardContent>
    </Card>
  )
}
