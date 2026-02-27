"use client"

import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import Image from "next/image"
import { Mail, MapPin, Phone, Send, Clock } from "lucide-react"
import { useState } from "react"

const contactInfo = [
  {
    icon: Mail,
    title: "Email us",
    detail: "hello@apexstudio.com",
    description: "We respond within one business day.",
  },
  {
    icon: MapPin,
    title: "Visit us",
    detail: "123 Innovation Drive, Suite 400",
    description: "San Francisco, CA 94107",
  },
  {
    icon: Phone,
    title: "Call us",
    detail: "+1 (415) 555-0192",
    description: "Mon - Fri, 9 AM - 6 PM PT",
  },
  {
    icon: Clock,
    title: "Office hours",
    detail: "Monday - Friday",
    description: "9:00 AM - 6:00 PM Pacific Time",
  },
]

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div data-site className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-12 lg:pt-44 lg:pb-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--site-accent)]">
                Contact
              </p>
              <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-[var(--site-text)] lg:text-6xl">
                Let{"'"}s start a{" "}
                <span className="text-[var(--site-accent)]">conversation</span>
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-[var(--site-text-muted)]">
                Whether you have a project in mind or just want to explore
                possibilities, we are here to listen and advise.
              </p>
            </div>
          </div>
        </section>

        {/* Form + Info */}
        <section className="pb-20 lg:pb-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
              {/* Form */}
              <div className="lg:col-span-3">
                <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-card-bg)] p-8 lg:p-12">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--site-accent)]/10 text-[var(--site-accent)]">
                        <Send className="h-7 w-7" />
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-[var(--site-text)]">
                        Message sent!
                      </h3>
                      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--site-text-muted)]">
                        Thank you for reaching out. We will get back to you within
                        one business day.
                      </p>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="mt-6 rounded-full border border-[var(--site-border)] px-6 py-2.5 text-sm font-semibold text-[var(--site-text)] transition-colors hover:bg-[var(--site-surface)]"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                      <h2 className="text-xl font-bold text-[var(--site-text)]">
                        Get in touch
                      </h2>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="firstName"
                            className="text-xs font-semibold uppercase tracking-widest text-[var(--site-text-muted)]"
                          >
                            First Name
                          </label>
                          <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            required
                            className="rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition-colors placeholder:text-[var(--site-text-muted)]/50 focus:border-[var(--site-accent)]"
                            placeholder="Jane"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="lastName"
                            className="text-xs font-semibold uppercase tracking-widest text-[var(--site-text-muted)]"
                          >
                            Last Name
                          </label>
                          <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required
                            className="rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition-colors placeholder:text-[var(--site-text-muted)]/50 focus:border-[var(--site-accent)]"
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="email"
                          className="text-xs font-semibold uppercase tracking-widest text-[var(--site-text-muted)]"
                        >
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition-colors placeholder:text-[var(--site-text-muted)]/50 focus:border-[var(--site-accent)]"
                          placeholder="jane@company.com"
                        />
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="company"
                            className="text-xs font-semibold uppercase tracking-widest text-[var(--site-text-muted)]"
                          >
                            Company
                          </label>
                          <input
                            id="company"
                            name="company"
                            type="text"
                            className="rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition-colors placeholder:text-[var(--site-text-muted)]/50 focus:border-[var(--site-accent)]"
                            placeholder="Acme Inc."
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="budget"
                            className="text-xs font-semibold uppercase tracking-widest text-[var(--site-text-muted)]"
                          >
                            Budget Range
                          </label>
                          <select
                            id="budget"
                            name="budget"
                            className="rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition-colors focus:border-[var(--site-accent)]"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Select a range
                            </option>
                            <option value="10-25k">$10k - $25k</option>
                            <option value="25-50k">$25k - $50k</option>
                            <option value="50-100k">$50k - $100k</option>
                            <option value="100k+">$100k+</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="message"
                          className="text-xs font-semibold uppercase tracking-widest text-[var(--site-text-muted)]"
                        >
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={5}
                          required
                          className="resize-none rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition-colors placeholder:text-[var(--site-text-muted)]/50 focus:border-[var(--site-accent)]"
                          placeholder="Tell us about your project, goals, and timeline..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="mt-2 inline-flex items-center justify-center gap-2 self-start rounded-full bg-[var(--site-accent)] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[var(--site-accent-hover)]"
                      >
                        Submit
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Info sidebar */}
              <div className="flex flex-col gap-6 lg:col-span-2">
                {/* Image */}
                <div className="overflow-hidden rounded-3xl">
                  <Image
                    src="/images/contact-hero.jpg"
                    alt="Inviting modern office reception area"
                    width={600}
                    height={400}
                    priority
                    className="h-52 w-full object-cover lg:h-64"
                  />
                </div>

                {/* Info cards */}
                {contactInfo.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-2xl border border-[var(--site-border)] bg-[var(--site-card-bg)] p-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--site-accent)]/10 text-[var(--site-accent)]">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--site-text)]">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-sm font-medium text-[var(--site-text)]">
                        {item.detail}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--site-text-muted)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
