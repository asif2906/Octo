import Link from "next/link"
import { XCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <XCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Checkout was cancelled.
          </h1>
          <p className="text-sm text-muted-foreground">
            No payment was processed and no subscription was created. You can resume and select a plan whenever you&apos;re ready.
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-2">
          <Button
            nativeButton={false}
            render={<Link href="/pricing" />}
            size="lg"
            className="w-full gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Pricing
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/" />}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
