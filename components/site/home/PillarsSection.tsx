import { Lightbulb, Paintbrush, Code, BarChart3 } from "lucide-react"

const pillars = [
  {
    icon: Lightbulb,
    title: "Strategy",
    description:
      "We define clear roadmaps grounded in research, market analysis, and your unique business objectives.",
  },
  {
    icon: Paintbrush,
    title: "Design",
    description:
      "Interfaces that feel intuitive and look exceptional. Every pixel serves a purpose.",
  },
  {
    icon: Code,
    title: "Development",
    description:
      "Clean, performant code built with modern frameworks that scale as your audience grows.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Data-driven insights that refine strategy and maximize the return on every decision.",
  },
]

export function PillarsSection() {
  return (
    <section className="border-t border-[var(--site-border)] bg-[var(--site-card-bg)] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--site-accent)]">
            What We Do
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[var(--site-text)] lg:text-5xl">
            Four pillars of digital excellence
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--site-text-muted)]">
            A full-spectrum approach that covers every stage of the product
            lifecycle.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-8 transition-all hover:border-[var(--site-accent)] hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--site-accent)]/10 text-[var(--site-accent)] transition-colors group-hover:bg-[var(--site-accent)] group-hover:text-white">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-[var(--site-text)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--site-text-muted)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
