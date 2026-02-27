import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Copy */}
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--site-accent)]">
              Digital Consultancy
            </p>
            <h1 className="mt-4 text-balance text-5xl font-bold leading-[1.1] tracking-tight text-[var(--site-text)] lg:text-7xl">
              Craft with purpose.{" "}
              <span className="text-[var(--site-accent)]">Scale</span> with
              precision.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--site-text-muted)]">
              We partner with ambitious brands to design and build digital
              products that deliver measurable impact from strategy through launch
              and beyond.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/site/services"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--site-accent)] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[var(--site-accent-hover)]"
              >
                Explore Services
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/site/about"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] px-6 py-3.5 text-sm font-semibold text-[var(--site-text)] transition-all hover:bg-[var(--site-surface)]"
              >
                Our Story
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl">
              <Image
                src="/images/hero-desk.jpg"
                alt="Modern workspace with financial analytics on a laptop screen"
                width={800}
                height={600}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-[var(--site-card-bg)] p-5 shadow-xl lg:-bottom-8 lg:-left-10">
              <p className="text-3xl font-bold text-[var(--site-accent)]">97%</p>
              <p className="mt-1 text-xs text-[var(--site-text-muted)]">Client satisfaction rate</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
