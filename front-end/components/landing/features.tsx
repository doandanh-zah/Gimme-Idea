import { Brain, Users, Zap, Shield, TrendingUp, Wallet } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Reviews",
    description:
      "Get instant, comprehensive feedback from advanced AI that analyzes your project's strengths and areas for improvement",
    color: "text-primary",
  },
  {
    icon: Users,
    title: "Community Feedback",
    description: "Connect with experienced Web3 builders who provide valuable insights and constructive criticism",
    color: "text-secondary",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Receive AI feedback in seconds, not days. Iterate quickly and improve your project at the speed of thought",
    color: "text-accent",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your projects are protected with enterprise-grade security. Control who sees your work",
    color: "text-success",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Monitor your project's improvement over time with detailed analytics and feedback history",
    color: "text-primary",
  },
  {
    icon: Wallet,
    title: "Tip Contributors",
    description:
      "Show appreciation for valuable feedback by tipping contributors with crypto directly through the platform",
    color: "text-secondary",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need to succeed</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you build better Web3 projects
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
