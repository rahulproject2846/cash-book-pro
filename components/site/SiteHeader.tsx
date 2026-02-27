"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const navLinks = [
  { href: "/site", label: "Home" },
  { href: "/site/about", label: "About" },
  { href: "/site/services", label: "Services" },
  { href: "/site/contact", label: "Contact" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--site-bg)]/80 backdrop-blur-xl border-b border-[var(--site-border)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/site" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--site-accent)] text-white font-bold text-sm">
            A
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--site-text)]">
            Apex Studio
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex" role="navigation" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--site-accent)] text-white"
                    : "text-[var(--site-text-muted)] hover:text-[var(--site-text)] hover:bg-[var(--site-surface)]"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* CTA */}
        <div className="hidden md:block">
          <Link
            href="/site/contact"
            className="rounded-full bg-[var(--site-text)] px-5 py-2.5 text-sm font-semibold text-[var(--site-bg)] transition-all hover:opacity-80"
          >
            Get in Touch
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--site-surface)] md:hidden"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          <div className="flex flex-col gap-1">
            <span
              className={`block h-0.5 w-5 rounded-full bg-[var(--site-text)] transition-all duration-300 ${
                mobileOpen ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-[var(--site-text)] transition-all duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 rounded-full bg-[var(--site-text)] transition-all duration-300 ${
                mobileOpen ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[73px] z-40 bg-[var(--site-bg)] md:hidden">
          <nav className="flex flex-col gap-2 p-6" aria-label="Mobile navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-2xl px-5 py-4 text-lg font-semibold transition-colors ${
                    isActive
                      ? "bg-[var(--site-accent)] text-white"
                      : "text-[var(--site-text)] hover:bg-[var(--site-surface)]"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/site/contact"
              onClick={() => setMobileOpen(false)}
              className="mt-4 rounded-2xl bg-[var(--site-text)] px-5 py-4 text-center text-lg font-semibold text-[var(--site-bg)]"
            >
              Get in Touch
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
