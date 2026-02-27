import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"
import { HeroSection } from "@/components/site/home/HeroSection"
import { PillarsSection } from "@/components/site/home/PillarsSection"
import { ShowcaseSection } from "@/components/site/home/ShowcaseSection"
import { TestimonialsSection } from "@/components/site/home/TestimonialsSection"
import { CtaSection } from "@/components/site/home/CtaSection"

export default function SiteHomePage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <SiteHeader />
      <main>
        <HeroSection />
        <PillarsSection />
        <ShowcaseSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  )
}
