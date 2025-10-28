"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 animate-gradient" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI-Powered Project Feedback Platform</span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-bold mb-6 text-balance animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          Where Ideas Meet{" "}
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Intelligence
          </span>
        </h1>

        <p
          className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-pretty animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Get instant AI-powered feedback on your Web3 projects and connect with a community of builders who care about
          your success
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <Button
            asChild
            size="lg"
            className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <Link href="/auth/register">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg glass bg-transparent">
            <Link href="/dashboard">Explore Projects</Link>
          </Button>
        </div>

        {/* Stats */}
        <div
          className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="glass p-6 rounded-xl">
            <div className="text-3xl font-bold text-primary mb-1">1000+</div>
            <div className="text-sm text-muted-foreground">Projects Reviewed</div>
          </div>
          <div className="glass p-6 rounded-xl">
            <div className="text-3xl font-bold text-secondary mb-1">500+</div>
            <div className="text-sm text-muted-foreground">Active Builders</div>
          </div>
          <div className="glass p-6 rounded-xl">
            <div className="text-3xl font-bold text-accent mb-1">95%</div>
            <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </section>
  )
}
