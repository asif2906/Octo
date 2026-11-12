import { Activity } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ActivityLogRow } from "@/types/database"

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function RecentActivity({ logs }: { logs: ActivityLogRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Real actions recorded across your workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
            <Activity className="size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No activity recorded yet
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Actions like saving your profile, creating resumes, or logging applications appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-start justify-between gap-3 border-b border-border pb-3 text-sm last:border-b-0 last:pb-0"
              >
                <span className="text-foreground">{log.description}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

