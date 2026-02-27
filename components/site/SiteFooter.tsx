import Link from "next/link"

const footerLinks = {
  Navigation: [
    { href: "/site", label: "Home" },
    { href: "/site/about", label: "About" },
    { href: "/site/services", label: "Services" },
    { href: "/site/contact", label: "Contact" },
  ],
  Services: [
    { href: "/site/services", label: "Strategy" },
    { href: "/site/services", label: "Design" },
    { href: "/site/services", label: "Development" },
    { href: "/site/services", label: "Analytics" },
  ],
  Connect: [
    { href: "#", label: "LinkedIn" },
    { href: "#", label: "Twitter" },
    { href: "#", label: "Dribbble" },
    { href: "#", label: "GitHub" },
  ],
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--site-border)] bg-[var(--site-bg)]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/site" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--site-accent)] text-white font-bold text-sm">
                A
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--site-text)]">
                Apex Studio
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--site-text-muted)]">
              We craft exceptional digital experiences that transform ideas into
              measurable outcomes for ambitious brands.
            </p>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--site-text-muted)]">
                {title}
              </h4>
              <ul className="mt-4 flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--site-text)] transition-colors hover:text-[var(--site-accent)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[var(--site-border)] pt-8 md:flex-row">
          <p className="text-xs text-[var(--site-text-muted)]">
            2026 Apex Studio. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-[var(--site-text-muted)] hover:text-[var(--site-text)]">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs text-[var(--site-text-muted)] hover:text-[var(--site-text)]">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
