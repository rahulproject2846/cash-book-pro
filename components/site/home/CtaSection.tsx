import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#1A1A1A] px-8 py-20 text-center lg:px-20">
          <div className="relative z-10">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-white lg:text-5xl">
              Ready to build something exceptional?
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/70">
              Tell us about your project and we will craft a tailored plan that
              turns ambition into measurable outcomes.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/site/contact"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--site-accent)] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[var(--site-accent-hover)]"
              >
                Start a Conversation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/site/services"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                See Our Services
              </Link>
            </div>
          </div>
          {/* Decorative accent circle */}
          <div
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-10"
            style={{ backgroundColor: "var(--site-accent)" }}
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full opacity-5"
            style={{ backgroundColor: "var(--site-accent)" }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}
