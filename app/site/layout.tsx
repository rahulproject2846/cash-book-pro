import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Apex Studio | Strategic Design & Digital Consultancy",
  description:
    "We craft exceptional digital experiences that drive growth. Strategy, design, and technology converge at Apex Studio.",
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
