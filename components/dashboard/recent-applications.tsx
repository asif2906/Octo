import Link from "next/link"
import { ArrowRight, Briefcase } from "lucide-react"
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
import type { ApplicationRow, ApplicationStatus } from "@/types/database"

const STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  no_reply: {
    label: "No Reply",
    className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200",
  },
  hired: {
    label: "Hired",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  },
}

export function RecentApplications({
  applications,
}: {
  applications: ApplicationRow[]
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>
            Your latest tracked roles and response statuses
          </CardDescription>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/applications" />}
          >
            View all
            <ArrowRight className="size-3.5" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
            <Briefcase className="size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No applications logged yet
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Add your first application to track statuses, notes, and follow-up dates.
            </p>
            <Button
              size="sm"
              className="mt-4"
              nativeButton={false}
              render={<Link href="/dashboard/applications" />}
            >
              Add Application
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {applications.map((app) => {
              const status = STATUS_META[app.status]
              return (
                <div
                  key={app.id}
                  className="flex flex-col justify-between gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {app.job_title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {app.company}
                      {app.location ? ` · ${app.location}` : ""} · Applied{" "}
                      {app.application_date}
                    </p>
                  </div>
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
