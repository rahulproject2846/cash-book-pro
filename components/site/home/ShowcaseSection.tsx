import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const projects = [
  {
    label: "Fintech SaaS",
    title: "Reimagining digital banking for the next generation",
    metric: "+140% user engagement",
    color: "bg-[#1A1A1A]",
    textColor: "text-white",
  },
  {
    label: "E-Commerce",
    title: "A luxury retail experience built for conversion",
    metric: "3.2x revenue lift",
    color: "bg-[var(--site-accent)]",
    textColor: "text-white",
  },
  {
    label: "Health Tech",
    title: "Patient-first platform serving 2M+ users",
    metric: "99.9% uptime",
    color: "bg-[var(--site-surface)]",
    textColor: "text-[var(--site-text)]",
  },
]

export function ShowcaseSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--site-accent)]">
              Selected Work
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[var(--site-text)] lg:text-5xl">
              Projects that moved the needle
            </h2>
          </div>
          <Link
            href="/site/services"
            className="flex items-center gap-1 text-sm font-semibold text-[var(--site-accent)] hover:underline"
          >
            View all work
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.title}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl ${project.color} p-8 min-h-[320px] transition-transform hover:scale-[1.02]`}
            >
              <div>
                <span
                  className={`inline-block rounded-full border border-current/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${project.textColor} opacity-70`}
                >
                  {project.label}
                </span>
                <h3
                  className={`mt-6 text-balance text-xl font-bold leading-snug ${project.textColor}`}
                >
                  {project.title}
                </h3>
              </div>
              <p
                className={`mt-8 text-2xl font-bold ${project.textColor}`}
              >
                {project.metric}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
