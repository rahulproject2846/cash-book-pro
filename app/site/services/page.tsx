import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Target,
  Compass,
  Layers,
  Smartphone,
  TrendingUp,
  Shield,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react"

const services = [
  {
    icon: Target,
    title: "Brand Strategy",
    description:
      "Define your market position, messaging architecture, and growth roadmap through rigorous research and workshops.",
    features: [
      "Market & competitor analysis",
      "Brand positioning framework",
      "Messaging & voice guidelines",
      "Go-to-market planning",
    ],
  },
  {
    icon: Compass,
    title: "UX / UI Design",
    description:
      "User-centered interfaces that are as intuitive as they are beautiful, validated through testing and iteration.",
    features: [
      "User research & journey mapping",
      "Wireframing & prototyping",
      "Visual design systems",
      "Usability testing",
    ],
  },
  {
    icon: Layers,
    title: "Web Development",
    description:
      "Performant, accessible, and scalable web applications built with the latest frameworks and best practices.",
    features: [
      "Next.js & React applications",
      "Headless CMS integration",
      "API design & development",
      "Performance optimization",
    ],
  },
  {
    icon: Smartphone,
    title: "Mobile Apps",
    description:
      "Native-feel cross-platform apps that delight users and maintain a single codebase for efficiency.",
    features: [
      "React Native & Flutter",
      "Offline-first architecture",
      "Push notifications & deep linking",
      "App Store optimization",
    ],
  },
  {
    icon: TrendingUp,
    title: "Growth & Analytics",
    description:
      "Data pipelines and dashboards that give you actionable insight into what drives your business forward.",
    features: [
      "Analytics implementation",
      "A/B testing frameworks",
      "Conversion rate optimization",
      "Custom dashboards",
    ],
  },
  {
    icon: Shield,
    title: "DevOps & Security",
    description:
      "Infrastructure that scales automatically, stays secure, and lets your team ship with confidence.",
    features: [
      "CI/CD pipeline setup",
      "Cloud infrastructure (AWS / Vercel)",
      "Security audits & compliance",
      "Monitoring & alerting",
    ],
  },
]

const process = [
  {
    step: "01",
    title: "Discovery",
    description:
      "We immerse ourselves in your business, audience, and goals to uncover the real opportunity.",
  },
  {
    step: "02",
    title: "Strategy",
    description:
      "A clear plan of attack: timelines, milestones, and measurable KPIs aligned with your budget.",
  },
  {
    step: "03",
    title: "Create",
    description:
      "Design and development run in parallel sprints, with regular check-ins and transparent progress.",
  },
  {
    step: "04",
    title: "Launch & Grow",
    description:
      "We ship, measure, and iterate. Post-launch support ensures your product keeps improving.",
  },
]

export default function ServicesPage() {
  return (
    <div data-site className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--site-accent)]">
                  Our Services
                </p>
                <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-[var(--site-text)] lg:text-6xl">
                  Everything you need to{" "}
                  <span className="text-[var(--site-accent)]">ship great products</span>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-[var(--site-text-muted)]">
                  From initial strategy to post-launch optimization, we cover the
                  full spectrum so you can focus on running your business.
                </p>
                <Link
                  href="/site/contact"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--site-accent)] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[var(--site-accent-hover)]"
                >
                  Request a Proposal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="overflow-hidden rounded-3xl">
                <Image
                  src="/images/services-hero.jpg"
                  alt="Analytics dashboard displayed on a laptop in a professional setting"
                  width={800}
                  height={600}
                  priority
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="border-t border-[var(--site-border)] bg-[var(--site-card-bg)] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tight text-[var(--site-text)] lg:text-4xl">
                Full-spectrum capabilities
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--site-text-muted)]">
                Each engagement is tailored. Pick one service or combine them for
                an end-to-end partnership.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="group flex flex-col rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-8 transition-all hover:border-[var(--site-accent)] hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--site-accent)]/10 text-[var(--site-accent)] transition-colors group-hover:bg-[var(--site-accent)] group-hover:text-white">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-[var(--site-text)]">
                    {service.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--site-text-muted)]">
                    {service.description}
                  </p>
                  <ul className="mt-6 flex flex-col gap-2">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-[var(--site-text)]"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--site-accent)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--site-accent)]">
                Our Process
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[var(--site-text)] lg:text-4xl">
                How we get from idea to impact
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {process.map((item) => (
                <div
                  key={item.step}
                  className="relative rounded-2xl border border-[var(--site-border)] bg-[var(--site-card-bg)] p-8"
                >
                  <span className="text-4xl font-bold text-[var(--site-accent)]/20">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-[var(--site-text)]">
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

        {/* Pricing CTA */}
        <section className="border-t border-[var(--site-border)] bg-[var(--site-card-bg)] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="rounded-3xl bg-[#1A1A1A] px-8 py-16 lg:px-20">
              <div className="flex flex-col items-center gap-10 lg:flex-row lg:justify-between">
                <div className="max-w-lg">
                  <h2 className="text-balance text-3xl font-bold tracking-tight text-white lg:text-4xl">
                    Every project is unique.{" "}
                    <span className="text-[var(--site-accent)]">
                      So is our pricing.
                    </span>
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-white/70">
                    We scope each engagement based on your goals, timeline, and
                    budget. No hidden fees, no surprises.
                  </p>
                </div>
                <Link
                  href="/site/contact"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--site-accent)] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[var(--site-accent-hover)]"
                >
                  Get a Custom Quote
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
