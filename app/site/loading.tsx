export default function SiteLoading() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      {/* Header skeleton */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--site-border)] bg-[var(--site-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="site-skeleton h-9 w-9 rounded-lg" />
            <div className="site-skeleton h-5 w-28 rounded-md" />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="site-skeleton h-9 w-16 rounded-full" />
            <div className="site-skeleton h-9 w-16 rounded-full" />
            <div className="site-skeleton h-9 w-20 rounded-full" />
            <div className="site-skeleton h-9 w-18 rounded-full" />
          </div>
          <div className="hidden md:block">
            <div className="site-skeleton h-10 w-28 rounded-full" />
          </div>
          <div className="site-skeleton h-10 w-10 rounded-full md:hidden" />
        </div>
      </header>

      <main>
        {/* Hero skeleton */}
        <section className="pt-32 pb-20 lg:pt-44 lg:pb-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div className="max-w-xl">
                <div className="site-skeleton h-4 w-32 rounded-md" />
                <div className="mt-6 site-skeleton h-12 w-full rounded-xl lg:h-16" />
                <div className="mt-3 site-skeleton h-12 w-4/5 rounded-xl lg:h-16" />
                <div className="mt-8 site-skeleton h-5 w-full rounded-md" />
                <div className="mt-2 site-skeleton h-5 w-3/4 rounded-md" />
                <div className="mt-10 flex gap-4">
                  <div className="site-skeleton h-12 w-40 rounded-full" />
                  <div className="site-skeleton h-12 w-28 rounded-full" />
                </div>
              </div>
              <div className="site-skeleton aspect-[4/3] w-full rounded-3xl" />
            </div>
          </div>
        </section>

        {/* Pillars skeleton */}
        <section className="border-t border-[var(--site-border)] bg-[var(--site-card-bg)] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <div className="site-skeleton h-4 w-24 rounded-md" />
              <div className="mt-4 site-skeleton h-10 w-80 rounded-xl" />
              <div className="mt-3 site-skeleton h-5 w-64 rounded-md" />
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-8"
                >
                  <div className="site-skeleton h-12 w-12 rounded-xl" />
                  <div className="mt-6 site-skeleton h-5 w-24 rounded-md" />
                  <div className="mt-3 site-skeleton h-4 w-full rounded-md" />
                  <div className="mt-2 site-skeleton h-4 w-3/4 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Showcase skeleton */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div>
                <div className="site-skeleton h-4 w-24 rounded-md" />
                <div className="mt-4 site-skeleton h-10 w-72 rounded-xl" />
              </div>
              <div className="site-skeleton h-5 w-24 rounded-md" />
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="site-skeleton min-h-[320px] rounded-3xl"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials skeleton */}
        <section className="border-t border-[var(--site-border)] bg-[var(--site-card-bg)] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <div className="site-skeleton h-4 w-24 rounded-md" />
              <div className="mt-4 site-skeleton h-8 w-64 rounded-xl" />
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-8"
                >
                  <div className="site-skeleton h-4 w-full rounded-md" />
                  <div className="mt-2 site-skeleton h-4 w-full rounded-md" />
                  <div className="mt-2 site-skeleton h-4 w-2/3 rounded-md" />
                  <div className="mt-6 flex items-center gap-3">
                    <div className="site-skeleton h-10 w-10 rounded-full" />
                    <div>
                      <div className="site-skeleton h-4 w-24 rounded-md" />
                      <div className="mt-1 site-skeleton h-3 w-32 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA skeleton */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="site-skeleton h-64 w-full rounded-3xl" />
          </div>
        </section>
      </main>

      {/* Footer skeleton */}
      <footer className="border-t border-[var(--site-border)] bg-[var(--site-bg)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="site-skeleton h-9 w-9 rounded-lg" />
                <div className="site-skeleton h-5 w-28 rounded-md" />
              </div>
              <div className="mt-4 site-skeleton h-4 w-full rounded-md" />
              <div className="mt-2 site-skeleton h-4 w-3/4 rounded-md" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="site-skeleton h-3 w-20 rounded-md" />
                <div className="mt-5 flex flex-col gap-3">
                  <div className="site-skeleton h-4 w-16 rounded-md" />
                  <div className="site-skeleton h-4 w-20 rounded-md" />
                  <div className="site-skeleton h-4 w-18 rounded-md" />
                  <div className="site-skeleton h-4 w-14 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
