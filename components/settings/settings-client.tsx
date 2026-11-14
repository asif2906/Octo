"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getTimezoneOptions } from "@/lib/timezones"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ProfileRow } from "@/types/database"

export function SettingsClient({
  email,
  profile,
}: {
  email: string
  profile: ProfileRow
}) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [timezone, setTimezone] = React.useState(profile.timezone || "UTC")
  const [savingTz, setSavingTz] = React.useState(false)
  const [sendingReset, setSendingReset] = React.useState(false)

  const timezoneOptions = React.useMemo(
    () => getTimezoneOptions(timezone),
    [timezone]
  )

  async function handleSaveTimezone(e: React.FormEvent) {
    e.preventDefault()
    setSavingTz(true)
    const { error } = await supabase
      .from("profiles")
      .update({ timezone, updated_at: new Date().toISOString() })
      .eq("id", profile.id)
    setSavingTz(false)

    if (error) {
      toast({
        title: "Failed to update timezone",
        description: error.message,
        variant: "error",
      })
      return
    }
    toast({
      title: "Timezone saved",
      description: `Daily usage counters now reset according to ${timezone}.`,
      variant: "success",
    })
    router.refresh()
  }

  async function handleSendPasswordReset() {
    if (!email) return
    setSendingReset(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setSendingReset(false)

    if (error) {
      toast({
        title: "Could not send password reset email",
        description: error.message,
        variant: "error",
      })
      return
    }
    toast({
      title: "Password reset email sent",
      description: `Check ${email} for the verification link.`,
      variant: "success",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure workspace preferences, quota reset timezone, and account security.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timezone & Quota Reset</CardTitle>
          <CardDescription>
            Used by the server to calculate daily application limits and weekly outreach windows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSaveTimezone}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="max-w-sm flex-1 space-y-1.5">
              <Label htmlFor="settings-timezone">Preferred Timezone</Label>
              <Select
                id="settings-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={savingTz}>
              {savingTz ? "Saving..." : "Update Timezone"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account & Security</CardTitle>
          <CardDescription>Signed in as {email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={sendingReset}
            onClick={handleSendPasswordReset}
          >
            {sendingReset ? "Sending email..." : "Send Password Reset Email"}
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/profile" />}
          >
            Edit Profile Info
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => window.location.assign("/logout")}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations & External Services</CardTitle>
          <CardDescription>
            Manage optional Google account connections for Gmail and Google Calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg border border-border/80 bg-muted/20 gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Gmail Application Emailer</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send application drafts from your email address. Default fallback uses zero-cost direct mail application links with attachments.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                Native Mailer Active
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg border border-border/80 bg-muted/20 gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Google Calendar Synchronization</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Keep upcoming interview schedules synchronized with dashboard calendar and reminders.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                Dashboard Calendar Synced
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management & Privacy</CardTitle>
          <CardDescription>
            Download your full career profile, cover letters, and application history or manage data privacy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your data is strictly isolated and never used to train third-party AI models. You have complete control to export your structured JSON record at any time.
          </p>
          <div className="flex items-center gap-3">
            <a href="/api/user/export" download>
              <Button variant="outline" size="sm" className="gap-2">
                Download Career Data (JSON)
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
