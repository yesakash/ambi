import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
              <Link href="/" className="font-semibold">
                ML Trainer
                <span className="sr-only">Home</span>
              </Link>
              <nav aria-label="Primary" className="flex items-center gap-6 text-sm">
                <Link href="/" className="hover:underline underline-offset-4">
                  Home
                </Link>
                <Link href="/community" className="hover:underline underline-offset-4">
                  Community
                </Link>
                <Link href="/pricing" className="hover:underline underline-offset-4">
                  Pricing
                </Link>
                <Link href="/signin" className="rounded-md border border-border px-3 py-1.5 hover:bg-accent">
                  Sign in
                </Link>
              </nav>
            </div>
          </header>
          {children}
          <Analytics />
          <Toaster />
        </Suspense>
      </body>
    </html>
  )
}
