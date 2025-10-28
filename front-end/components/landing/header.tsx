"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useStore } from "@/lib/store"

export function Header() {
  const isAuthenticated = useStore((state) => state.isAuthenticated)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-glow" />
          <span className="text-lg sm:text-xl font-bold">Gimme Idea</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            How It Works
          </Link>
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
            Discover
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <Button asChild size="sm" className="h-9 sm:h-10">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild size="sm" className="h-9 sm:h-10 px-3 sm:px-4">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-primary to-secondary h-9 sm:h-10 px-3 sm:px-4">
                <Link href="/auth/register">
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
