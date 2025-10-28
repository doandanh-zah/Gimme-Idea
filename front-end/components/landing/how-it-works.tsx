import { Upload, Sparkles, MessageSquare, TrendingUp } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "Submit Your Project",
    description: "Upload your Web3 project with details about what you're building and what feedback you need",
    step: "01",
  },
  {
    icon: Sparkles,
    title: "Get AI Analysis",
    description: "Our advanced AI reviews your project instantly, providing detailed insights and suggestions",
    step: "02",
  },
  {
    icon: MessageSquare,
    title: "Community Feedback",
    description: "Receive additional feedback from experienced builders in the Web3 community",
    step: "03",
  },
  {
    icon: TrendingUp,
    title: "Iterate & Improve",
    description: "Apply the feedback, improve your project, and track your progress over time",
    step: "04",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How it works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get feedback on your project in four simple steps
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  {/* Step number */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white mb-6 relative z-10">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-card border-2 border-primary/20 flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
