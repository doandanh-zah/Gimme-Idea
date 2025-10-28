import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary via-primary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="animate-float">
            <Sparkles className="w-24 h-24 mb-8" />
          </div>
          <h2 className="text-4xl font-bold mb-4 text-center">Join Gimme Idea</h2>
          <p className="text-xl text-center max-w-md opacity-90">
            Get AI-powered feedback on your Web3 projects and connect with a community of builders
          </p>

          {/* Features */}
          <div className="mt-12 space-y-4 max-w-md">
            <div className="glass p-4 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold text-sm">AI-Powered Reviews</p>
                <p className="text-xs opacity-75">Get instant feedback from advanced AI</p>
              </div>
            </div>
            <div className="glass p-4 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold text-sm">Community Feedback</p>
                <p className="text-xs opacity-75">Connect with other Web3 builders</p>
              </div>
            </div>
            <div className="glass p-4 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">✓</div>
              <div>
                <p className="font-semibold text-sm">Wallet Integration</p>
                <p className="text-xs opacity-75">Optional wallet connection for tipping</p>
              </div>
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
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-muted-foreground">Start getting feedback on your projects</p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
