const testimonials = [
  {
    quote:
      "Apex Studio transformed our vision into a product our users genuinely love. The attention to detail was extraordinary.",
    author: "Sarah Chen",
    role: "CEO, Luminary Finance",
  },
  {
    quote:
      "Their strategic approach saved us months of trial and error. The results speak for themselves: tripled conversions in 90 days.",
    author: "Marcus Rivera",
    role: "Head of Product, NovaBrand",
  },
  {
    quote:
      "Working with Apex felt like an extension of our own team. They understood our market and delivered beyond expectations.",
    author: "Emily Tanaka",
    role: "Founder, Healthwise",
  },
]

export function TestimonialsSection() {
  return (
    <section className="border-t border-[var(--site-border)] bg-[var(--site-card-bg)] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--site-accent)]">
            Testimonials
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[var(--site-text)] lg:text-4xl">
            Trusted by ambitious teams
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              key={item.author}
              className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-8"
            >
              <blockquote>
                <p className="text-sm leading-relaxed text-[var(--site-text)]">
                  {`"${item.quote}"`}
                </p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--site-accent)]/10 text-sm font-bold text-[var(--site-accent)]">
                  {item.author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--site-text)]">
                    {item.author}
                  </p>
                  <p className="text-xs text-[var(--site-text-muted)]">
                    {item.role}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
