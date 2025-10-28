import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="animate-float">
            <Sparkles className="w-24 h-24 mb-8" />
          </div>
          <h2 className="text-4xl font-bold mb-4 text-center">Welcome Back</h2>
          <p className="text-xl text-center max-w-md opacity-90">
            Continue your journey of building amazing Web3 projects with AI-powered feedback
          </p>

          {/* Testimonials */}
          <div className="mt-12 space-y-6 max-w-md">
            <div className="glass p-6 rounded-xl">
              <p className="text-sm mb-2">"The AI feedback helped me improve my project significantly!"</p>
              <p className="text-xs opacity-75">- Sarah Chen, DeFi Builder</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-sm mb-2">"Best platform for getting quality feedback on Web3 projects."</p>
              <p className="text-xs opacity-75">- Mike Johnson, NFT Creator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold">Gimme Idea</span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Sign in to your account</h1>
            <p className="text-muted-foreground">Enter your credentials to continue</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
