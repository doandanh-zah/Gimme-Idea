import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Ready to get feedback on your project?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join hundreds of Web3 builders who are improving their projects with AI-powered feedback
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <Link href="/auth/register">
                Start For Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg bg-transparent">
              <Link href="/dashboard">Browse Projects</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">No credit card required. 5 free AI reviews included.</p>
        </div>
      </div>
    </section>
  )
}
