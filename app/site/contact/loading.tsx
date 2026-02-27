export default function ContactLoading() {
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
        <section className="pt-32 pb-12 lg:pt-44 lg:pb-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto flex max-w-2xl flex-col items-center">
              <div className="site-skeleton h-4 w-16 rounded-md" />
              <div className="mt-6 site-skeleton h-12 w-80 rounded-xl lg:h-14" />
              <div className="mt-5 site-skeleton h-5 w-96 max-w-full rounded-md" />
              <div className="mt-2 site-skeleton h-5 w-72 rounded-md" />
            </div>
          </div>
        </section>

        {/* Form + info skeleton */}
        <section className="pb-20 lg:pb-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
              {/* Form skeleton */}
              <div className="lg:col-span-3">
                <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-card-bg)] p-8 lg:p-12">
                  <div className="site-skeleton h-6 w-32 rounded-md" />
                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <div className="site-skeleton h-3 w-20 rounded-md" />
                      <div className="site-skeleton h-12 w-full rounded-xl" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="site-skeleton h-3 w-20 rounded-md" />
                      <div className="site-skeleton h-12 w-full rounded-xl" />
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-2">
                    <div className="site-skeleton h-3 w-12 rounded-md" />
                    <div className="site-skeleton h-12 w-full rounded-xl" />
                  </div>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <div className="site-skeleton h-3 w-20 rounded-md" />
                      <div className="site-skeleton h-12 w-full rounded-xl" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="site-skeleton h-3 w-24 rounded-md" />
                      <div className="site-skeleton h-12 w-full rounded-xl" />
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-2">
                    <div className="site-skeleton h-3 w-16 rounded-md" />
                    <div className="site-skeleton h-32 w-full rounded-xl" />
                  </div>
                  <div className="mt-6 site-skeleton h-12 w-28 rounded-full" />
                </div>
              </div>

              {/* Info sidebar skeleton */}
              <div className="flex flex-col gap-6 lg:col-span-2">
                <div className="site-skeleton h-52 w-full rounded-3xl lg:h-64" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-2xl border border-[var(--site-border)] bg-[var(--site-card-bg)] p-6"
                  >
                    <div className="site-skeleton h-10 w-10 shrink-0 rounded-xl" />
                    <div className="flex-1">
                      <div className="site-skeleton h-4 w-20 rounded-md" />
                      <div className="mt-2 site-skeleton h-4 w-40 rounded-md" />
                      <div className="mt-1 site-skeleton h-3 w-32 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
