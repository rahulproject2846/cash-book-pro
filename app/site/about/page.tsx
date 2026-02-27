import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Award, Users, Globe, Zap } from "lucide-react"

const stats = [
  { value: "120+", label: "Projects delivered" },
  { value: "40+", label: "Global clients" },
  { value: "12", label: "Team members" },
  { value: "8", label: "Years of experience" },
]

const values = [
  {
    icon: Award,
    title: "Craftsmanship",
    description:
      "We believe great work comes from sweating the details. Every decision, from type hierarchy to code architecture, is intentional.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "The best outcomes emerge when disciplines converge. Strategy, design, and engineering work shoulder to shoulder.",
  },
  {
    icon: Globe,
    title: "Impact",
    description:
      "We measure success not by deliverables, but by the tangible business results our work creates for our clients.",
  },
  {
    icon: Zap,
    title: "Velocity",
    description:
      "Speed without compromise. We ship fast through refined processes, clear communication, and modern tooling.",
  },
]

const team = [
  { name: "Alex Morgan", role: "Founder & Strategist", initial: "AM" },
  { name: "Priya Sharma", role: "Design Director", initial: "PS" },
  { name: "Lucas Kim", role: "Lead Engineer", initial: "LK" },
  { name: "Nina Okoye", role: "Project Lead", initial: "NO" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--site-accent)]">
                  About Us
                </p>
                <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-[var(--site-text)] lg:text-6xl">
                  We are a studio for the{" "}
                  <span className="text-[var(--site-accent)]">ambitious</span>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-[var(--site-text-muted)]">
                  Apex Studio was founded on a simple belief: exceptional digital
                  experiences are the ultimate growth lever. We combine strategy,
                  design, and engineering to help brands lead, not follow.
                </p>
              </div>
              <div className="overflow-hidden rounded-3xl">
                <Image
                  src="/images/about-team.jpg"
                  alt="The Apex Studio team collaborating in a bright modern workspace"
                  width={800}
                  height={600}
                  priority
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-[var(--site-border)] bg-[var(--site-card-bg)] py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-4xl font-bold text-[var(--site-accent)] lg:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-[var(--site-text-muted)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--site-accent)]">
                Our Values
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[var(--site-text)] lg:text-4xl">
                Principles that guide every decision
              </h2>
            </div>
            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-card-bg)] p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--site-accent)]/10 text-[var(--site-accent)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[var(--site-text)]">
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

        {/* Team */}
        <section className="border-t border-[var(--site-border)] bg-[var(--site-card-bg)] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--site-accent)]">
                The Team
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[var(--site-text)] lg:text-4xl">
                Meet the people behind the craft
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--site-text-muted)]">
                A tight-knit, cross-disciplinary crew of strategists, designers,
                and engineers dedicated to building things that matter.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((person) => (
                <div
                  key={person.name}
                  className="group rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-8 text-center transition-all hover:border-[var(--site-accent)] hover:shadow-lg"
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--site-accent)]/10 text-xl font-bold text-[var(--site-accent)] transition-colors group-hover:bg-[var(--site-accent)] group-hover:text-white">
                    {person.initial}
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[var(--site-text)]">
                    {person.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--site-text-muted)]">
                    {person.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="rounded-3xl bg-[#1A1A1A] px-8 py-16 text-center lg:px-20">
              <h2 className="mx-auto max-w-xl text-balance text-3xl font-bold tracking-tight text-white lg:text-4xl">
                Want to work with us?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/70">
                We are always looking for the next great challenge. Tell us about
                yours.
              </p>
              <Link
                href="/site/contact"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--site-accent)] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[var(--site-accent-hover)]"
              >
                Get in Touch
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
